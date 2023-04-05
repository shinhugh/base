import jwt from 'jsonwebtoken';
import { PersistentSessionService } from '../main/persistent-session-service.js';
import { UserAccountService } from '../main/user-account-service.js';
import { LoginService } from '../main/login-service.js';

const testLoginViaCredentials = async () => {
  // TODO: Implement
};

const testLoginViaRefreshToken = async () => {
  // TODO: Implement
};

const algorithm = 'HS256';
const secretKey = Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64');
const persistentSessionService = new PersistentSessionService();
const userAccountService = new UserAccountService();
const loginService = new LoginService(persistentSessionService, userAccountService, {
  algorithm: algorithm,
  secretKey: secretKey
});
const tests = [
  { name: 'LoginViaCredentials', run: testLoginViaCredentials },
  { name: 'LoginViaRefreshToken', run: testLoginViaRefreshToken },
];

export {
  tests
};
