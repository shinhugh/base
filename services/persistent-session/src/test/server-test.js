import { PersistentSessionServiceServer, PersistentSession, Role } from '../server/index.js'

const serviceServer = new PersistentSessionServiceServer({
  host: 'localhost',
  port: 3306,
  database: 'base',
  username: 'root',
  password: ''
});

const testCreate = async () => {
  const authority = {
    id: 'my_id',
    roles: [Role.User, Role.Admin]
  };
  const timestamp = Math.floor(Date.now()/ 1000);
  const persistentSession = new PersistentSession('my_id', 'my_user', [Role.User, Role.Admin], 'my_refresh_token', timestamp, timestamp + 600);
  await serviceServer.create(authority, persistentSession);
};

const testReadById = async () => {
  const authority = {
    roles: [Role.System]
  };
  await serviceServer.readById(authority, 'my_id');
};

export const serverTestModule = {
  name: 'Server',
  tests: [
    { name: 'Create', run: testCreate },
    { name: 'ReadById', run: testReadById }
  ]
};
