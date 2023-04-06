import jwt from 'jsonwebtoken';
import { Role } from '../main/role.js';
import { PersistentSessionService } from '../main/persistent-session-service.js';
import { IdentificationService } from '../main/identification-service.js';

// PersistentSession table must contain the following entry:
// {
//   id: '00000000-0000-0000-0000-000000000000',
//   userAccountId: '00000000-0000-0000-0000-000000000000',
//   roles: 6,
//   refreshToken: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//   creationTime: 0,
//   expirationTime: 4294967295
// }

const testIdentify = async () => {
  const result = await identificationService.identify(authority, token);
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

const authority = {
  roles: Role.System
};
const persistentSession = {
  id: '00000000-0000-0000-0000-000000000000',
  userAccountId: '00000000-0000-0000-0000-000000000000',
  roles: 6,
  creationTime: 0
};
const algorithm = 'HS256';
const secretKey = Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64');
const token = jwt.sign({
  sessionId: persistentSession.id,
  exp: Math.floor(Date.now() / 1000) + 60
}, secretKey, {
  algorithm: algorithm
});
const persistentSessionService = new PersistentSessionService();
const identificationService = new IdentificationService(persistentSessionService, {
  algorithm: algorithm,
  secretKey: secretKey
});

const tests = [
  { name: 'Identify', run: testIdentify },
];

export {
  tests
};
