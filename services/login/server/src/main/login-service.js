import { createHash } from 'crypto';
import { validate as validateUuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { IllegalArgumentError, AccessDeniedError, NotFoundError, ConflictError } from './errors.js';
import { Role } from './role.js';
import { PersistentSessionService } from './persistent-session-service.js';
import { UserAccountService } from './user-account-service.js';

class LoginService {
  #persistentSessionService;
  #userAccountService;
  #encryptionInfo;

  constructor(persistentSessionService, userAccountService, encryptionInfo) {
    if (!(persistentSessionService instanceof PersistentSessionService)) {
      throw new IllegalArgumentError();
    }
    if (!(userAccountService instanceof UserAccountService)) {
      throw new IllegalArgumentError();
    }
    if (encryptionInfo == null || !validateEncryptionInfo(encryptionInfo)) {
      throw new IllegalArgumentError();
    }
    this.#persistentSessionService = persistentSessionService;
    this.#userAccountService = userAccountService;
    this.#encryptionInfo = {
      algorithm: encryptionInfo.algorithm,
      secretKey: encryptionInfo.secretKey
    };
  }

  async loginViaCredentials(authority, credentials) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (credentials == null || !validateCredentials(credentials)) {
      throw new IllegalArgumentError();
    }
    const userAccount = await (async () => {
      try {
        return await this.#userAccountService.readByName(systemAuthority, credentials.name);
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
    const persistentSession = await this.#persistentSessionService.create(systemAuthority, {
      userAccountId: userAccount.id,
      roles: userAccount.roles
    });
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

  async loginViaRefreshToken(authority, refreshToken) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (typeof refreshToken !== 'string') {
      throw new IllegalArgumentError();
    }
    const persistentSession = await (async () => {
      try {
        return await this.#persistentSessionService.readByRefreshToken(systemAuthority, refreshToken);
      }
      catch (e) {
        if (e instanceof IllegalArgumentError || e instanceof NotFoundError) {
          throw new AccessDeniedError();
        }
        throw e;
      }
    })();
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

const hashPassword = (password, salt) => {
  return createHash('sha256').update(password + salt).digest('hex');
};

const systemAuthority = { roles: Role.System };
const rolesMaxValue = 255;
const timeMaxValue = 4294967295;
const jwtDuration = 86400;

export {
  LoginService
};
