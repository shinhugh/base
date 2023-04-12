import { createHash, getHashes } from 'crypto';
import { validate as validateUuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { RepositoryIllegalArgumentError, RepositoryConflictError } from '../repository/model/errors.js';
import { PersistentSessionRepository } from '../repository/persistent-session-repository.js';
import { AccessDeniedError, IllegalArgumentError, NotFoundError, ConflictError } from './model/errors.js';
import { Role } from './model/role.js';
import { AccountServiceClient } from './account-service-client.js';

class AuthenticationService {
  #persistentSessionRepository;
  #accountServiceClient;
  #config;

  constructor(persistentSessionRepository, accountServiceClient, config) {
    if (!(persistentSessionRepository instanceof PersistentSessionRepository)) {
      throw new Error('Invalid persistentSessionRepository provided to AuthenticationService constructor');
    }
    if (!(accountServiceClient instanceof AccountServiceClient)) {
      throw new Error('Invalid accountServiceClient provided to AuthenticationService constructor');
    }
    if (config == null || !validateConfig(config)) {
      throw new Error('Invalid config provided to AuthenticationService constructor');
    }
    this.#persistentSessionRepository = persistentSessionRepository;
    this.#accountServiceClient = accountServiceClient;
    this.#config = {
      tokenAlgorithm: config.tokenAlgorithm,
      tokenSecretKey: config.tokenSecretKey,
      passwordHashAlgorithm: config.passwordHashAlgorithm,
      persistentSessionDuration: config.persistentSessionDuration,
      volatileSessionDuration: config.volatileSessionDuration
    };
  }

  async identify(authority, token) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (typeof token !== 'string') {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System)) {
      throw new AccessDeniedError();
    }
    const tokenPayload = (() => {
      try {
        return jwt.verify(token, this.#config.tokenSecretKey, {
          algorithms: [this.#config.tokenAlgorithm]
        });
      }
      catch (e) {
        if (e instanceof JsonWebTokenError && e.message === 'invalid algorithm') {
          throw new Error('Unexpected error when calling jwt.verify()')
        }
        return null;
      }
    })();
    if (tokenPayload == null) {
      return { };
    }
    const persistentSession = await (async () => {
      try {
        return (await this.#persistentSessionRepository.readById(tokenPayload.sessionId))[0];
      }
      catch (e) {
        if (e instanceof RepositoryIllegalArgumentError) {
          return undefined;
        }
        throw e;
      }
    })();
    if (persistentSession == null || persistentSession.expirationTime <= (Date.now() / 1000)) {
      return { };
    }
    return {
      id: persistentSession.accountId,
      roles: persistentSession.roles,
      authTime: persistentSession.creationTime
    };
  }

  async login(authority, loginInfo) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (loginInfo == null || typeof loginInfo !== 'object') {
      throw new IllegalArgumentError();
    }
    if (loginInfo.credentials != null) {
      return await this.#loginViaCredentials(authority, loginInfo.credentials);
    }
    if (loginInfo.refreshToken != null) {
      return await this.#loginViaRefreshToken(authority, loginInfo.refreshToken);
    }
    throw new IllegalArgumentError();
  }

  async logout(authority, logoutInfo) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (logoutInfo == null || typeof logoutInfo !== 'object') {
      throw new IllegalArgumentError();
    }
    if (logoutInfo.accountId != null) {
      await this.#logoutViaAccountId(authority, logoutInfo.accountId);
      return;
    }
    if (logoutInfo.refreshToken != null) {
      await this.#logoutViaRefreshToken(authority, logoutInfo.refreshToken);
      return;
    }
    throw new IllegalArgumentError();
  }

  async #loginViaCredentials(authority, credentials) {
    if (!validateCredentials(credentials)) {
      throw new IllegalArgumentError();
    }
    const account = await (async () => {
      try {
        return await this.#accountServiceClient.read(systemAuthority, credentials.name);
      }
      catch (e) {
        if (e instanceof IllegalArgumentError || e instanceof NotFoundError) {
          throw new AccessDeniedError();
        }
        throw e;
      }
    })();
    const passwordHash = hashPassword(this.#config.passwordHashAlgorithm, credentials.password, account.passwordSalt);
    if (passwordHash !== account.passwordHash) {
      throw new AccessDeniedError();
    }
    let refreshToken;
    const persistentSession = await (async () => {
      while (true) {
        refreshToken = generateRandomString(refreshTokenAllowedChars, refreshTokenLength);
        const currentTime = Math.floor(Date.now() / 1000);
        try {
          return await this.#persistentSessionRepository.create({
            accountId: account.id,
            roles: account.roles,
            refreshToken: refreshToken,
            creationTime: currentTime,
            expirationTime: this.#config.persistentSessionDuration > 0 ? (currentTime + this.#config.persistentSessionDuration) : timeMaxValue
          });
        }
        catch (e) {
          if (!(e instanceof RepositoryConflictError)) {
            throw e;
          }
        }
      }
    })();
    const idToken = await (async () => {
      try {
        return jwt.sign({
          sessionId: persistentSession.id,
          iat: persistentSession.creationTime,
          exp: this.#config.volatileSessionDuration > 0 ? (persistentSession.creationTime + this.#config.volatileSessionDuration) : timeMaxValue
        }, this.#config.tokenSecretKey, {
          algorithm: this.#config.tokenAlgorithm
        });
      }
      catch {
        try {
          await this.#persistentSessionRepository.deleteByRefreshToken(refreshToken);
        }
        catch {
          throw new Error('Unexpected error when calling jwt.sign(); failed to revert PersistentSession creation');
        }
        throw new Error('Unexpected error when calling jwt.sign()');
      }
    })();
    return {
      refreshToken: persistentSession.refreshToken,
      idToken: idToken
    };
  }

  async #loginViaRefreshToken(authority, refreshToken) {
    if (typeof refreshToken !== 'string') {
      throw new IllegalArgumentError();
    }
    const persistentSession = await (async () => {
      try {
        return (await this.#persistentSessionRepository.readByRefreshToken(refreshToken))[0];
      }
      catch (e) {
        if (e instanceof RepositoryIllegalArgumentError) {
          return undefined;
        }
        throw e;
      }
    })();
    if (persistentSession == null) {
      throw new AccessDeniedError();
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (persistentSession.expirationTime <= currentTime) {
      throw new AccessDeniedError();
    }
    const idToken = (() => {
      try {
        return jwt.sign({
          sessionId: persistentSession.id,
          iat: currentTime,
          exp: this.#config.volatileSessionDuration > 0 ? (currentTime + this.#config.volatileSessionDuration) : timeMaxValue
        }, this.#config.tokenSecretKey, {
          algorithm: this.#config.tokenAlgorithm
        });
      }
      catch {
        throw new Error('Unexpected error when calling jwt.sign()');
      }
    })();
    return {
      idToken: idToken
    };
  }

  async #logoutViaAccountId(authority, accountId) {
    if (typeof accountId !== 'string' || !validateUuid(accountId)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin | Role.User)) {
      throw new AccessDeniedError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin)) {
      if (authority.id !== accountId) {
        throw new AccessDeniedError();
      }
    }
    await this.#persistentSessionRepository.deleteByAccountId(accountId);
  }

  async #logoutViaRefreshToken(authority, refreshToken) {
    if (typeof refreshToken !== 'string') {
      return;
    }
    try {
      await this.#persistentSessionRepository.deleteByRefreshToken(refreshToken);
    }
    catch (e) {
      if (e instanceof RepositoryIllegalArgumentError) {
        return;
      }
      throw e;
    }
  }
}

const validateConfig = (config) => {
  if (config == null) {
    return true;
  }
  if (typeof config !== 'object') {
    return false;
  }
  if (typeof config.tokenAlgorithm !== 'string') {
    return false;
  }
  if (!(config.tokenSecretKey instanceof Buffer)) {
    return false;
  }
  if (typeof config.passwordHashAlgorithm !== 'string') {
    return false;
  }
  if (getHashes().indexOf(config.passwordHashAlgorithm) < 0) {
    return false;
  }
  if (!Number.isInteger(config.persistentSessionDuration) || config.persistentSessionDuration < 0 || config.persistentSessionDuration > timeMaxValue) {
    return false;
  }
  if (!Number.isInteger(config.volatileSessionDuration) || config.volatileSessionDuration < 0 || config.volatileSessionDuration > timeMaxValue) {
    return false;
  }
  return true;
};

const validateAuthority = (authority) => {
  if (authority == null) {
    return true;
  }
  if (typeof authority !== 'object') {
    return false;
  }
  if (authority.id != null && (typeof authority.id !== 'string' || !validateUuid(authority.id))) {
    return false;
  }
  if (authority.roles != null && (!Number.isInteger(authority.roles) || authority.roles < 0 || authority.roles > rolesMaxValue)) {
    return false;
  }
  if (authority.authTime != null && (!Number.isInteger(authority.authTime) || authority.authTime < 0 || authority.authTime > timeMaxValue)) {
    return false;
  }
  return true;
};

const validateCredentials = (credentials) => {
  if (credentials == null) {
    return true;
  }
  if (typeof credentials !== 'object') {
    return false;
  }
  if (typeof credentials.name !== 'string') {
    return false;
  }
  if (typeof credentials.password !== 'string') {
    return false;
  }
  return true;
};

const verifyAuthorityContainsAtLeastOneRole = (authority, roles) => {
  if (roles == null || roles == 0) {
    return true;
  }
  if (authority == null || authority.roles == null) {
    return false;
  }
  return (authority.roles & roles) != 0;
};

const hashPassword = (algorithm, password, salt) => {
  return createHash(algorithm).update(password + salt).digest('hex');
};

const generateRandomString = (pool, length) => {
  let output = '';
  for (let i = 0; i < length; i++) {
    output += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return output;
};

const systemAuthority = { roles: Role.System };
const rolesMaxValue = 255;
const timeMaxValue = 4294967295;
const refreshTokenAllowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const refreshTokenLength = 128;

export {
  AuthenticationService
};
