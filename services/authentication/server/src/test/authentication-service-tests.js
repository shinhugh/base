import jwt from 'jsonwebtoken';
import { Role } from '../main/model/role.js';
import { PersistentSessionRepositoryMock } from './mock/persistent-session-repository-mock.js';
import { AccountServiceClientMock } from './mock/account-service-client-mock.js';
import { AuthenticationService } from '../main/service/authentication-service.js';

const testIdentify = async () => {
  persistentSessionRepositoryMock.resetSpy();
  persistentSessionRepositoryMock.readByIdReturnValue = [ mockPersistentSession ];
  const token = jwt.sign({
    sessionId: mockPersistentSession.id,
    exp: Math.floor(Date.now() / 1000) + 60
  }, Buffer.from(config.authenticationService.tokenSecretKey, config.authenticationService.tokenSecretKeyEncoding), {
    algorithm: config.authenticationService.tokenAlgorithm
  });
  const output = await authenticationService.identify(authority, token);
  if (persistentSessionRepositoryMock.readByIdInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readById(): Invocation count');
  }
  if (persistentSessionRepositoryMock.readByIdIdArgument !== mockPersistentSession.id) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readById(): id argument');
  }
  if (!verifyEqualityBetweenAuthorities(output, {
    id: mockPersistentSession.accountId,
    roles: mockPersistentSession.roles,
    authTime: mockPersistentSession.creationTime
  })) {
    throw new Error('Actual value does not match expected value: AuthenticationService.identify(): Return value');
  }
};

const testLogin = async () => {
  persistentSessionRepositoryMock.resetSpy();
  accountServiceClientMock.resetSpy();
  persistentSessionRepositoryMock.createReturnValue = mockPersistentSession;
  accountServiceClientMock.readReturnValue = mockAccount;
  let output = await authenticationService.login(authority, {
    credentials: {
      name: mockAccount.name,
      password: mockPassword
    }
  });
  if (accountServiceClientMock.readInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountServiceClient.read(): Invocation count');
  }
  if (!verifyEqualityBetweenAuthorities(accountServiceClientMock.readAuthorityArgument, {
    roles: 1
  })) {
    throw new Error('Actual value does not match expected value: AccountServiceClient.read(): authority argument');
  }
  if (accountServiceClientMock.readNameArgument !== mockAccount.name) {
    throw new Error('Actual value does not match expected value: AccountServiceClient.read(): name argument');
  }
  if (persistentSessionRepositoryMock.createInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.create(): Invocation count');
  }
  const generatedRefreshToken = persistentSessionRepositoryMock.createPersistentSessionArgument.refreshToken;
  const generatedCreationTime = persistentSessionRepositoryMock.createPersistentSessionArgument.creationTime;
  const generatedExpirationTime = persistentSessionRepositoryMock.createPersistentSessionArgument.expirationTime;
  if (!verifyEqualityBetweenPersistentSessions(persistentSessionRepositoryMock.createPersistentSessionArgument, {
    accountId: mockAccount.id,
    roles: mockAccount.roles,
    refreshToken: generatedRefreshToken,
    creationTime: generatedCreationTime,
    expirationTime: generatedExpirationTime
  })) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.create(): persistentSession argument');
  }
  try {
    jwt.verify(output.idToken, Buffer.from(config.authenticationService.tokenSecretKey, config.authenticationService.tokenSecretKeyEncoding), {
      algorithms: [config.authenticationService.tokenAlgorithm]
    });
  }
  catch (e) {
    if (e instanceof jwt.TokenExpiredError || e instanceof jwt.JsonWebTokenError || e instanceof jwt.NotBeforeError) {
      throw new Error('Actual value does not match expected value: AuthenticationService.login(): Return value');
    }
    throw e;
  }
  persistentSessionRepositoryMock.resetSpy();
  persistentSessionRepositoryMock.readByRefreshTokenReturnValue = [ mockPersistentSession ];
  output = await authenticationService.login(authority, {
    refreshToken: mockPersistentSession.refreshToken
  });
  if (persistentSessionRepositoryMock.readByRefreshTokenInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readByRefreshToken(): Invocation count');
  }
  if (persistentSessionRepositoryMock.readByRefreshTokenRefreshTokenArgument !== mockPersistentSession.refreshToken) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readByRefreshToken(): refreshToken argument');
  }
  try {
    jwt.verify(output.idToken, Buffer.from(config.authenticationService.tokenSecretKey, config.authenticationService.tokenSecretKeyEncoding), {
      algorithms: [config.authenticationService.tokenAlgorithm]
    });
  }
  catch (e) {
    if (e instanceof jwt.TokenExpiredError || e instanceof jwt.JsonWebTokenError || e instanceof jwt.NotBeforeError) {
      throw new Error('Actual value does not match expected value: AuthenticationService.login(): Return value');
    }
    throw e;
  }
};

const testLogout = async () => {
  persistentSessionRepositoryMock.resetSpy();
  persistentSessionRepositoryMock.deleteByAccountIdReturnValue = 2;
  await authenticationService.logout(authority, {
    accountId: mockPersistentSession.accountId
  });
  if (persistentSessionRepositoryMock.deleteByAccountIdInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): Invocation count');
  }
  if (persistentSessionRepositoryMock.deleteByAccountIdAccountIdArgument !== mockPersistentSession.accountId) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): accountId argument');
  }
  persistentSessionRepositoryMock.resetSpy();
  persistentSessionRepositoryMock.deleteByRefreshTokenReturnValue = 1;
  await authenticationService.logout(authority, {
    refreshToken: mockPersistentSession.refreshToken
  });
  if (persistentSessionRepositoryMock.deleteByRefreshTokenInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByRefreshToken(): Invocation count');
  }
  if (persistentSessionRepositoryMock.deleteByRefreshTokenRefreshTokenArgument !== mockPersistentSession.refreshToken) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByRefreshToken(): refreshToken argument');
  }
};

const verifyEqualityBetweenAuthorities = (first, second) => {
  if (first == null && second == null) {
    return true;
  }
  if (first == null || second == null) {
    return false;
  }
  if (first.id !== second.id) {
    return false;
  }
  if (first.roles != second.roles) {
    return false;
  }
  if (first.authTime != second.authTime) {
    return false;
  }
  return true;
};

const verifyEqualityBetweenPersistentSessions = (first, second) => {
  if (first == null && second == null) {
    return true;
  }
  if (first == null || second == null) {
    return false;
  }
  if (first.id !== second.id) {
    return false;
  }
  if (first.accountId !== second.accountId) {
    return false;
  }
  if (first.roles != second.roles) {
    return false;
  }
  if (first.refreshToken !== second.refreshToken) {
    return false;
  }
  if (first.creationTime != second.creationTime) {
    return false;
  }
  if (first.expirationTime != second.expirationTime) {
    return false;
  }
  return true;
};

const config = {
  authenticationService: {
    tokenAlgorithm: 'HS256',
    tokenSecretKey: 'Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=',
    tokenSecretKeyEncoding: 'base64',
    passwordHashAlgorithm: 'sha256',
    persistentSessionDuration: 1209600,
    volatileSessionDuration: 86400
  }
};
const mockPersistentSession = {
  id: '00000000-0000-0000-0000-000000000000',
  accountId: '00000000-0000-0000-0000-000000000000',
  roles: 6,
  refreshToken: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  creationTime: Math.floor(Date.now() / 1000),
  expirationTime: 4294967295
};
const mockAccount = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'qwer',
  passwordHash: 'bbf55461cbb04963ee7347e5e014f76defa26a8af960be40e644f4f204ddc7a3',
  passwordSalt: '00000000000000000000000000000000',
  roles: 6
};
const mockPassword = 'Qwer!234';

const authority = { roles: Role.System };
const persistentSessionRepositoryMock = new PersistentSessionRepositoryMock();
const accountServiceClientMock = new AccountServiceClientMock();
const authenticationService = new AuthenticationService(persistentSessionRepositoryMock, accountServiceClientMock, {
  tokenAlgorithm: config.authenticationService.tokenAlgorithm,
  tokenSecretKey: Buffer.from(config.authenticationService.tokenSecretKey, config.authenticationService.tokenSecretKeyEncoding),
  passwordHashAlgorithm: config.authenticationService.passwordHashAlgorithm
});

const tests = [
  { name: 'Identify', run: testIdentify },
  { name: 'Login', run: testLogin },
  { name: 'Logout', run: testLogout },
];

export {
  tests
};
