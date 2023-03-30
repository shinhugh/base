import { PersistentSessionServiceClient, PersistentSession, Authority, Role, ServerInfo } from '../client/index.js'

const testCreate = async () => {
  const serviceClient = new PersistentSessionServiceClient(new ServerInfo('localhost', 5001));
  const authority = new Authority('my_id', [Role.User, Role.Admin]);
  const timestamp = Math.floor(Date.now()/ 1000);
  const persistentSession = new PersistentSession('my_id', 'my_user', 'my_refresh_token', timestamp, timestamp + 600);
  await serviceClient.create(authority, persistentSession);
};

export const clientTestModule = {
  name: 'Client',
  tests: [
    // { name: 'Create', run: testCreate }
  ]
};
