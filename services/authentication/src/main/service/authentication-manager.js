import { createHash, getHashes } from 'crypto';
import { validate as validateUuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { AuthenticationService } from './authentication-service.js';
import { wrapError } from '../common.js';
import { IllegalArgumentError as RepositoryIllegalArgumentError, NotFoundError as RepositoryNotFoundError, ConflictError as RepositoryConflictError } from '../repository/model/errors.js';
import { PersistentSessionRepository } from '../repository/persistent-session-repository.js';
import { AccountRepository } from '../repository/account-repository.js';
import { RandomService } from './random-service.js';
import { TimeService } from './time-service.js';
import { IllegalArgumentError, AccessDeniedError, NotFoundError, ConflictError } from './model/errors.js';
import { Role } from './model/role.js';

class AuthenticationManager extends AuthenticationService {
  #persistentSessionRepository;
  #accountRepository;
  #randomService;
  #timeService;
  #config;

  constructor(persistentSessionRepository, accountRepository, randomService, timeService, config) {
    super();
    if (!(persistentSessionRepository instanceof PersistentSessionRepository)) {
      throw new Error('Invalid persistentSessionRepository provided to AuthenticationManager constructor');
    }
    if (!(accountRepository instanceof AccountRepository)) {
      throw new Error('Invalid accountRepository provided to AuthenticationManager constructor');
    }
    if (!(randomService instanceof RandomService)) {
      throw new Error('Invalid randomService provided to AuthenticationManager constructor');
    }
    if (!(timeService instanceof TimeService)) {
      throw new Error('Invalid timeService provided to AuthenticationManager constructor');
    }
    if (config == null || !validateConfig(config)) {
      throw new Error('Invalid config provided to AuthenticationManager constructor');
    }
    this.#persistentSessionRepository = persistentSessionRepository;
    this.#accountRepository = accountRepository;
    this.#randomService = randomService;
    this.#timeService = timeService;
    this.#config = {
      tokenAlgorithm: config.tokenAlgorithm,
      tokenSecretKey: config.tokenSecretKey,
      passwordHashAlgorithm: config.passwordHashAlgorithm,
      persistentSessionDuration: config.persistentSessionDuration,
      volatileSessionDuration: config.volatileSessionDuration,
      modificationEnabledSessionAgeMaxValue: config.modificationEnabledSessionAgeMaxValue
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
          algorithms: [ this.#config.tokenAlgorithm ]
        });
      }
      catch (e) {
        if (e instanceof JsonWebTokenError && e.message === 'invalid algorithm') {
          throw wrapError(e, 'Failed to verify JWT');
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
        throw wrapError(e, 'Failed to read from session store');
      }
    })();
    if (persistentSession == null || persistentSession.expirationTime <= this.#timeService.currentTimeSeconds()) {
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
      if (!validateCredentials(loginInfo.credentials)) {
        throw new IllegalArgumentError();
      }
      return await this.#loginViaCredentials(authority, loginInfo.credentials);
    }
    if (loginInfo.refreshToken != null) {
      if (typeof loginInfo.refreshToken !== 'string') {
        throw new IllegalArgumentError();
      }
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
      if (!validateUuid(logoutInfo.accountId)) {
        throw new IllegalArgumentError();
      }
      await this.#logoutViaAccountId(authority, logoutInfo.accountId);
      return;
    }
    if (logoutInfo.refreshToken != null) {
      if (typeof logoutInfo.refreshToken !== 'string') {
        return;
      }
      await this.#logoutViaRefreshToken(authority, logoutInfo.refreshToken);
      return;
    }
    throw new IllegalArgumentError();
  }

  async readAccount(authority, id, name) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (id == null && name == null) {
      throw new IllegalArgumentError();
    }
    if (id != null && !validateUuid(id)) {
      throw new IllegalArgumentError();
    }
    if (!validateName(name)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.User | Role.Admin)) {
      throw new AccessDeniedError();
    }
    const authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin);
    if (!authorizedAsSystemOrAdmin && authority.id == null) {
      throw new AccessDeniedError();
    }
    const matches = await (async () => {
      try {
        return await this.#accountRepository.readByIdAndName(id, name);
      }
      catch (e) {
        throw wrapError(e, 'Failed to read from account store');
      }
    })();
    if (matches.length == 0) {
      if (authorizedAsSystemOrAdmin) {
        throw new NotFoundError();
      }
      throw new AccessDeniedError();
    }
    const match = matches[0];
    if (!authorizedAsSystemOrAdmin && match.id !== authority.id) {
      throw new AccessDeniedError();
    }
    delete match.passwordHash;
    delete match.passwordSalt;
    return match;
  }

  async createAccount(authority, account) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (account == null || !validateAccount(account, false)) {
      throw new IllegalArgumentError();
    }
    const passwordSalt = this.#randomService.generateRandomString(passwordSaltAllowedChars, passwordSaltLength);
    const passwordHash = hashPassword(this.#config.passwordHashAlgorithm, account.password, passwordSalt);
    let entry = {
      name: account.name,
      passwordHash: passwordHash,
      passwordSalt: passwordSalt,
      roles: Role.User
    };
    try {
      entry = await this.#accountRepository.create(entry);
    }
    catch (e) {
      if (e instanceof RepositoryConflictError) {
        throw new ConflictError();
      }
      throw wrapError(e, 'Failed to write to account store');
    }
    delete entry.passwordHash;
    delete entry.passwordSalt;
    return entry;
  }

  async updateAccount(authority, id, name, account) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (id == null && name == null) {
      throw new IllegalArgumentError();
    }
    if (id != null && !validateUuid(id)) {
      throw new IllegalArgumentError();
    }
    if (!validateName(name)) {
      throw new IllegalArgumentError();
    }
    const authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin);
    if (account == null || !validateAccount(account, authorizedAsSystemOrAdmin)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.User | Role.Admin)) {
      throw new AccessDeniedError();
    }
    if (!authorizedAsSystemOrAdmin && authority.id == null) {
      throw new AccessDeniedError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System) && this.#config.modificationEnabledSessionAgeMaxValue > 0 && authority.authTime + this.#config.modificationEnabledSessionAgeMaxValue <= this.#timeService.currentTimeSeconds()) {
      throw new AccessDeniedError();
    }
    let matches;
    try {
      matches = await this.#accountRepository.readByIdAndName(id, name);
    }
    catch (e) {
      throw wrapError(e, 'Failed to read from account store');
    }
    if (matches.length == 0) {
      if (authorizedAsSystemOrAdmin) {
        throw new NotFoundError();
      }
      throw new AccessDeniedError();
    }
    const match = matches[0];
    if (!authorizedAsSystemOrAdmin && match.id !== authority.id) {
      throw new AccessDeniedError();
    }
    const passwordSalt = this.#randomService.generateRandomString(passwordSaltAllowedChars, passwordSaltLength);
    const passwordHash = hashPassword(this.#config.passwordHashAlgorithm, account.password, passwordSalt);
    const roles = authorizedAsSystemOrAdmin ? account.roles : match.roles;
    let entry = {
      name: account.name,
      passwordHash: passwordHash,
      passwordSalt: passwordSalt,
      roles: roles
    };
    try {
      entry = await this.#accountRepository.updateByIdAndName(id, name, entry);
    }
    catch (e) {
      if (e instanceof RepositoryConflictError) {
        throw new ConflictError();
      }
      throw wrapError(e, 'Failed to write to account store');
    }
    try {
      await this.#persistentSessionRepository.deleteByAccountId(entry.id);
    }
    catch { }
    delete entry.passwordHash;
    delete entry.passwordSalt;
    return entry;
  }

  async deleteAccount(authority, id, name) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (id == null && name == null) {
      throw new IllegalArgumentError();
    }
    if (id != null && !validateUuid(id)) {
      throw new IllegalArgumentError();
    }
    if (!validateName(name)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.User | Role.Admin)) {
      throw new AccessDeniedError();
    }
    const authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin);
    if (!authorizedAsSystemOrAdmin && authority.id == null) {
      throw new AccessDeniedError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System) && this.#config.modificationEnabledSessionAgeMaxValue > 0 && authority.authTime + this.#config.modificationEnabledSessionAgeMaxValue <= this.#timeService.currentTimeSeconds()) {
      throw new AccessDeniedError();
    }
    let matches;
    try {
      matches = await this.#accountRepository.readByIdAndName(id, name);
    }
    catch (e) {
      throw wrapError(e, 'Failed to read from account store');
    }
    if (matches.length == 0) {
      if (authorizedAsSystemOrAdmin) {
        throw new NotFoundError();
      }
      throw new AccessDeniedError();
    }
    const match = matches[0];
    if (!authorizedAsSystemOrAdmin && match.id !== authority.id) {
      throw new AccessDeniedError();
    }
    try {
      await this.#accountRepository.deleteByIdAndName(id, name);
    }
    catch (e) {
      throw wrapError(e, 'Failed to write to account store');
    }
    try {
      await this.#persistentSessionRepository.deleteByAccountId(match.id);
    }
    catch { }
  }

  async purgeExpiredSessions() {
    const currentTime = this.#timeService.currentTimeSeconds();
    try {
      await this.#persistentSessionRepository.deleteByLessThanExpirationTime(currentTime);
    }
    catch (e) {
      throw wrapError(e, 'Failed to write to session store');
    }
  }

  async purgeDanglingSessions() {
    // TODO: Implement
  }

  async #loginViaCredentials(authority, credentials) {
    const account = await (async () => {
      let accountMatches;
      try {
        accountMatches = await this.#accountRepository.readByName(credentials.name);
      }
      catch (e) {
        throw wrapError(e, 'Failed to read from account store');
      }
      return accountMatches[0];
    })();
    if (account == null) {
      throw new AccessDeniedError();
    }
    const passwordHash = hashPassword(this.#config.passwordHashAlgorithm, credentials.password, account.passwordSalt);
    if (passwordHash !== account.passwordHash) {
      throw new AccessDeniedError();
    }
    let refreshToken;
    const persistentSession = await (async () => {
      while (true) {
        refreshToken = this.#randomService.generateRandomString(refreshTokenAllowedChars, refreshTokenLength);
        const currentTime = this.#timeService.currentTimeSeconds();
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
            throw wrapError(e, 'Failed to write to session store');
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
      catch (e) {
        try {
          await this.#persistentSessionRepository.deleteByRefreshToken(refreshToken);
        }
        catch {
          throw wrapError(e, 'Failed to create JWT; Failed to write to session store');
        }
        throw wrapError(e, 'Failed to create JWT');
      }
    })();
    return {
      refreshToken: persistentSession.refreshToken,
      idToken: idToken
    };
  }

  async #loginViaRefreshToken(authority, refreshToken) {
    const persistentSession = await (async () => {
      try {
        return (await this.#persistentSessionRepository.readByRefreshToken(refreshToken))[0];
      }
      catch (e) {
        if (e instanceof RepositoryIllegalArgumentError) {
          return undefined;
        }
        throw wrapError(e, 'Failed to read from session store');
      }
    })();
    if (persistentSession == null) {
      throw new AccessDeniedError();
    }
    const currentTime = this.#timeService.currentTimeSeconds();
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
      catch (e) {
        throw wrapError(e, 'Failed to create JWT');
      }
    })();
    return {
      idToken: idToken
    };
  }

  async #logoutViaAccountId(authority, accountId) {
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.User | Role.Admin)) {
      throw new AccessDeniedError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin)) {
      if (authority.id !== accountId) {
        throw new AccessDeniedError();
      }
    }
    try {
      await this.#persistentSessionRepository.deleteByAccountId(accountId);
    }
    catch (e) {
      throw wrapError(e, 'Failed to write to session store');
    }
  }

  async #logoutViaRefreshToken(authority, refreshToken) {
    try {
      await this.#persistentSessionRepository.deleteByRefreshToken(refreshToken);
    }
    catch (e) {
      if (e instanceof RepositoryIllegalArgumentError) {
        return;
      }
      throw wrapError(e, 'Failed to write to session store');
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
  if (!Number.isInteger(config.modificationEnabledSessionAgeMaxValue) || config.modificationEnabledSessionAgeMaxValue < 0 || config.modificationEnabledSessionAgeMaxValue > timeMaxValue) {
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
  if (authority.id != null && !validateUuid(authority.id)) {
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

const validateName = (name) => {
  if (name == null) {
    return true;
  }
  if (typeof name !== 'string' || name.length < nameMinLength || name.length > nameMaxLength) {
    return false;
  }
  for (let i = 0; i < name.length; i++) {
    if (!nameAllowedChars.includes(name[i])) {
      return false;
    }
  }
  return true;
};

const validatePassword = (password) => {
  if (password == null) {
    return true;
  }
  if (typeof password !== 'string' || password.length < passwordMinLength || password.length > passwordMaxLength) {
    return false;
  }
  for (let i = 0; i < password.length; i++) {
    if (!passwordAllowedChars.includes(password[i])) {
      return false;
    }
  }
  return true;
};

const validateAccount = (account, validateRoles) => {
  if (account == null) {
    return true;
  }
  if (account.name == null || !validateName(account.name)) {
    return false;
  }
  if (account.password == null || !validatePassword(account.password)) {
    return false;
  }
  return !validateRoles || (Number.isInteger(account.roles) && account.roles >= 0 && account.roles <= rolesMaxValue);
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

const rolesMaxValue = 255;
const timeMaxValue = 4294967295;
const refreshTokenAllowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const refreshTokenLength = 128;
const nameAllowedChars = '-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
const nameMinLength = 4;
const nameMaxLength = 32;
const passwordAllowedChars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
const passwordMinLength = 8;
const passwordMaxLength = 32;
const passwordSaltAllowedChars = passwordAllowedChars;
const passwordSaltLength = 32;

export {
  AuthenticationManager
};
