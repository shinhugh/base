import jwt from 'jsonwebtoken';
import { Role } from '../main/role.js';
import { PersistentSessionRepository } from '../main/persistent-session-repository.js';
import { UserAccountServiceClient } from '../main/user-account-service-client.js';
import { AuthenticationService } from '../main/authentication-service.js';

// PersistentSession table must contain the following entry:
// {
//   id: '00000000-0000-0000-0000-000000000000',
//   userAccountId: '00000000-0000-0000-0000-000000000000',
//   roles: 6,
//   refreshToken: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//   creationTime: 0,
//   expirationTime: 4294967295
// }

// UserAccount table must contain the following entry:
// {
//   id: '00000000-0000-0000-0000-000000000000',
//   name: 'qwer',
//   passwordHash: 'bbf55461cbb04963ee7347e5e014f76defa26a8af960be40e644f4f204ddc7a3',
//   passwordSalt: '00000000000000000000000000000000',
//   roles: 6
// }

const testIdentify = async () => {
  const persistentSession = {
    id: '00000000-0000-0000-0000-000000000000',
    userAccountId: '00000000-0000-0000-0000-000000000000',
    roles: 6,
    creationTime: 0
  };
  const token = jwt.sign({
    sessionId: persistentSession.id,
    exp: Math.floor(Date.now() / 1000) + 60
  }, secretKey, {
    algorithm: algorithm
  });
  const result = await authenticationService.identify(authority, token);
  if (result.id !== persistentSession.userAccountId) {
    throw new Error('Actual does not match expected: id');
  }
  if (result.roles != persistentSession.roles) {
    throw new Error('Actual does not match expected: roles');
  }
  if (result.authTime != persistentSession.creationTime) {
    throw new Error('Actual does not match expected: authTime');
  }
};

const testLogin = async () => {
  const userAccount = {
    name: 'qwer',
    password: 'Qwer!234'
  };
  let result = await authenticationService.login(authority, {
    credentials: {
      name: userAccount.name,
      password: userAccount.password
    }
  });
  try {
    jwt.verify(result.idToken, secretKey, {
      algorithms: [algorithm]
    });
  }
  catch {
    throw new Error('Invalid ID token generated');
  }
  result = await authenticationService.login(authority, {
    refreshToken: result.refreshToken
  });
  try {
    jwt.verify(result.idToken, secretKey, {
      algorithms: [algorithm]
    });
  }
  catch {
    throw new Error('Invalid ID token generated');
  }
};

const testLogout = async () => {
  const userAccountId = '00000000-0000-0000-0000-000000000000';
  const refreshToken = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
  await authenticationService.logout(authority, {
    userAccountId: userAccountId
  });
  await authenticationService.logout(authority, {
    refreshToken: refreshToken
  });
};

const authority = { roles: Role.System };
const algorithm = 'HS256';
const secretKey = Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64');
const persistentSessionRepository = new PersistentSessionRepository({
  host: 'localhost',
  port: 3306,
  database: 'base',
  username: 'root',
  password: ''
});
const userAccountServiceClient = new UserAccountServiceClient();
const authenticationService = new AuthenticationService(persistentSessionRepository, userAccountServiceClient, {
  algorithm: algorithm,
  secretKey: secretKey
});

const tests = [
  { name: 'Identify', run: testIdentify },
  { name: 'Login', run: testLogin },
  { name: 'Logout', run: testLogout },
];

export {
  tests
};
