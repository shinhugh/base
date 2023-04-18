import jwt from 'jsonwebtoken';
import { Role } from '../main/service/model/role.js';
import { PersistentSessionRepositorySpy } from './spy/persistent-session-repository-spy.js';
import { AccountRepositorySpy } from './spy/account-repository-spy.js';
import { RandomServiceSpy } from './spy/random-service-spy.js'
import { TimeServiceSpy } from './spy/time-service-spy.js'
import { AccountManager } from '../main/service/account-manager.js';

const testIdentify = async () => {
  persistentSessionRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.readByIdReturnValue = [
    {
      id: persistentSessionId,
      accountId: accountId,
      roles: accountRoles,
      refreshToken: persistentSessionRefreshToken,
      creationTime: 0,
      expirationTime: persistentSessionDuration
    }
  ];
  timeServiceSpy.currentTimeSecondsReturnValue = 1;
  const authority = {
    roles: Role.System
  };
  const token = jwt.sign({
    sessionId: persistentSessionId,
    iat: currentTime,
    exp: currentTime + volatileSessionDuration
  }, tokenSecretKey, {
    algorithm: tokenAlgorithm
  });
  const output = await accountManager.identify(authority, token);
  if (persistentSessionRepositorySpy.readByIdInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readById(): Invocation count');
  }
  if (persistentSessionRepositorySpy.readByIdIdArgument !== persistentSessionId) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readById(): id argument');
  }
  if (output == null || output.id !== accountId || output.roles != accountRoles || output.authTime != 0) {
    throw new Error('Actual value does not match expected value: AccountManager.identify(): Return value');
  }
};

const testLoginCredentials = async () => {
  persistentSessionRepositorySpy.resetSpy();
  accountRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.createReturnValue = {
    id: persistentSessionId,
    accountId: accountId,
    roles: accountRoles,
    refreshToken: persistentSessionRefreshToken,
    creationTime: currentTime,
    expirationTime: currentTime + persistentSessionDuration
  };
  accountRepositorySpy.readByNameReturnValue = [
    {
      id: accountId,
      name: accountName,
      passwordHash: accountPasswordHash,
      passwordSalt: accountPasswordSalt,
      roles: accountRoles
    }
  ];
  randomServiceSpy.generateRandomStringReturnValue = persistentSessionRefreshToken;
  timeServiceSpy.currentTimeSecondsReturnValue = currentTime;
  const authority = undefined;
  const output = await accountManager.login(authority, {
    credentials: {
      name: accountName,
      password: accountPassword
    }
  });
  if (persistentSessionRepositorySpy.createInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.create(): Invocation count');
  }
  if (persistentSessionRepositorySpy.createPersistentSessionArgument == null || persistentSessionRepositorySpy.createPersistentSessionArgument.accountId !== accountId || persistentSessionRepositorySpy.createPersistentSessionArgument.roles != accountRoles || persistentSessionRepositorySpy.createPersistentSessionArgument.refreshToken !== persistentSessionRefreshToken || persistentSessionRepositorySpy.createPersistentSessionArgument.creationTime != currentTime || persistentSessionRepositorySpy.createPersistentSessionArgument.expirationTime != currentTime + persistentSessionDuration) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.create(): persistentSession argument');
  }
  if (accountRepositorySpy.readByNameInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByName(): Invocation count');
  }
  if (accountRepositorySpy.readByNameNameArgument !== accountName) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByName(): name argument');
  }
  if (output?.refreshToken !== persistentSessionRefreshToken) {
    throw new Error('Actual value does not match expected value: AccountManager.login(): Return value');
  }
  let verifiedToken;
  try {
    verifiedToken = jwt.verify(output?.idToken, tokenSecretKey, {
      algorithms: [ tokenAlgorithm ]
    });
  }
  catch {
    throw new Error('Actual value does not match expected value: AccountManager.login(): Return value');
  }
  if (verifiedToken.sessionId !== persistentSessionId || verifiedToken.iat != currentTime || verifiedToken.exp != currentTime + volatileSessionDuration) {
    throw new Error('Actual value does not match expected value: AccountManager.login(): Return value');
  }
};

const testLoginRefreshToken = async () => {
  persistentSessionRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.readByRefreshTokenReturnValue = [
    {
      id: persistentSessionId,
      accountId: accountId,
      roles: accountRoles,
      refreshToken: persistentSessionRefreshToken,
      creationTime: currentTime,
      expirationTime: currentTime + persistentSessionDuration
    }
  ];
  timeServiceSpy.currentTimeSecondsReturnValue = currentTime;
  const authority = undefined;
  const output = await accountManager.login(authority, {
    refreshToken: persistentSessionRefreshToken
  });
  if (persistentSessionRepositorySpy.readByRefreshTokenInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readByRefreshToken(): Invocation count');
  }
  if (persistentSessionRepositorySpy.readByRefreshTokenRefreshTokenArgument !== persistentSessionRefreshToken) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readByRefreshToken(): refreshToken argument');
  }
  let verifiedToken;
  try {
    verifiedToken = jwt.verify(output?.idToken, tokenSecretKey, {
      algorithms: [ tokenAlgorithm ]
    });
  }
  catch {
    throw new Error('Actual value does not match expected value: AccountManager.login(): Return value');
  }
  if (verifiedToken.sessionId !== persistentSessionId || verifiedToken.iat != currentTime || verifiedToken.exp != currentTime + volatileSessionDuration) {
    throw new Error('Actual value does not match expected value: AccountManager.login(): Return value');
  }
};

const testLogoutAccountId = async () => {
  persistentSessionRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.deleteByAccountIdReturnValue = 0;
  const authority = {
    id: accountId,
    roles: Role.User
  };
  await accountManager.logout(authority, {
    accountId: accountId
  });
  if (persistentSessionRepositorySpy.deleteByAccountIdInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): Invocation count');
  }
  if (persistentSessionRepositorySpy.deleteByAccountIdAccountIdArgument !== accountId) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): accountId argument');
  }
};

const testLogoutRefreshToken = async () => {
  persistentSessionRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.deleteByRefreshTokenReturnValue = 0;
  const authority = undefined;
  await accountManager.logout(authority, {
    refreshToken: persistentSessionRefreshToken
  });
  if (persistentSessionRepositorySpy.deleteByRefreshTokenInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByRefreshToken(): Invocation count');
  }
  if (persistentSessionRepositorySpy.deleteByRefreshTokenRefreshTokenArgument !== persistentSessionRefreshToken) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByRefreshToken(): refreshToken argument');
  }
};

const testReadAccount = async () => {
  accountRepositorySpy.resetSpy();
  accountRepositorySpy.readByIdAndNameReturnValue = [
    {
      id: accountId,
      name: accountName,
      passwordHash: accountPasswordHash,
      passwordSalt: accountPasswordSalt,
      roles: accountRoles
    }
  ];
  const authority = {
    id: accountId,
    roles: Role.User
  };
  const output = await accountManager.readAccount(authority, accountId, accountName);
  if (accountRepositorySpy.readByIdAndNameInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): Invocation count');
  }
  if (accountRepositorySpy.readByIdAndNameIdArgument !== accountId) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): id argument');
  }
  if (accountRepositorySpy.readByIdAndNameNameArgument !== accountName) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): name argument');
  }
  if (output == null || output.id !== accountId || output.name !== accountName || output.passwordHash != null || output.passwordSalt != null || output.roles != accountRoles) {
    throw new Error('Actual value does not match expected value: AccountManager.readAccount(): Return value');
  }
};

const testCreateAccount = async () => {
  accountRepositorySpy.resetSpy();
  accountRepositorySpy.createReturnValue = {
    id: accountId,
    name: accountName,
    passwordHash: accountPasswordHash,
    passwordSalt: accountPasswordSalt,
    roles: accountRoles
  };
  randomServiceSpy.generateRandomStringReturnValue = accountPasswordSalt;
  const authority = undefined;
  const output = await accountManager.createAccount(authority, {
    name: accountName,
    password: accountPassword
  });
  if (accountRepositorySpy.createInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountRepository.create(): Invocation count');
  }
  if (accountRepositorySpy.createAccountArgument == null || accountRepositorySpy.createAccountArgument.name !== accountName || accountRepositorySpy.createAccountArgument.passwordHash !== accountPasswordHash || accountRepositorySpy.createAccountArgument.passwordSalt !== accountPasswordSalt || accountRepositorySpy.createAccountArgument.roles != accountRoles) {
    throw new Error('Actual value does not match expected value: AccountRepository.create(): account argument');
  }
  if (output == null || output.id !== accountId || output.name !== accountName || output.passwordHash != null || output.passwordSalt != null || output.roles != accountRoles) {
    throw new Error('Actual value does not match expected value: AccountManager.createAccount(): Return value');
  }
};

const testUpdateAccount = async () => {
  const modifiedName = 'changed';
  persistentSessionRepositorySpy.resetSpy();
  accountRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.deleteByAccountIdReturnValue = 0;
  accountRepositorySpy.readByIdAndNameReturnValue = [
    {
      id: accountId,
      name: accountName,
      passwordHash: accountPasswordHash,
      passwordSalt: accountPasswordSalt,
      roles: accountRoles
    }
  ];
  accountRepositorySpy.updateByIdAndNameReturnValue = {
    id: accountId,
    name: modifiedName,
    passwordHash: accountPasswordHash,
    passwordSalt: accountPasswordSalt,
    roles: accountRoles
  };
  const authority = {
    id: accountId,
    roles: accountRoles,
    authTime: currentTime
  };
  const output = await accountManager.updateAccount(authority, accountId, accountName, {
    name: modifiedName,
    password: accountPassword
  });
  if (persistentSessionRepositorySpy.deleteByAccountIdInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): Invocation count');
  }
  if (persistentSessionRepositorySpy.deleteByAccountIdAccountIdArgument !== accountId) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): accountId argument');
  }
  if (accountRepositorySpy.readByIdAndNameInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): Invocation count');
  }
  if (accountRepositorySpy.readByIdAndNameIdArgument !== accountId) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): id argument');
  }
  if (accountRepositorySpy.readByIdAndNameNameArgument !== accountName) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): name argument');
  }
  if (accountRepositorySpy.updateByIdAndNameInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountRepository.updateByIdAndName(): Invocation count');
  }
  if (accountRepositorySpy.updateByIdAndNameIdArgument !== accountId) {
    throw new Error('Actual value does not match expected value: AccountRepository.updateByIdAndName(): id argument');
  }
  if (accountRepositorySpy.updateByIdAndNameNameArgument !== accountName) {
    throw new Error('Actual value does not match expected value: AccountRepository.updateByIdAndName(): name argument');
  }
  if (accountRepositorySpy.updateByIdAndNameAccountArgument == null || accountRepositorySpy.updateByIdAndNameAccountArgument.name !== modifiedName || accountRepositorySpy.updateByIdAndNameAccountArgument.passwordHash !== accountPasswordHash || accountRepositorySpy.updateByIdAndNameAccountArgument.passwordSalt !== accountPasswordSalt || accountRepositorySpy.updateByIdAndNameAccountArgument.roles != accountRoles) {
    throw new Error('Actual value does not match expected value: AccountRepository.updateByIdAndName(): account argument');
  }
  if (output == null || output.id !== accountId || output.name !== modifiedName || output.passwordHash != null || output.passwordSalt != null || output.roles != accountRoles) {
    throw new Error('Actual value does not match expected value: AccountManager.updateAccount(): Return value');
  }
};

const testDeleteAccount = async () => {
  persistentSessionRepositorySpy.resetSpy();
  accountRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.deleteByAccountIdReturnValue = 0;
  accountRepositorySpy.readByIdAndNameReturnValue = [
    {
      id: accountId,
      name: accountName,
      passwordHash: accountPasswordHash,
      passwordSalt: accountPasswordSalt,
      roles: accountRoles
    }
  ];
  accountRepositorySpy.deleteByIdAndNameReturnValue = 0;
  const authority = {
    id: accountId,
    roles: accountRoles,
    authTime: currentTime
  };
  await accountManager.deleteAccount(authority, accountId, accountName);
  if (persistentSessionRepositorySpy.deleteByAccountIdInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): Invocation count');
  }
  if (persistentSessionRepositorySpy.deleteByAccountIdAccountIdArgument !== accountId) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): accountId argument');
  }
  if (accountRepositorySpy.readByIdAndNameInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): Invocation count');
  }
  if (accountRepositorySpy.readByIdAndNameIdArgument !== accountId) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): id argument');
  }
  if (accountRepositorySpy.readByIdAndNameNameArgument !== accountName) {
    throw new Error('Actual value does not match expected value: AccountRepository.readByIdAndName(): name argument');
  }
  if (accountRepositorySpy.deleteByIdAndNameInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountRepository.deleteByIdAndName(): Invocation count');
  }
  if (accountRepositorySpy.deleteByIdAndNameIdArgument !== accountId) {
    throw new Error('Actual value does not match expected value: AccountRepository.deleteByIdAndName(): id argument');
  }
  if (accountRepositorySpy.deleteByIdAndNameNameArgument !== accountName) {
    throw new Error('Actual value does not match expected value: AccountRepository.deleteByIdAndName(): name argument');
  }
};

const currentTime = Math.floor(Date.now() / 1000);
const tokenAlgorithm = 'HS256';
const tokenSecretKey = Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64');
const passwordHashAlgorithm = 'sha256';
const persistentSessionDuration = 1209600;
const volatileSessionDuration = 86400;
const modificationEnabledSessionAgeMaxValue = 900;
const accountId = '00000000-0000-0000-0000-000000000000';
const accountName = 'qwer';
const accountPassword = 'Qwer!234';
const accountPasswordHash = 'bbf55461cbb04963ee7347e5e014f76defa26a8af960be40e644f4f204ddc7a3';
const accountPasswordSalt = '00000000000000000000000000000000';
const accountRoles = 2;
const persistentSessionId = '00000000-0000-0000-0000-000000000000';
const persistentSessionRefreshToken = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

const persistentSessionRepositorySpy = new PersistentSessionRepositorySpy();
const accountRepositorySpy = new AccountRepositorySpy();
const randomServiceSpy = new RandomServiceSpy();
const timeServiceSpy = new TimeServiceSpy();
const accountManager = new AccountManager(persistentSessionRepositorySpy, accountRepositorySpy, randomServiceSpy, timeServiceSpy, {
  tokenAlgorithm: tokenAlgorithm,
  tokenSecretKey: tokenSecretKey,
  passwordHashAlgorithm: passwordHashAlgorithm,
  persistentSessionDuration: persistentSessionDuration,
  volatileSessionDuration: volatileSessionDuration,
  modificationEnabledSessionAgeMaxValue: modificationEnabledSessionAgeMaxValue
});

const tests = [
  { name: 'Identify', run: testIdentify },
  { name: 'Login with credentials', run: testLoginCredentials },
  { name: 'Login with refresh token', run: testLoginRefreshToken },
  { name: 'Logout with account ID', run: testLogoutAccountId },
  { name: 'Logout with refresh token', run: testLogoutRefreshToken },
  { name: 'Read Account', run: testReadAccount },
  { name: 'Create Account', run: testCreateAccount },
  { name: 'Update Account', run: testUpdateAccount },
  { name: 'Delete Account', run: testDeleteAccount }
];

export {
  tests
};
