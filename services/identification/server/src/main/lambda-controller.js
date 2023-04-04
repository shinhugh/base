import { PersistentSessionService } from "./persistent-session-service";
import { IdentificationService } from "./identification-service";

const handler = async () => {
  // TODO
};

const persistentSessionService = new PersistentSessionService();
const identificationService = new IdentificationService(persistentSessionService, {
  algorithm: process.env.AUTH_ALGORITHM,
  secretKey: Buffer.from(process.env.AUTH_SECRET_KEY, 'base64')
});

export {
  handler
};
