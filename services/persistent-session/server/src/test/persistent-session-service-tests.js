import { Role } from '../main/role.js';
import { PersistentSessionService } from '../main/persistent-session-service.js';

const testCreate = async () => {
  const inputPersistentSession = {
    userAccountId: sessionUserAccountId,
    roles: sessionRoles
  };
  const output = await persistentSessionService.create(authority, inputPersistentSession);
  persistentSessionId = output.id;
  persistentSessionRefreshToken = output.refreshToken;
};

const testReadById = async () => {
  await persistentSessionService.readById(authority, persistentSessionId);
};

const testReadByRefreshToken = async () => {
  await persistentSessionService.readByRefreshToken(authority, persistentSessionRefreshToken);
};

const testDeleteByUserAccountId = async () => {
  await persistentSessionService.deleteByUserAccountId(authority, sessionUserAccountId);
};

const testDeleteByRefreshToken = async () => {
  await persistentSessionService.deleteByRefreshToken(authority, persistentSessionRefreshToken);
};

const authority = {
  roles: Role.System
};
const sessionUserAccountId = 'd1da9b21-5106-49b5-8ff1-6f3137fdf403';
const sessionRoles = Role.User | Role.Admin;
const persistentSessionService = new PersistentSessionService({
  host: 'localhost',
  port: 3306,
  database: 'base',
  username: 'root',
  password: ''
});
let persistentSessionId;
let persistentSessionRefreshToken;

const tests = [
  { name: 'Create', run: testCreate },
  { name: 'ReadById', run: testReadById },
  { name: 'ReadByRefreshToken', run: testReadByRefreshToken },
  { name: 'DeleteByUserAccountId', run: testDeleteByUserAccountId },
  { name: 'DeleteByRefreshToken', run: testDeleteByRefreshToken },
];

export {
  tests
};
