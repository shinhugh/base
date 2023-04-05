import { PersistentSessionService } from '../main/persistent-session-service.js';
import { LogoutService } from '../main/logout-service.js';

const testLogout = async () => {
  await logoutService.logout(null, refreshToken);
};

const refreshToken = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const persistentSessionService = new PersistentSessionService();
const logoutService = new LogoutService(persistentSessionService);
const tests = [
  { name: 'Logout', run: testLogout },
];

export {
  tests
};
