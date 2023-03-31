import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// TODO: Remove comments

export class PersistentSessionServiceClient {
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // persistentSession: PersistentSession
  async create(authority, persistentSession) {
    return await makeRequest('create', translateAuthorityObjectToPlainObjectIfPossible(authority), [ translatePersistentSessionToPlainObjectIfPossible(persistentSession) ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // id: string
  async readById(authority, id) {
    return await makeRequest('readById', translateAuthorityObjectToPlainObjectIfPossible(authority), [ id ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // refreshToken: string
  async readByRefreshToken(authority, refreshToken) {
    return await makeRequest('readByRefreshToken', translateAuthorityObjectToPlainObjectIfPossible(authority), [ refreshToken ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // userAccountId: string
  async deleteByUserAccountId(authority, userAccountId) {
    return await makeRequest('deleteByUserAccountId', translateAuthorityObjectToPlainObjectIfPossible(authority), [ userAccountId ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // refreshToken: string
  async deleteByRefreshToken(authority, refreshToken) {
    return await makeRequest('deleteByRefreshToken', translateAuthorityObjectToPlainObjectIfPossible(authority), [ refreshToken ]);
  }
}

export class PersistentSession {
  #id;
  #userAccountId;
  #roles;
  #refreshToken;
  #creationTime;
  #expirationTime;

  // id: string (optional)
  // userAccountId: string
  // roles: [Role]
  // refreshToken: string
  // creationTime: number (unsigned 32-bit integer)
  // expirationTime: number (unsigned 32-bit integer)
  constructor(id, userAccountId, roles, refreshToken, creationTime, expirationTime) {
    this.id = id;
    this.userAccountId = userAccountId;
    this.roles = roles;
    this.refreshToken = refreshToken;
    this.creationTime = creationTime;
    this.expirationTime = expirationTime;
  }

  get id() {
    return this.#id;
  }

  set id(id) {
    if (id != null && typeof id !== 'string') {
      throw new IllegalArgumentError();
    }
    this.#id = id;
  }

  get userAccountId() {
    return this.#userAccountId;
  }

  set userAccountId(userAccountId) {
    if (typeof userAccountId !== 'string') {
      throw new IllegalArgumentError();
    }
    if (userAccountId.length != idLength) {
      throw new IllegalArgumentError();
    }
    this.#userAccountId = userAccountId;
  }

  get roles() {
    return this.#roles;
  }

  set roles(roles) {
    if (roles == null || !validateRoleArrayType(roles)) {
      throw new IllegalArgumentError();
    }
    this.#roles = roles;
  }

  get refreshToken() {
    return this.#refreshToken;
  }

  set refreshToken(refreshToken) {
    if (typeof refreshToken !== 'string') {
      throw new IllegalArgumentError();
    }
    if (refreshToken.length != refreshTokenLength) {
      throw new IllegalArgumentError();
    }
    this.#refreshToken = refreshToken;
  }

  get creationTime() {
    return this.#creationTime;
  }

  set creationTime(creationTime) {
    if (typeof creationTime !== 'number') {
      throw new IllegalArgumentError();
    }
    if (!Number.isInteger(creationTime) || creationTime < 0 || creationTime > maximumUnsignedIntValue) {
      throw new IllegalArgumentError();
    }
    this.#creationTime = creationTime;
  }

  get expirationTime() {
    return this.#expirationTime;
  }

  set expirationTime(expirationTime) {
    if (typeof expirationTime !== 'number') {
      throw new IllegalArgumentError();
    }
    if (!Number.isInteger(expirationTime) || expirationTime < 0 || expirationTime > maximumUnsignedIntValue) {
      throw new IllegalArgumentError();
    }
    this.#expirationTime = expirationTime;
  }
}

export class Role {
  static #allowConstructor = false;
  static #system = Role.#create('system');
  static #user = Role.#create('user');
  static #admin = Role.#create('admin');

  #name;

  static #create(name) {
    Role.#allowConstructor = true;
    const instance = new Role(name);
    Role.#allowConstructor = false;
    return instance;
  }

  static get System() {
    return Role.#system;
  }

  static get User() {
    return Role.#user;
  }

  static get Admin() {
    return Role.#admin;
  }

  constructor(name) {
    if (!Role.#allowConstructor) {
      throw new Error(illegalInstantiationErrorMessage);
    }
    this.#name = name;
  }

  get name() {
    return this.#name;
  }
}

export class IllegalArgumentError extends Error {
  constructor() {
    super(illegalArgumentErrorMessage);
    this.name = this.constructor.name;
  }
}

export class AccessDeniedError extends Error {
  constructor() {
    super(accessDeniedErrorMessage);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends Error {
  constructor() {
    super(notFoundErrorMessage);
    this.name = this.constructor.name;
  }
}

export class ConflictError extends Error {
  constructor() {
    super(conflictErrorMessage);
    this.name = this.constructor.name;
  }
}

const makeRequest = async (funcName, authority, args) => {
  const client = new LambdaClient();
  const responseWrapper = await client.send(new InvokeCommand({
    FunctionName: 'base_persistentSessionService',
    LogType: 'None',
    Payload: JSON.stringify({
      function: funcName,
      authority: authority,
      arguments: args
    })
  }));
  const response = JSON.parse(Buffer.from(responseWrapper.Payload));
  switch (response.result) {
    case 'IllegalArgumentError':
      throw new IllegalArgumentError();
    case 'AccessDeniedError':
      throw new AccessDeniedError();
    case 'NotFoundError':
      throw new NotFoundError();
    case 'ConflictError':
      throw new ConflictError();
    default:
      return response.payload;
  }
};

const translatePersistentSessionToPlainObjectIfPossible = (persistentSession) => {
  try {
    return {
      id: persistentSession.id,
      userAccountId: persistentSession.userAccountId,
      roles: translateRoleArrayToBitFlags(persistentSession.roles),
      refreshToken: persistentSession.refreshToken,
      creationTime: persistentSession.creationTime,
      expirationTime: persistentSession.expirationTime
    };
  }
  catch {
    return persistentSession;
  }
};

const translateAuthorityObjectToPlainObjectIfPossible = (authority) => {
  try {
    return {
      id: authority.id,
      roles: translateRoleArrayToBitFlags(authority.roles)
    };
  }
  catch {
    return authority;
  }
};

const translateRoleArrayToBitFlags = (roleArray) => {
  if (roleArray == null) {
    return roleArray;
  }
  if (!validateRoleArrayType(roleArray)) {
    throw new IllegalArgumentError();
  }
  const filteredRoleArray = [...new Set(roleArray)];
  let bitFlags = 0;
  for (const role of filteredRoleArray) {
    bitFlags += Math.pow(2, roleBitFlagOrder.indexOf(role));
  }
  return bitFlags;
};

const validateRoleArrayType = (roleArray) => {
  if (roleArray == null) {
    return true;
  }
  if (Object.prototype.toString.call(roleArray) !== '[object Array]') {
    return false;
  }
  for (const element of roleArray) {
    if (!(element instanceof Role)) {
      return false;
    }
  }
  return true;
};

const maximumUnsignedIntValue = 4294967295;
const idLength = 36;
const refreshTokenLength = 128;
const illegalInstantiationErrorMessage = 'Illegal instantiation';
const illegalArgumentErrorMessage = 'Illegal argument';
const accessDeniedErrorMessage = 'Access denied';
const notFoundErrorMessage = 'Not found';
const conflictErrorMessage = 'Conflict';
const roleBitFlagOrder = [Role.System, Role.User, Role.Admin];
