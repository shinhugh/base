import { PersistentSessionRepository } from './repository/persistent-session-repository.js';
import { AccountServiceClient } from './service/account-service-client.js';
import { AuthenticationService } from './service/authentication-service.js';
import { AuthenticationController } from './controller/authentication-controller.js';
import { Server } from './server.js';

// Use environment variables for production; hard-coded for testing only
const config = {
  persistentSessionRepository: {
    host: 'localhost',
    port: 3306,
    database: 'base',
    username: 'root',
    password: ''
  },
  accountServiceClient: {
    host: 'localhost',
    port: 8080
  },
  authenticationService: {
    tokenAlgorithm: 'HS256',
    tokenSecretKey: Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64'),
    passwordHashAlgorithm: 'sha256',
    persistentSessionDuration: 1209600,
    volatileSessionDuration: 86400
  },
  server: {
    port: 8081
  }
};

const persistentSessionRepository = new PersistentSessionRepository(config.persistentSessionRepository);
const accountServiceClient = new AccountServiceClient(config.accountServiceClient);
const authenticationService = new AuthenticationService(persistentSessionRepository, accountServiceClient, config.authenticationService);
const authenticationController = new AuthenticationController(authenticationService);
const server = new Server({
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
  }
}, config.server.port);

server.start();

let purgeExpiredSessionsFailCount = 0;
let purgeExpiredSessionsInterval = setInterval(() => {
  try {
    authenticationService.purgeExpiredSessions();
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
    authenticationService.purgeDanglingSessions();
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
