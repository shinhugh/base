import { PersistentSessionSequelizeRepository } from './repository/persistent-session-sequelize-repository.js';
import { AccountSequelizeRepository } from './repository/account-sequelize-repository.js';
import { AuthenticationManager } from './service/authentication-manager.js';
import { AuthenticationController } from './controller/authentication-controller.js';
import { Server } from './server.js';

// Use environment variables for production; hard-coded for testing only
const config = {
  persistentSessionSequelizeRepository: {
    host: 'localhost',
    port: 3306,
    database: 'base',
    username: 'root',
    password: ''
  },
  accountSequelizeRepository: {
    host: 'localhost',
    port: 3306,
    database: 'base',
    username: 'root',
    password: ''
  },
  authenticationManager: {
    tokenAlgorithm: 'HS256',
    tokenSecretKey: Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64'),
    passwordHashAlgorithm: 'sha256',
    persistentSessionDuration: 1209600,
    volatileSessionDuration: 86400,
    modificationEnabledSessionAgeMaxValue: 900
  },
  server: {
    endpoints: {
      '/identify': {
        get: async (request) => {
          return await authenticationController.identify(request);
        }
      },
      '/login': {
        post: async (request) => {
          return await authenticationController.login(request);
        }
      },
      '/logout': {
        post: async (request) => {
          return await authenticationController.logout(request);
        }
      },
      '/account': {
        get: async (request) => {
          return await authenticationController.readAccount(request);
        },
        post: async (request) => {
          return await authenticationController.createAccount(request);
        },
        put: async (request) => {
          return await authenticationController.updateAccount(request);
        },
        delete: async (request) => {
          return await authenticationController.deleteAccount(request);
        }
      }
    },
    internalErrorCallback: async (request) => {
      return {
        status: 500
      };
    },
    notFoundCallback: async (request) => {
      return {
        status: 404
      };
    },
    methodNotAllowedCallback: async (request) => {
      return {
        status: 405
      };
    },
    port: 8081
  }
};

const persistentSessionSequelizeRepository = new PersistentSessionSequelizeRepository(config.persistentSessionSequelizeRepository);
const accountSequelizeRepository = new AccountSequelizeRepository(config.accountSequelizeRepository);
const authenticationManager = new AuthenticationManager(persistentSessionSequelizeRepository, accountSequelizeRepository, config.authenticationManager);
const authenticationController = new AuthenticationController(authenticationManager);
const server = new Server(config.server);

server.start();

let purgeExpiredSessionsFailCount = 0;
let purgeExpiredSessionsInterval = setInterval(() => {
  try {
    authenticationManager.purgeExpiredSessions();
    purgeExpiredSessionsFailCount = 0;
  }
  catch {
    purgeExpiredSessionsFailCount++;
    if (purgeExpiredSessionsFailCount == 3) {
      clearInterval(purgeExpiredSessionsInterval);
      console.error('Failed to purge expired sessions; canceled task');
    }
    else {
      console.error('Failed to purge expired sessions');
    }
  }
}, 60000);

let purgeDanglingSessionsFailCount = 0;
let purgeDanglingSessionsInterval = setInterval(() => {
  try {
    authenticationManager.purgeDanglingSessions();
    purgeDanglingSessionsFailCount = 0;
  }
  catch {
    purgeDanglingSessionsFailCount++;
    if (purgeDanglingSessionsFailCount == 3) {
      clearInterval(purgeDanglingSessionsInterval);
      console.error('Failed to purge dangling sessions; canceled task');
    }
    else {
      console.error('Failed to purge dangling sessions');
    }
  }
}, 3600000);
