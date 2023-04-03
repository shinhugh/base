import { UserAccountService, Role } from '../main/service.js';

const testCreate = async () => {
  const userAccount = {
    name: accountName,
    passwordHash: accountPasswordHash,
    passwordSalt: accountPasswordSalt,
    roles: accountRoles
  };
  id = await userAccountService.create(authority, userAccount);
};

const testReadById = async () => {
  await userAccountService.readById(authority, id);
};

const testReadByName = async () => {
  await userAccountService.readByName(authority, accountName);
};

const testUpdateById = async () => {
  const userAccount = {
    name: 'changed',
    passwordHash: accountPasswordHash,
    passwordSalt: accountPasswordSalt,
    roles: accountRoles
  };
  await userAccountService.updateById(authority, id, userAccount);
};

const testDeleteById = async () => {
  await userAccountService.deleteById(authority, id);
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
