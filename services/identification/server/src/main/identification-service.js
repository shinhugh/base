import jwt from 'jsonwebtoken';
import { IllegalArgumentError, AccessDeniedError } from './errors.js';
import { Role } from './role.js';
import { PersistentSessionService } from './persistent-session-service.js';

class IdentificationService {
  #persistentSessionService;
  #encryptionInfo;

  constructor(persistentSessionService, encryptionInfo) {
    if (!(persistentSessionService instanceof PersistentSessionService)) {
      throw new IllegalArgumentError();
    }
    if (encryptionInfo == null || !validateEncryptionInfo(encryptionInfo)) {
      throw new IllegalArgumentError();
    }
    this.#persistentSessionService = persistentSessionService;
    this.#encryptionInfo = {
      algorithm: encryptionInfo.algorithm,
      secretKey: encryptionInfo.secretKey
    };
  }

  async identify(authority, token) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (authority == null || authority.roles == null || (authority.roles & Role.System) == 0) {
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
    if (tokenPayload == null) {
      return { };
    }
    const persistentSession = await (async () => {
      try {
        return await this.#persistentSessionService.readById(authority, tokenPayload.sessionId);
      }
      catch {
        return null;
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
  if (authority.id != null && (typeof authority.id !== 'string' || authority.id.length != idLength)) {
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

const idLength = 36;
const rolesMaxValue = 255;
const timeMaxValue = 4294967295;

export {
  IdentificationService
};
