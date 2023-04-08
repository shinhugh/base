import { createHash } from 'crypto';
import { validate as validateUuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { AccessDeniedError, IllegalArgumentError, NotFoundError, ConflictError } from '../model/errors.js';
import { Role } from '../model/role.js';
import { PersistentSessionRepository } from '../repository/persistent-session-repository.js';
import { UserAccountServiceClient } from './user-account-service-client.js';

class AuthenticationService {
  #persistentSessionRepository;
  #userAccountServiceClient;
  #encryptionInfo;

  constructor(persistentSessionRepository, userAccountServiceClient, encryptionInfo) {
    if (!(persistentSessionRepository instanceof PersistentSessionRepository)) {
      throw new Error();
    }
    if (!(userAccountServiceClient instanceof UserAccountServiceClient)) {
      throw new Error();
    }
    if (encryptionInfo == null || !validateEncryptionInfo(encryptionInfo)) {
      throw new Error();
    }
    this.#persistentSessionRepository = persistentSessionRepository;
    this.#userAccountServiceClient = userAccountServiceClient;
    this.#encryptionInfo = {
      algorithm: encryptionInfo.algorithm,
      secretKey: encryptionInfo.secretKey
    };
  }

  async identify(authority, token) {
    if (!validateAuthority(authority)) {
      throw new Error();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System)) {
      throw new AccessDeniedError();
    }
    if (typeof token !== 'string') {
      throw new IllegalArgumentError();
    }
    const tokenPayload = (() => {
      try {
        return jwt.verify(token, this.#encryptionInfo.secretKey, {
          algorithms: [this.#encryptionInfo.algorithm]
        });
      }
      catch {
        return null;
      }
    })();
    const persistentSession = await (async () => {
      try {
        return (await this.#persistentSessionRepository.readById(tokenPayload.sessionId))[0];
      }
      catch (e) {
        if (e instanceof IllegalArgumentError) {
          return undefined;
        }
        throw e;
      }
    })();
    if (persistentSession == null || persistentSession.expirationTime <= (Date.now() / 1000)) {
      return { };
    }
    return {
      id: persistentSession.userAccountId,
      roles: persistentSession.roles,
      authTime: persistentSession.creationTime
    };
  }

  async login(authority, loginInfo) {
    if (!validateAuthority(authority)) {
      throw new Error();
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
      throw new Error();
    }
    if (logoutInfo == null || typeof logoutInfo !== 'object') {
      throw new IllegalArgumentError();
    }
    if (logoutInfo.userAccountId != null) {
      await this.#logoutViaUserAccountId(authority, logoutInfo.userAccountId);
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
    const userAccount = await (async () => {
      try {
        return await this.#userAccountServiceClient.readByName(systemAuthority, credentials.name);
      }
      catch (e) {
        if (e instanceof IllegalArgumentError || e instanceof NotFoundError) {
          throw new AccessDeniedError();
        }
        throw e;
      }
    })();
    const passwordHash = hashPassword(credentials.password, userAccount.passwordSalt);
    if (passwordHash !== userAccount.passwordHash) {
      throw new AccessDeniedError();
    }
    const persistentSession = await (async () => {
      while (true) {
        const refreshToken = generateRandomString(refreshTokenAllowedChars, refreshTokenLength);
        const currentTime = Math.floor(Date.now() / 1000);
        try {
          return await this.#persistentSessionRepository.create({
            userAccountId: userAccount.id,
            roles: userAccount.roles,
            refreshToken: refreshToken,
            creationTime: currentTime,
            expirationTime: currentTime + sessionDuration
          });
        }
        catch (e) {
          if (!(e instanceof ConflictError)) {
            throw e;
          }
        }
      }
    })();
    const idToken = jwt.sign({
      sessionId: persistentSession.id,
      iat: persistentSession.creationTime,
      exp: persistentSession.creationTime + jwtDuration
    }, this.#encryptionInfo.secretKey, {
      algorithm: this.#encryptionInfo.algorithm
    });
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
        if (e instanceof IllegalArgumentError) {
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
    const idToken = jwt.sign({
      sessionId: persistentSession.id,
      iat: currentTime,
      exp: currentTime + jwtDuration
    }, this.#encryptionInfo.secretKey, {
      algorithm: this.#encryptionInfo.algorithm
    });
    return {
      idToken: idToken
    };
  }

  async #logoutViaUserAccountId(authority, userAccountId) {
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin | Role.User)) {
      throw new AccessDeniedError();
    }
    if (typeof userAccountId !== 'string' || !validateUuid(userAccountId)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin)) {
      if (authority.id !== userAccountId) {
        throw new AccessDeniedError();
      }
    }
    await this.#persistentSessionRepository.deleteByUserAccountId(userAccountId);
  }

  async #logoutViaRefreshToken(authority, refreshToken) {
    try {
      await this.#persistentSessionRepository.deleteByRefreshToken(refreshToken);
    }
    catch (e) {
      if (e instanceof IllegalArgumentError) {
        return;
      }
      throw e;
    }
  }
}

const validateEncryptionInfo = (encryptionInfo) => {
  if (encryptionInfo == null) {
    return true;
  }
  if (typeof encryptionInfo !== 'object') {
    return false;
  }
  if (typeof encryptionInfo.algorithm !== 'string') {
    return false;
  }
  if (!(encryptionInfo.secretKey instanceof Buffer)) {
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
  if (!validateAuthority(authority) || (roles != null && (!Number.isInteger(roles) || roles < 0 || roles > rolesMaxValue))) {
    throw new Error();
  }
  if (roles == null || roles == 0) {
    return true;
  }
  if (authority == null || authority.roles == null) {
    return false;
  }
  return (authority.roles & roles) != 0;
};

const hashPassword = (password, salt) => {
  return createHash('sha256').update(password + salt).digest('hex');
};

const generateRandomString = (pool, length) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return result;
};

const systemAuthority = { roles: Role.System };
const rolesMaxValue = 255;
const timeMaxValue = 4294967295;
const refreshTokenAllowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const refreshTokenLength = 128;
const sessionDuration = 1209600;
const jwtDuration = 86400;

export {
  AuthenticationService
};
