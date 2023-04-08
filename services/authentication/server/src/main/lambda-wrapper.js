import { PersistentSessionRepository } from './repository/persistent-session-repository.js';
import { UserAccountServiceClient } from './service/user-account-service-client.js';
import { AuthenticationService } from './service/authentication-service.js';
import { AuthenticationController } from './controller/authentication-controller.js';

const handler = async (event) => {
  // TODO: Implement
};

const persistentSessionRepository = new PersistentSessionRepository({
  host: process.env.AUTH_DB_HOST,
  port: Number(process.env.AUTH_DB_PORT),
  database: process.env.AUTH_DB_DATABASE,
  username: process.env.AUTH_DB_USERNAME,
  password: process.env.AUTH_DB_PASSWORD
});
const userAccountServiceClient = new UserAccountServiceClient();
const authenticationService = new AuthenticationService(persistentSessionRepository, userAccountServiceClient, {
  algorithm: process.env.AUTH_ALGORITHM,
  secretKey: Buffer.from(process.env.AUTH_SECRET_KEY, 'base64')
});
const authenticationController = new AuthenticationController(authenticationService);

export {
  handler
};