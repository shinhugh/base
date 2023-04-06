import jwt from 'jsonwebtoken';
import { PersistentSessionService } from '../main/persistent-session-service.js';
import { UserAccountService } from '../main/user-account-service.js';
import { LoginService } from '../main/login-service.js';

// UserAccount table must contain the following entry:
// {
//   id: '00000000-0000-0000-0000-000000000000',
//   name: 'qwer',
//   passwordHash: 'bbf55461cbb04963ee7347e5e014f76defa26a8af960be40e644f4f204ddc7a3',
//   passwordSalt: '00000000000000000000000000000000',
//   roles: 6
// }

const testLoginViaCredentials = async () => {
  const result = await loginService.loginViaCredentials(authority, {
    name: userAccount.name,
    password: userAccount.password
  });
  try {
    jwt.verify(result.idToken, secretKey, {
      algorithms: [algorithm]
    });
  }
  catch {
    throw new Error('Invalid ID token generated');
  }
  refreshToken = result.refreshToken;
};

const testLoginViaRefreshToken = async () => {
  const result = await loginService.loginViaRefreshToken(authority, refreshToken);
  try {
    jwt.verify(result.idToken, secretKey, {
      algorithms: [algorithm]
    });
  }
  catch {
    throw new Error('Invalid ID token generated');
  }
};

const authority = null;
const userAccount = {
  name: 'qwer',
  password: 'Qwer!234'
};
const algorithm = 'HS256';
const secretKey = Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64');
const persistentSessionService = new PersistentSessionService();
const userAccountService = new UserAccountService();
const loginService = new LoginService(persistentSessionService, userAccountService, {
  algorithm: algorithm,
  secretKey: secretKey
});
let refreshToken;

const tests = [
  { name: 'LoginViaCredentials', run: testLoginViaCredentials },
  { name: 'LoginViaRefreshToken', run: testLoginViaRefreshToken },
];

export {
  tests
};
