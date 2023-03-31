import { PersistentSessionServiceServer, PersistentSession, Role, IllegalArgumentError } from './service.js';

// request: object
// request.authority: object (optional)
// request.authority.id: string (optional)
// request.authority.roles: [string] (optional)
// request.function: string
// request.arguments: [any] (optional)
export const handler = async (request) => {
  try {
    if (typeof request !== 'object' || (request.arguments != null && Object.prototype.toString.call(request.arguments) !== '[object Array]')) {
      throw new IllegalArgumentError();
    }
    const authority = translateBitFlagsToRoleArrayInAuthorityObjectIfPossible(request.authority);
    const args = request.arguments;
    return {
      payload: await (async () => {
        switch(request.function) {
          case 'create':
            return await (async () => {
              const persistentSession = (args != null && args.length >= 1) ? translatePlainObjectToPersistentSessionIfPossible(args?.[0]) : undefined;
              return await service.create(authority, persistentSession);
            })();
          case 'readById':
            return await (async () => {
              const id = (args != null && args.length >= 1) ? args?.[0] : undefined;
              return await service.readById(authority, id);
            })();
          case 'readByRefreshToken':
            return await (async () => {
              const refreshToken = (args != null && args.length >= 1) ? args?.[0] : undefined;
              return await service.readByRefreshToken(authority, refreshToken);
            })();
          case 'deleteByUserAccountId':
            return await (async () => {
              const userAccountId = (args != null && args.length >= 1) ? args?.[0] : undefined;
              return await service.deleteByUserAccountId(authority, userAccountId);
            })();
          case 'deleteByRefreshToken':
            return await (async () => {
              const refreshToken = (args != null && args.length >= 1) ? args?.[0] : undefined;
              return await service.deleteByRefreshToken(authority, refreshToken);
            })();
          default:
            throw new IllegalArgumentError();
        }
      })()
    };
  }
  catch (e) {
    return {
      result: e.constructor.name
    };
  }
};

const translatePlainObjectToPersistentSessionIfPossible = (object) => {
  try {
    const roles = translateBitFlagsToRoleArray(object.roles);
    return new PersistentSession(object.id, object.userAccountId, roles, object.refreshToken, object.creationTime, object.expirationTime);
  }
  catch {
    return object;
  }
};

const translateBitFlagsToRoleArrayInAuthorityObjectIfPossible = (object) => {
  try {
    const roles = translateBitFlagsToRoleArray(object.roles);
    return {
      id: object.id,
      roles: roles
    };
  }
  catch {
    return object;
  }
};

const translateBitFlagsToRoleArray = (bitFlags) => {
  if (bitFlags == null) {
    return bitFlags;
  }
  if (!Number.isInteger(bitFlags)) {
    throw new IllegalArgumentError();
  }
  const roleArray = [];
  let remainingFlags = bitFlags;
  let index = 0;
  while (remainingFlags > 0) {
    if (index >= roleBitFlagOrder.length) {
      break;
    }
    if (remainingFlags % 2 > 0) {
      roleArray.push(roleBitFlagOrder[index]);
    }
    remainingFlags = Math.floor(remainingFlags / 2);
    index++;
  }
  return roleArray;
};

const roleBitFlagOrder = [Role.System, Role.User, Role.Admin];
const service = new PersistentSessionServiceServer({
  host: process.env.AUTH_DB_HOST,
  port: process.env.AUTH_DB_PORT,
  database: process.env.AUTH_DB_DATABASE,
  username: process.env.AUTH_DB_USERNAME,
  password: process.env.AUTH_DB_PASSWORD
});
