// TODO: Remove comments

export class PersistentSessionServiceClient {
  #serverInfo;

  // serverInfo: object
  // serverInfo.host: string
  // serverInfo.port: number (integer)
  constructor(serverInfo) {
    if (typeof serverInfo !== 'object' || typeof serverInfo.host !== 'string' || typeof serverInfo.port !== 'number') {
      throw new TypeError(typeErrorMessage);
    }
    if (!Number.isInteger(serverInfo.port)) {
      throw new TypeError(nonIntegerErrorMessage);
    }
    this.#serverInfo = {
      host: serverInfo.host,
      port: serverInfo.port
    };
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // persistentSession: PersistentSession
  async create(authority, persistentSession) {
    throw new Error('Not implemented');
    // TODO: Implement
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // id: string
  async readById(authority, id) {
    throw new Error('Not implemented');
    // TODO: Implement
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // refreshToken: string
  async readByRefreshToken(authority, refreshToken) {
    throw new Error('Not implemented');
    // TODO: Implement
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // userAccountId: string
  async deleteByUserAccountId(authority, userAccountId) {
    throw new Error('Not implemented');
    // TODO: Implement
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // refreshToken: string
  async deleteByRefreshToken(authority, refreshToken) {
    throw new Error('Not implemented');
    // TODO: Implement
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
    if (id && typeof id !== 'string') {
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
    if (!validateRoleArrayType(roles)) {
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

const maximumUnsignedIntValue = 4294967295;
const idLength = 36;
const refreshTokenLength = 128;
const typeErrorMessage = 'Illegal type';
const nonIntegerErrorMessage = 'Non-integer number';
const illegalInstantiationErrorMessage = 'Illegal instantiation';
const illegalArgumentErrorMessage = 'Illegal argument';
const accessDeniedErrorMessage = 'Access denied';
const notFoundErrorMessage = 'Not found';
const conflictErrorMessage = 'Conflict';
