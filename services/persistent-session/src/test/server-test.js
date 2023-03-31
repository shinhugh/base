import { PersistentSessionServiceServer, PersistentSession, Role } from '../server/service.js';

const testCreate = async () => {
  const authority = null;
  const timestamp = Math.floor(Date.now()/ 1000);
  const persistentSession = new PersistentSession(undefined, userAccountId, [Role.User, Role.Admin], refreshToken, timestamp, timestamp + 600);
  await service.create(authority, persistentSession);
};

const testReadById = async () => {
  const authority = {
    roles: [Role.System]
  };
  await service.readById(authority, 'persistent-session-id');
};

const testReadByRefreshToken = async () => {
  const authority = null;
  await service.readByRefreshToken(authority, refreshToken);
};

const testDeleteByUserAccountId = async () => {
  const authority = {
    id: userAccountId,
    roles: [Role.User]
  };
  await service.deleteByUserAccountId(authority, userAccountId);
};

const testDeleteByRefreshToken = async () => {
  const authority = null;
  await service.deleteByRefreshToken(authority, refreshToken);
};

export const serverTestModule = {
  name: 'Server',
  tests: [
    // { name: 'Create', run: testCreate },
    // { name: 'ReadById', run: testReadById },
    // { name: 'ReadByRefreshToken', run: testReadByRefreshToken },
    // { name: 'DeleteByUserAccountId', run: testDeleteByUserAccountId },
    // { name: 'DeleteByRefreshToken', run: testDeleteByRefreshToken },
  ]
};
const userAccountId = 'd1da9b21-5106-49b5-8ff1-6f3137fdf403';
const refreshToken = 'xt02bgf0srkdb6g572eqcww6umdaik9566bt42axzs67aw9jd3bul6zspaktf8pp2k7lob6tmihmdutzmszvztyrlzj3xdqyx1eipffml19ph1b9a7w5mjk32hq4vsrh';
const service = new PersistentSessionServiceServer({
  host: 'localhost',
  port: 3306,
  database: 'base',
  username: 'root',
  password: ''
});
