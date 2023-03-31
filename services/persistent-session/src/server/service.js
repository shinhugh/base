import { randomUUID } from 'crypto';
import { Sequelize, DataTypes } from 'sequelize';

// TODO: Remove comments

export class PersistentSessionServiceServer {
  #databaseInfo;
  #sequelize;

  // databaseInfo: object
  // databaseInfo.host: string
  // databaseInfo.port: number (integer)
  // databaseInfo.database: string
  // databaseInfo.username: string
  // databaseInfo.password: string
  constructor(databaseInfo) {
    if (typeof databaseInfo !== 'object' || typeof databaseInfo.host !== 'string' || !Number.isInteger(databaseInfo.port) || typeof databaseInfo.database !== 'string' || typeof databaseInfo.username !== 'string' || typeof databaseInfo.password !== 'string') {
      throw new IllegalArgumentError();
    }
    this.#databaseInfo = {
      host: databaseInfo.host,
      port: databaseInfo.port,
      database: databaseInfo.database,
      username: databaseInfo.username,
      password: databaseInfo.password
    };
  }

  // From Login service
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // persistentSession: PersistentSession
  async create(authority, persistentSession) {
    if (!validateAuthorityObjectSchema(authority)) {
      throw new IllegalArgumentError();
    }
    if (!(persistentSession instanceof PersistentSession)) {
      throw new IllegalArgumentError();
    }
    const entry = {
      userAccountId: persistentSession.userAccountId,
      roles: translateRoleArrayToBitFlags(persistentSession.roles),
      refreshToken: persistentSession.refreshToken,
      creationTime: persistentSession.creationTime,
      expirationTime: persistentSession.expirationTime
    };
    await this.#openSequelize(this.#databaseInfo);
    try {
      entry.id = await this.#generateId();
      try {
        await this.#sequelize.models.persistentSessions.create(entry);
      }
      catch (e) {
        if (e instanceof Sequelize.ValidationError) {
          throw new ConflictError();
        }
        throw e;
      }
      return entry.id;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Identification service
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // id: string
  async readById(authority, id) {
    if (!validateAuthorityObjectSchema(authority)) {
      throw new IllegalArgumentError();
    }
    if (authority == null || authority.roles == null || !authority.roles.includes(Role.System)) {
      throw new AccessDeniedError();
    }
    if (typeof id !== 'string') {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      const entry = await this.#sequelize.models.persistentSessions.findOne({
        where: {
          id: id
        }
      });
      if (entry == null) {
        throw new NotFoundError();
      }
      return new PersistentSession(entry.id, entry.userAccountId, translateBitFlagsToRoleArray(entry.roles), entry.refreshToken, entry.creationTime, entry.expirationTime);
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Login service
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // refreshToken: string
  async readByRefreshToken(authority, refreshToken) {
    if (!validateAuthorityObjectSchema(authority)) {
      throw new IllegalArgumentError();
    }
    if (typeof refreshToken !== 'string') {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      const entry = await this.#sequelize.models.persistentSessions.findOne({
        where: {
          refreshToken: refreshToken
        }
      });
      if (entry == null) {
        throw new NotFoundError();
      }
      return new PersistentSession(entry.id, entry.userAccountId, translateBitFlagsToRoleArray(entry.roles), entry.refreshToken, entry.creationTime, entry.expirationTime);
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Account service
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // userAccountId: string
  async deleteByUserAccountId(authority, userAccountId) {
    if (!validateAuthorityObjectSchema(authority)) {
      throw new IllegalArgumentError();
    }
    if (authority == null || authority.roles == null || !(authority.roles.includes(Role.System) || authority.roles.includes(Role.Admin) || (authority.roles.includes(Role.User) && authority.id != null && authority.id === userAccountId))) {
      throw new AccessDeniedError();
    }
    if (typeof userAccountId !== 'string') {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      const count = await this.#sequelize.models.persistentSessions.destroy({
        where: {
          userAccountId: userAccountId
        }
      });
      if (count == 0) {
        throw new NotFoundError();
      }
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Logout service
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: [Role] (optional)
  // refreshToken: string
  async deleteByRefreshToken(authority, refreshToken) {
    if (!validateAuthorityObjectSchema(authority)) {
      throw new IllegalArgumentError();
    }
    if (typeof refreshToken !== 'string') {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      const count = await this.#sequelize.models.persistentSessions.destroy({
        where: {
          refreshToken: refreshToken
        }
      });
      if (count == 0) {
        throw new NotFoundError();
      }
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async #generateId() {
    let id = randomUUID();
    while (await this.#sequelize.models.persistentSessions.findOne({
      where: {
        id: id
      }
    })) {
      id = randomUUID();
    }
    return id;
  }

  async #openSequelize(databaseInfo) {
    if (this.#sequelize == null) {
      this.#sequelize = new Sequelize({
        host: databaseInfo.host,
        port: databaseInfo.port,
        database: databaseInfo.database,
        username: databaseInfo.username,
        password: databaseInfo.password,
        dialect: sequelizeOptions.dialect,
        logging: sequelizeOptions.logging,
        pool: sequelizeOptions.pool
      });
      await this.#sequelize.authenticate();
      this.#sequelize.define('persistentSessions', sequelizePersistentSessionAttributes, sequelizePersistentSessionOptions);
    }
  }

  async #closeSequelize() {
    if (this.#sequelize != null) {
      await this.#sequelize.close();
    }
    this.#sequelize = undefined;
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

const translateBitFlagsToRoleArray = (bitFlags) => {
  if (bitFlags == null) {
    return bitFlags;
  }
  if (!Number.isInteger(bitFlags)) {
    throw new IllegalArgumentError();
  }
  const roleArray = [];
  let remainingFlags = bitFlags;
  let index = 0;
  while (remainingFlags > 0) {
    if (index >= roleBitFlagOrder.length) {
      break;
    }
    if (remainingFlags % 2 > 0) {
      roleArray.push(roleBitFlagOrder[index]);
    }
    remainingFlags = Math.floor(remainingFlags / 2);
    index++;
  }
  return roleArray;
};

const validateAuthorityObjectSchema = (authority) => {
  if (authority == null) {
    return true;
  }
  if (typeof authority !== 'object') {
    return false;
  }
  if (authority.id != null && typeof authority.id !== 'string') {
    return false;
  }
  if (!validateRoleArrayType(authority.roles)) {
    return false;
  }
  return true;
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
const sequelizeOptions = {
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 2,
    min: 0,
    idle: 0,
    acquire: 5000,
    evict: 5000
  }
};
const sequelizePersistentSessionAttributes = {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    field: 'Id'
  },
  userAccountId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'UserAccountId'
  },
  roles: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    field: 'Roles'
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'RefreshToken'
  },
  creationTime: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'CreationTime'
  },
  expirationTime: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'ExpirationTime'
  }
};
const sequelizePersistentSessionOptions = {
  timestamps: false,
  tableName: 'PersistentSessions'
};
