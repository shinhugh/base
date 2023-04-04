import { PersistentSessionService } from '../main/persistent-session-service.js';
import { IdentificationService } from '../main/identification-service.js';
import { Role } from '../main/role.js';

const testIdentify = async () => {
  const result = await identificationService.identify(authority, token);
};

const authority = {
  roles: Role.System
};
const token = ''; // TODO
const persistentSessionService = new PersistentSessionService();
const identificationService = new IdentificationService(persistentSessionService, {
  algorithm: 'HS256',
  secretKey: 'Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng='
});
const tests = [
  { name: 'Identify', run: testIdentify },
];

export {
  tests
};
