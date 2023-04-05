import { UserAccountService } from '../main/user-account-service.js';
import { Role } from '../main/role.js';

const testCreate = async () => {
  const inputUserAccount = {
    name: accountName,
    password: accountPassword,
    roles: accountRoles
  };
  id = (await userAccountService.create(authority, inputUserAccount)).id;
};

const testReadById = async () => {
  await userAccountService.readById(authority, id);
};

const testReadByName = async () => {
  await userAccountService.readByName(authority, accountName);
};

const testUpdateById = async () => {
  const inputUserAccount = {
    name: 'changed',
    password: accountPassword,
    roles: accountRoles
  };
  await userAccountService.updateById(authority, id, inputUserAccount);
};

const testDeleteById = async () => {
  await userAccountService.deleteById(authority, id);
};

const authority = {
  roles: Role.System
};
const accountName = 'qwer';
const accountPassword = 'Qwer!234';
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
