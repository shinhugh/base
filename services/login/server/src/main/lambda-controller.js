import { PersistentSessionService } from './persistent-session-service';
import { UserAccountService } from './user-account-service';
import { LoginService } from './login-service';

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
