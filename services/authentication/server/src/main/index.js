import { PersistentSessionRepository } from './repository/persistent-session-repository.js';
import { UserAccountServiceClient } from './service/user-account-service-client.js';
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
  userAccountServiceClient: {
    host: 'localhost',
    port: 8001
  },
  authenticationService: {
    tokenAlgorithm: 'HS256',
    tokenSecretKey: 'Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=',
    tokenSecretKeyEncoding: 'base64',
    passwordHashAlgorithm: 'sha256'
  },
  server: {
    port: 8000
  }
};

const persistentSessionRepository = new PersistentSessionRepository(config.persistentSessionRepository);
const userAccountServiceClient = new UserAccountServiceClient(config.userAccountServiceClient);
const authenticationService = new AuthenticationService(persistentSessionRepository, userAccountServiceClient, {
  tokenAlgorithm: config.authenticationService.tokenAlgorithm,
  tokenSecretKey: Buffer.from(config.authenticationService.tokenSecretKey, config.authenticationService.tokenSecretKeyEncoding),
  passwordHashAlgorithm: config.authenticationService.passwordHashAlgorithm
});
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
