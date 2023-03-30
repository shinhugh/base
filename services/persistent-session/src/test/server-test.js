import { PersistentSessionServiceServer, PersistentSession, Role } from '../server/index.js'

const service = new PersistentSessionServiceServer({
  host: 'localhost',
  port: 3306,
  database: 'base',
  username: 'root',
  password: ''
});

const testCreate = async () => {
  const authority = null;
  const timestamp = Math.floor(Date.now()/ 1000);
  const persistentSession = new PersistentSession('persistent-session-id', 'user-account-id', [Role.User, Role.Admin], 'refresh-token', timestamp, timestamp + 600);
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
  await service.readByRefreshToken(authority, 'refresh-token');
};

const testDeleteByUserAccountId = async () => {
  const authority = {
    id: 'user-account-id',
    roles: [Role.User]
  };
  await service.deleteByUserAccountId(authority, 'user-account-id');
};

const testDeleteByRefreshToken = async () => {
  const authority = null;
  await service.deleteByRefreshToken(authority, 'refresh-token');
};

export const serverTestModule = {
  name: 'Server',
  tests: [
    { name: 'Create', run: testCreate },
    { name: 'ReadById', run: testReadById },
    { name: 'ReadByRefreshToken', run: testReadByRefreshToken },
    { name: 'DeleteByUserAccountId', run: testDeleteByUserAccountId },
    { name: 'DeleteByRefreshToken', run: testDeleteByRefreshToken }
  ]
};
