import amqplib from 'amqplib';
import { PersistentSessionSequelizeRepository } from './repository/persistent-session-sequelize-repository.js';
import { AccountSequelizeRepository } from './repository/account-sequelize-repository.js';
import { RandomManager } from './service/random-manager.js';
import { TimeManager } from './service/time-manager.js';
import { EventSinkBridge } from './service/event-sink-bridge.js';
import { AccountManager } from './service/account-manager.js';
import { AccountHttpController } from './controller/account-http-controller.js';
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
  accountDeleteEventSinkBridge: {
    exchangeName: 'account',
    exchangeType: 'direct',
    routingKey: 'account.delete'
  },
  accountManager: {
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
          return await accountHttpController.identify(request);
        }
      },
      '/login': {
        post: async (request) => {
          return await accountHttpController.login(request);
        }
      },
      '/logout': {
        post: async (request) => {
          return await accountHttpController.logout(request);
        }
      },
      '/account': {
        get: async (request) => {
          return await accountHttpController.readAccount(request);
        },
        post: async (request) => {
          return await accountHttpController.createAccount(request);
        },
        put: async (request) => {
          return await accountHttpController.updateAccount(request);
        },
        delete: async (request) => {
          return await accountHttpController.deleteAccount(request);
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

let amqpConnection;
let amqpChannel;
let persistentSessionSequelizeRepository;
let accountSequelizeRepository;
let randomManager;
let timeManager;
let accountDeleteEventSinkBridge;
let accountManager;
let accountHttpController;
let server;

(async () => {
  amqpConnection = await amqplib.connect('amqp://localhost:5672');
  amqpChannel = await amqpConnection.createChannel();
  persistentSessionSequelizeRepository = new PersistentSessionSequelizeRepository(config.persistentSessionSequelizeRepository);
  accountSequelizeRepository = new AccountSequelizeRepository(config.accountSequelizeRepository);
  randomManager = new RandomManager();
  timeManager = new TimeManager();
  accountDeleteEventSinkBridge = new EventSinkBridge(amqpChannel, config.accountDeleteEventSinkBridge);
  accountManager = new AccountManager(persistentSessionSequelizeRepository, accountSequelizeRepository, randomManager, timeManager, accountDeleteEventSinkBridge, config.accountManager);
  accountHttpController = new AccountHttpController(accountManager);
  server = new Server(config.server);

  server.start();

  let purgeExpiredSessionsFailCount = 0;
  let purgeExpiredSessionsInterval = setInterval(() => {
    try {
      accountManager.purgeExpiredSessions();
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
      accountManager.purgeDanglingSessions();
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
})();
