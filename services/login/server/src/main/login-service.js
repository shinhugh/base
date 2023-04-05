import jwt from 'jsonwebtoken';
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

  // TODO: Implement
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
  LoginService
};
