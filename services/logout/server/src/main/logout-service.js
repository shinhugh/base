import { IllegalArgumentError } from './errors.js';
import { Role } from './role.js';
import { PersistentSessionService } from './persistent-session-service.js';

class LogoutService {
  #persistentSessionService;

  constructor(persistentSessionService) {
    if (!(persistentSessionService instanceof PersistentSessionService)) {
      throw new IllegalArgumentError();
    }
    this.#persistentSessionService = persistentSessionService;
  }

  async logout(authority, refreshToken) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (refreshToken == null) {
      return;
    }
    if (typeof refreshToken !== 'string') {
      throw new IllegalArgumentError();
    }
    try {
      await this.#persistentSessionService.deleteByRefreshToken(systemAuthority, refreshToken);
    }
    catch { }
  }
}

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

const systemAuthority = { roles: Role.System };
const idLength = 36;
const rolesMaxValue = 255;
const timeMaxValue = 4294967295;

export {
  LogoutService
};
