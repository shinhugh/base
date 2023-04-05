import { PersistentSessionService } from './persistent-session-service.js';
import { IdentificationService } from './identification-service.js';

const handler = async (event) => {
  // TODO: Extract ID token from request
  const token = '';
  const authority = await identificationService.identify({ roles: Role.System }, token);
  // TODO: Return generated authority to caller
};

const persistentSessionService = new PersistentSessionService();
const identificationService = new IdentificationService(persistentSessionService, {
  algorithm: process.env.AUTH_ALGORITHM,
  secretKey: Buffer.from(process.env.AUTH_SECRET_KEY, 'base64')
});

export {
  handler
};
