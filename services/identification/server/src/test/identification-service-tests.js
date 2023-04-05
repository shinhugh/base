import jwt from 'jsonwebtoken';
import { Role } from '../main/role.js';
import { PersistentSessionService } from '../main/persistent-session-service.js';
import { IdentificationService } from '../main/identification-service.js';

const testIdentify = async () => {
  const result = await identificationService.identify(authority, token);
  if (result.id !== accountId) {
    throw new Error('Actual does not match expected: id');
  }
  if (result.roles != roles) {
    throw new Error('Actual does not match expected: roles');
  }
  if (result.authTime != authTime) {
    throw new Error('Actual does not match expected: authTime');
  }
};

const authority = {
  roles: Role.System
};
const accountId = '00000000-0000-0000-0000-000000000000';
const roles = 6;
const authTime = 0;
const sessionId = '00000000-0000-0000-0000-000000000000';
const algorithm = 'HS256';
const secretKey = Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64');
const token = jwt.sign({
  sessionId: sessionId,
  exp: Math.floor(Date.now() / 1000 + 3600)
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
