import { PersistentSessionService, Role } from '../main/service.js';

const testCreate = async () => {
  const currentTime = Math.floor(Date.now() / 1000);
  const persistentSession = {
    userAccountId: sessionUserAccountId,
    roles: sessionRoles,
    refreshToken: sessionRefreshToken,
    creationTime: currentTime,
    expirationTime: currentTime + sessionDuration
  };
  id = await persistentSessionService.create(authority, persistentSession);
};

const testReadById = async () => {
  await persistentSessionService.readById(authority, id);
};

const testReadByRefreshToken = async () => {
  await persistentSessionService.readByRefreshToken(authority, sessionRefreshToken);
};

const testDeleteByUserAccountId = async () => {
  await persistentSessionService.deleteByUserAccountId(authority, sessionUserAccountId);
};

const testDeleteByRefreshToken = async () => {
  await persistentSessionService.deleteByRefreshToken(authority, sessionRefreshToken);
};

const authority = {
  roles: Role.System
};
const sessionUserAccountId = 'd1da9b21-5106-49b5-8ff1-6f3137fdf403';
const sessionRoles = Role.User | Role.Admin;
const sessionRefreshToken = 'xt02bgf0srkdb6g572eqcww6umdaik9566bt42axzs67aw9jd3bul6zspaktf8pp2k7lob6tmihmdutzmszvztyrlzj3xdqyx1eipffml19ph1b9a7w5mjk32hq4vsrh';
const sessionDuration = 600;
const persistentSessionService = new PersistentSessionService();
const tests = [
  { name: 'Create', run: testCreate },
  { name: 'ReadById', run: testReadById },
  { name: 'ReadByRefreshToken', run: testReadByRefreshToken },
  { name: 'DeleteByUserAccountId', run: testDeleteByUserAccountId },
  { name: 'DeleteByRefreshToken', run: testDeleteByRefreshToken },
];
let id;

export {
  tests
};
