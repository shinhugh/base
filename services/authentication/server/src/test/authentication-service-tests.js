import jwt from 'jsonwebtoken';
import { Role } from '../main/service/model/role.js';
import { PersistentSessionRepositorySpy } from './spy/persistent-session-repository-spy.js';
import { AccountServiceClientSpy } from './spy/account-service-client-spy.js';
import { AuthenticationService } from '../main/service/authentication-service.js';

const testIdentify = async () => {
  persistentSessionRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.readByIdReturnValue = [ mockPersistentSession ];
  const token = jwt.sign({
    sessionId: mockPersistentSession.id,
    exp: Math.floor(Date.now() / 1000) + 60
  }, Buffer.from(config.authenticationService.tokenSecretKey, config.authenticationService.tokenSecretKeyEncoding), {
    algorithm: config.authenticationService.tokenAlgorithm
  });
  const output = await authenticationService.identify(authority, token);
  if (persistentSessionRepositorySpy.readByIdInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readById(): Invocation count');
  }
  if (persistentSessionRepositorySpy.readByIdIdArgument !== mockPersistentSession.id) {
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
  persistentSessionRepositorySpy.resetSpy();
  accountServiceClientSpy.resetSpy();
  persistentSessionRepositorySpy.createReturnValue = mockPersistentSession;
  accountServiceClientSpy.readByNameReturnValue = mockAccount;
  let output = await authenticationService.login(authority, {
    credentials: {
      name: mockAccount.name,
      password: mockPassword
    }
  });
  if (accountServiceClientSpy.readByNameInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: AccountServiceClient.read(): Invocation count');
  }
  if (!verifyEqualityBetweenAuthorities(accountServiceClientSpy.readByNameAuthorityArgument, {
    roles: 1
  })) {
    throw new Error('Actual value does not match expected value: AccountServiceClient.read(): authority argument');
  }
  if (accountServiceClientSpy.readByNameNameArgument !== mockAccount.name) {
    throw new Error('Actual value does not match expected value: AccountServiceClient.read(): name argument');
  }
  if (persistentSessionRepositorySpy.createInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.create(): Invocation count');
  }
  const generatedRefreshToken = persistentSessionRepositorySpy.createPersistentSessionArgument.refreshToken;
  const generatedCreationTime = persistentSessionRepositorySpy.createPersistentSessionArgument.creationTime;
  const generatedExpirationTime = persistentSessionRepositorySpy.createPersistentSessionArgument.expirationTime;
  if (!verifyEqualityBetweenPersistentSessions(persistentSessionRepositorySpy.createPersistentSessionArgument, {
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
  catch {
    throw new Error('Actual value does not match expected value: AuthenticationService.login(): Return value');
  }
  persistentSessionRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.readByRefreshTokenReturnValue = [ mockPersistentSession ];
  output = await authenticationService.login(authority, {
    refreshToken: mockPersistentSession.refreshToken
  });
  if (persistentSessionRepositorySpy.readByRefreshTokenInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readByRefreshToken(): Invocation count');
  }
  if (persistentSessionRepositorySpy.readByRefreshTokenRefreshTokenArgument !== mockPersistentSession.refreshToken) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.readByRefreshToken(): refreshToken argument');
  }
  try {
    jwt.verify(output.idToken, Buffer.from(config.authenticationService.tokenSecretKey, config.authenticationService.tokenSecretKeyEncoding), {
      algorithms: [config.authenticationService.tokenAlgorithm]
    });
  }
  catch {
    throw new Error('Actual value does not match expected value: AuthenticationService.login(): Return value');
  }
};

const testLogout = async () => {
  persistentSessionRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.deleteByAccountIdReturnValue = 2;
  await authenticationService.logout(authority, {
    accountId: mockPersistentSession.accountId
  });
  if (persistentSessionRepositorySpy.deleteByAccountIdInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): Invocation count');
  }
  if (persistentSessionRepositorySpy.deleteByAccountIdAccountIdArgument !== mockPersistentSession.accountId) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByAccountId(): accountId argument');
  }
  persistentSessionRepositorySpy.resetSpy();
  persistentSessionRepositorySpy.deleteByRefreshTokenReturnValue = 1;
  await authenticationService.logout(authority, {
    refreshToken: mockPersistentSession.refreshToken
  });
  if (persistentSessionRepositorySpy.deleteByRefreshTokenInvokeCount != 1) {
    throw new Error('Actual value does not match expected value: PersistentSessionRepository.deleteByRefreshToken(): Invocation count');
  }
  if (persistentSessionRepositorySpy.deleteByRefreshTokenRefreshTokenArgument !== mockPersistentSession.refreshToken) {
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
    tokenSecretKey: Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64'),
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
const persistentSessionRepositorySpy = new PersistentSessionRepositorySpy();
const accountServiceClientSpy = new AccountServiceClientSpy();
const authenticationService = new AuthenticationService(persistentSessionRepositorySpy, accountServiceClientSpy, config.authenticationService);

const tests = [
  { name: 'Identify', run: testIdentify },
  { name: 'Login', run: testLogin },
  { name: 'Logout', run: testLogout },
];

export {
  tests
};
