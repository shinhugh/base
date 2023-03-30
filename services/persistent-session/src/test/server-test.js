import { PersistentSessionServiceServer, PersistentSession, Authority, Role, DatabaseInfo } from '../server/index.js'

const testCreate = async () => {
  const serviceServer = new PersistentSessionServiceServer(new DatabaseInfo('localhost', 3306, 'base', 'root', 'root'));
  const authority = new Authority('my_id', [Role.User, Role.Admin]);
  const timestamp = Math.floor(Date.now()/ 1000);
  const persistentSession = new PersistentSession('my_id', 'my_user', 'my_refresh_token', timestamp, timestamp + 600);
  await serviceServer.create(authority, persistentSession);
};

export const serverTestModule = {
  name: 'Server',
  tests: [
    { name: 'Create', run: testCreate }
  ]
};
