import { PersistentSessionService } from './persistent-session-service.js';
import { UserAccountService } from './user-account-service.js';
import { LoginService } from './login-service.js';

const handler = async (event) => {
  // TODO: Implement
};

const persistentSessionService = new PersistentSessionService();
const userAccountService = new UserAccountService();
const loginService = new LoginService(persistentSessionService, userAccountService, {
  algorithm: process.env.AUTH_ALGORITHM,
  secretKey: Buffer.from(process.env.AUTH_SECRET_KEY, 'base64')
});

export {
  handler
};
