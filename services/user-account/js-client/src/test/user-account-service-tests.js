import { UserAccountService, Role } from '../main/service.js';

const testCreate = async () => {
  const currentTime = Math.floor(Date.now() / 1000);
  const userAccount = {
    userAccountId: sessionUserAccountId,
    roles: sessionRoles,
    refreshToken: sessionRefreshToken,
    creationTime: currentTime,
    expirationTime: currentTime + sessionDuration
  };
  id = await userAccountService.create(authority, userAccount);
};

const testReadById = async () => {
  await userAccountService.readById(authority, id);
};

const testReadByName = async () => {
  await userAccountService.readByRefreshToken(authority, sessionRefreshToken);
};

const testUpdateById = async () => {
  await userAccountService.deleteByUserAccountId(authority, sessionUserAccountId);
};

const testDeleteById = async () => {
  await userAccountService.deleteByRefreshToken(authority, sessionRefreshToken);
};

const authority = {
  roles: Role.System
};
const accountName = 'qwer';
const accountPasswordHash = '4a804274c38354a356d5373e091089d343454b551f6116d94bc06d786f9bbcea';
const accountPasswordSalt = 'pmm7pvj7pbnn18k7ld3pfrkszj80i135';
const accountRoles = Role.User | Role.Admin;
const userAccountService = new UserAccountService();
const tests = [
  { name: 'Create', run: testCreate },
  { name: 'ReadById', run: testReadById },
  { name: 'ReadByName', run: testReadByName },
  { name: 'UpdateById', run: testUpdateById },
  { name: 'DeleteById', run: testDeleteById },
];
let id;

export {
  tests
};
