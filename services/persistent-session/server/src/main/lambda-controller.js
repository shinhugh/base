import { IllegalArgumentError } from './errors.js';
import { PersistentSessionService } from './persistent-session-service.js';

// TODO: Remove comments

// request: object
// request.function: string
// request.authority: object (optional)
// request.authority.id: string (optional)
// request.authority.roles: number (unsigned 8-bit int) (optional)
// request.arguments: [any] (optional)
const handler = async (request) => {
  try {
    if (typeof request !== 'object' || (request.arguments != null && Object.prototype.toString.call(request.arguments) !== '[object Array]')) {
      throw new IllegalArgumentError();
    }
    return {
      payload: await (async () => {
        switch(request.function) {
          case 'create':
            return await (async () => {
              const persistentSession = (request.arguments != null && request.arguments.length >= 1) ? request.arguments?.[0] : undefined;
              return await persistentSessionService.create(request.authority, persistentSession);
            })();
          case 'readById':
            return await (async () => {
              const id = (request.arguments != null && request.arguments.length >= 1) ? request.arguments?.[0] : undefined;
              return await persistentSessionService.readById(request.authority, id);
            })();
          case 'readByRefreshToken':
            return await (async () => {
              const refreshToken = (request.arguments != null && request.arguments.length >= 1) ? request.arguments?.[0] : undefined;
              return await persistentSessionService.readByRefreshToken(request.authority, refreshToken);
            })();
          case 'deleteByUserAccountId':
            return await (async () => {
              const userAccountId = (request.arguments != null && request.arguments.length >= 1) ? request.arguments?.[0] : undefined;
              return await persistentSessionService.deleteByUserAccountId(request.authority, userAccountId);
            })();
          case 'deleteByRefreshToken':
            return await (async () => {
              const refreshToken = (request.arguments != null && request.arguments.length >= 1) ? request.arguments?.[0] : undefined;
              return await persistentSessionService.deleteByRefreshToken(request.authority, refreshToken);
            })();
          default:
            throw new IllegalArgumentError();
        }
      })()
    };
  }
  catch (e) {
    console.log('Error thrown: ' + e.message);
    return {
      result: e.constructor.name
    };
  }
};

const persistentSessionService = new PersistentSessionService({
  host: process.env.AUTH_DB_HOST,
  port: Number(process.env.AUTH_DB_PORT),
  database: process.env.AUTH_DB_DATABASE,
  username: process.env.AUTH_DB_USERNAME,
  password: process.env.AUTH_DB_PASSWORD
});

export {
  handler
};
