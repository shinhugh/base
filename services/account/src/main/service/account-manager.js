import { createHash, getHashes } from 'crypto';
import { validate as validateUuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { AccountService } from './account-service.js';
import { wrapError } from '../common.js';
import { IllegalArgumentError as RepositoryIllegalArgumentError, ConflictError as RepositoryConflictError } from '../repository/model/errors.js';
import { PersistentSessionRepository } from '../repository/persistent-session-repository.js';
import { AccountRepository } from '../repository/account-repository.js';
import { RandomService } from './random-service.js';
import { TimeService } from './time-service.js';
import { AccountEventSink } from './account-event-sink.js';
import { IllegalArgumentError, AccessDeniedError, NotFoundError, ConflictError } from './model/errors.js';
import { Role } from './model/role.js';

class AccountManager extends AccountService {
  #persistentSessionRepository;
  #accountRepository;
  #randomService;
  #timeService;
  #accountEventSink;
  #config;

  constructor(persistentSessionRepository, accountRepository, randomService, timeService, accountEventSink, config) {
    super();
    this.#configure(config);
    if (!(persistentSessionRepository instanceof PersistentSessionRepository)) {
      throw new Error('Invalid persistentSessionRepository provided to AccountManager constructor');
    }
    if (!(accountRepository instanceof AccountRepository)) {
      throw new Error('Invalid accountRepository provided to AccountManager constructor');
    }
    if (!(randomService instanceof RandomService)) {
      throw new Error('Invalid randomService provided to AccountManager constructor');
    }
    if (!(timeService instanceof TimeService)) {
      throw new Error('Invalid timeService provided to AccountManager constructor');
    }
    if (!(accountEventSink instanceof AccountEventSink)) {
      throw new Error('Invalid accountEventSink provided to AccountManager constructor');
    }
    this.#persistentSessionRepository = persistentSessionRepository;
    this.#accountRepository = accountRepository;
    this.#randomService = randomService;
    this.#timeService = timeService;
    this.#accountEventSink = accountEventSink;
  }

  async identify(authority, token) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (typeof token !== 'string') {
      throw new IllegalArgumentError();
    }
    const authorizedAsSystem = verifyAuthorityContainsAtLeastOneRole(authority, Role.System);
    if (!authorizedAsSystem) {
      throw new AccessDeniedError();
    }
    const tokenPayload = (() => {
      try {
        return jwt.verify(token, this.#config.tokenSecretKey, {
          algorithms: [ this.#config.tokenAlgorithm ]
        });
      }
      catch (e) {
        if (e instanceof jwt.JsonWebTokenError && e.message === 'invalid algorithm') {
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
      if (!validateId(logoutInfo.accountId)) {
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
    if (!validateId(id)) {
      throw new IllegalArgumentError();
    }
    if (!validateName(name)) {
      throw new IllegalArgumentError();
    }
    const queryContainsPrivateData = name != null;
    const authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin);
    const matches = await (async () => {
      try {
        return await this.#accountRepository.readByIdAndName(id, name);
      }
      catch (e) {
        throw wrapError(e, 'Failed to read from account store');
      }
    })();
    if (matches.length == 0) {
      if (queryContainsPrivateData && !authorizedAsSystemOrAdmin) {
        throw new AccessDeniedError();
      }
      throw new NotFoundError();
    }
    const match = matches[0];
    if (name != null && match.name !== name) {
      if (queryContainsPrivateData && !authorizedAsSystemOrAdmin) {
        throw new AccessDeniedError();
      }
      throw new NotFoundError();
    }
    const owner = match.id === authority?.id;
    if (!authorizedAsSystemOrAdmin && !owner) {
      if (queryContainsPrivateData) {
        throw new AccessDeniedError();
      }
      delete match.name;
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
    if (!validateId(id)) {
      throw new IllegalArgumentError();
    }
    if (!validateName(name)) {
      throw new IllegalArgumentError();
    }
    const authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin);
    if (account == null || !validateAccount(account, authorizedAsSystemOrAdmin)) {
      throw new IllegalArgumentError();
    }
    const authorizedAsSystemOrUserOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.User | Role.Admin);
    if (!authorizedAsSystemOrUserOrAdmin) {
      throw new AccessDeniedError();
    }
    const queryContainsPrivateData = name != null;
    const matches = await (async () => {
      try {
        return await this.#accountRepository.readByIdAndName(id, name);
      }
      catch (e) {
        throw wrapError(e, 'Failed to read from account store');
      }
    })();
    if (matches.length == 0) {
      if (queryContainsPrivateData && !authorizedAsSystemOrAdmin) {
        throw new AccessDeniedError();
      }
      throw new NotFoundError();
    }
    const match = matches[0];
    if (name != null && match.name !== name) {
      if (queryContainsPrivateData && !authorizedAsSystemOrAdmin) {
        throw new AccessDeniedError();
      }
      throw new NotFoundError();
    }
    const owner = match.id === authority?.id;
    if (!authorizedAsSystemOrAdmin && !owner) {
      throw new AccessDeniedError();
    }
    const authorizedAsSystem = verifyAuthorityContainsAtLeastOneRole(authority, Role.System);
    if (!authorizedAsSystem && this.#config.modificationEnabledSessionAgeMaxValue > 0 && (authority?.authTime ?? 0) + this.#config.modificationEnabledSessionAgeMaxValue <= this.#timeService.currentTimeSeconds()) {
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
    if (!validateId(id)) {
      throw new IllegalArgumentError();
    }
    if (!validateName(name)) {
      throw new IllegalArgumentError();
    }
    const authorizedAsSystemOrUserOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.User | Role.Admin);
    if (!authorizedAsSystemOrUserOrAdmin) {
      throw new AccessDeniedError();
    }
    const queryContainsPrivateData = name != null;
    const authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin);
    const matches = await (async () => {
      try {
        return await this.#accountRepository.readByIdAndName(id, name);
      }
      catch (e) {
        throw wrapError(e, 'Failed to read from account store');
      }
    })();
    if (matches.length == 0) {
      if (queryContainsPrivateData && !authorizedAsSystemOrAdmin) {
        throw new AccessDeniedError();
      }
      throw new NotFoundError();
    }
    const match = matches[0];
    if (name != null && match.name !== name) {
      if (queryContainsPrivateData && !authorizedAsSystemOrAdmin) {
        throw new AccessDeniedError();
      }
      throw new NotFoundError();
    }
    const owner = match.id === authority?.id;
    if (!authorizedAsSystemOrAdmin && !owner) {
      throw new AccessDeniedError();
    }
    const authorizedAsSystem = verifyAuthorityContainsAtLeastOneRole(authority, Role.System);
    if (!authorizedAsSystem && this.#config.modificationEnabledSessionAgeMaxValue > 0 && (authority?.authTime ?? 0) + this.#config.modificationEnabledSessionAgeMaxValue <= this.#timeService.currentTimeSeconds()) {
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
    try {
      await this.#accountEventSink.publishAccountDeleteEvent(match.id);
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
    if (account.name !== credentials.name) {
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
    const authorizedAsSystemOrUserOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.User | Role.Admin);
    if (!authorizedAsSystemOrUserOrAdmin) {
      throw new AccessDeniedError();
    }
    const authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin);
    if (!authorizedAsSystemOrAdmin) {
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

  #configure(config) {
    this.#config = { };
    if (config == null) {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    if (typeof config !== 'object') {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    if (typeof config.tokenAlgorithm !== 'string') {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    this.#config.tokenAlgorithm = config.tokenAlgorithm;
    if (!(config.tokenSecretKey instanceof Buffer)) {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    this.#config.tokenSecretKey = config.tokenSecretKey;
    if (typeof config.passwordHashAlgorithm !== 'string') {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    if (getHashes().indexOf(config.passwordHashAlgorithm) < 0) {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    this.#config.passwordHashAlgorithm = config.passwordHashAlgorithm;
    if (!Number.isInteger(config.persistentSessionDuration) || config.persistentSessionDuration < 0 || config.persistentSessionDuration > timeMaxValue) {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    this.#config.persistentSessionDuration = config.persistentSessionDuration;
    if (!Number.isInteger(config.volatileSessionDuration) || config.volatileSessionDuration < 0 || config.volatileSessionDuration > timeMaxValue) {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    this.#config.volatileSessionDuration = config.volatileSessionDuration;
    if (!Number.isInteger(config.modificationEnabledSessionAgeMaxValue) || config.modificationEnabledSessionAgeMaxValue < 0 || config.modificationEnabledSessionAgeMaxValue > timeMaxValue) {
      throw new Error('Invalid config provided to AccountManager constructor');
    }
    this.#config.modificationEnabledSessionAgeMaxValue = config.modificationEnabledSessionAgeMaxValue;
  }
}

const validateId = (id) => {
  if (id == null) {
    return true;
  }
  return validateUuid(id);
};

const validateAuthority = (authority) => {
  if (authority == null) {
    return true;
  }
  if (typeof authority !== 'object') {
    return false;
  }
  if (!validateId(authority.id)) {
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
  AccountManager
};
