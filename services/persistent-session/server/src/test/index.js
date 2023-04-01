import { PersistentSessionServiceServer, Role } from '../main/service.js';

const runTestModule = async (testModule) => {
  for (const test of testModule.tests) {
    const header = '[' + testModule.name + ' : ' + test.name + '] ';
    console.log(header + 'Entering test');
    try {
      await test.run();
      console.log(header + 'Result: Success');
    }
    catch (e) {
      console.error(header + '' + e.message);
      console.log(header + 'Result: Failure');
    }
    console.log(header + 'Exiting test');
  }
};

const testCreate = async () => {
  const authority = null;
  const timestamp = Math.floor(Date.now()/ 1000);
  const persistentSession = {
    userAccountId: userAccountId,
    roles: Role.User | Role.Admin,
    refreshToken: refreshToken,
    creationTime: timestamp,
    expirationTime: timestamp + 600
  };
  id = await service.create(authority, persistentSession);
};

const testReadById = async () => {
  const authority = {
    roles: Role.System
  };
  await service.readById(authority, id);
};

const testReadByRefreshToken = async () => {
  const authority = null;
  await service.readByRefreshToken(authority, refreshToken);
};

const testDeleteByUserAccountId = async () => {
  const authority = {
    id: userAccountId,
    roles: Role.User
  };
  await service.deleteByUserAccountId(authority, userAccountId);
};

const testDeleteByRefreshToken = async () => {
  const authority = null;
  await service.deleteByRefreshToken(authority, refreshToken);
};

const userAccountId = 'd1da9b21-5106-49b5-8ff1-6f3137fdf403';
const refreshToken = 'xt02bgf0srkdb6g572eqcww6umdaik9566bt42axzs67aw9jd3bul6zspaktf8pp2k7lob6tmihmdutzmszvztyrlzj3xdqyx1eipffml19ph1b9a7w5mjk32hq4vsrh';
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
const service = new PersistentSessionServiceServer({
  host: 'localhost',
  port: 3306,
  database: 'base',
  username: 'root',
  password: ''
});
let id;

await runTestModule(serverTestModule);
