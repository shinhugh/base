import { PersistentSessionService } from "./persistent-session-service";
import { IdentificationService } from "./identification-service";

const handler = async () => {
  // TODO
};

const persistentSessionService = new PersistentSessionService();
const identificationService = new IdentificationService(persistentSessionService, {
  algorithm: 'HS256',
  secretKey: process.env.AUTH_SECRET_KEY
});

export {
  handler
};
