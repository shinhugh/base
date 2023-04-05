import { PersistentSessionService } from './persistent-session-service.js';
import { LogoutService } from './logout-service.js';

const handler = async (event) => {
  // TODO: Implement
};

const persistentSessionService = new PersistentSessionService();
const logoutService = new LogoutService(persistentSessionService);

export {
  handler
};
