import { randomUUID } from 'crypto';
import { Sequelize, DataTypes } from 'sequelize';

// TODO: Remove comments

class PersistentSessionService {
  #databaseInfo;
  #sequelize;

  // databaseInfo: object
  // databaseInfo.host: string
  // databaseInfo.port: number (unsigned 16-bit integer)
  // databaseInfo.database: string
  // databaseInfo.username: string
  // databaseInfo.password: string
  constructor(databaseInfo) {
    if (databaseInfo == null || !validateDatabaseInfo(databaseInfo)) {
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
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // persistentSession: object
  // persistentSession.userAccountId: string
  // persistentSession.roles: number (unsigned 8-bit integer)
  // persistentSession.refreshToken: string
  // persistentSession.creationTime: number (unsigned 32-bit integer)
  // persistentSession.expirationTime: number (unsigned 32-bit integer)
  async create(authority, persistentSession) {
    if (!validateAuthority(authority) || !validatePersistentSession(persistentSession)) {
      throw new IllegalArgumentError();
    }
    const entry = {
      userAccountId: persistentSession.userAccountId,
      roles: persistentSession.roles,
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
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // id: string
  async readById(authority, id) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System)) {
      throw new AccessDeniedError();
    }
    if (typeof id !== 'string' || id.length > idLength) {
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
      return entry;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Login service
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // refreshToken: string
  async readByRefreshToken(authority, refreshToken) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (typeof refreshToken !== 'string' || refreshToken.length > refreshTokenMaxLength) {
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
      return entry;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Account service
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // userAccountId: string
  async deleteByUserAccountId(authority, userAccountId) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin | Role.User)) {
      throw new AccessDeniedError();
    }
    if (typeof userAccountId !== 'string' || userAccountId.length > idLength) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin)) {
      if (authority.id !== userAccountId) {
        throw new AccessDeniedError();
      }
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      await this.#sequelize.models.persistentSessions.destroy({
        where: {
          userAccountId: userAccountId
        }
      });
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Logout service
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // refreshToken: string
  async deleteByRefreshToken(authority, refreshToken) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (typeof refreshToken !== 'string' || refreshToken.length > refreshTokenMaxLength) {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      await this.#sequelize.models.persistentSessions.destroy({
        where: {
          refreshToken: refreshToken
        }
      });
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

class IllegalArgumentError extends Error {
  constructor() {
    super(illegalArgumentErrorMessage);
    this.name = this.constructor.name;
  }
}

class AccessDeniedError extends Error {
  constructor() {
    super(accessDeniedErrorMessage);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends Error {
  constructor() {
    super(notFoundErrorMessage);
    this.name = this.constructor.name;
  }
}

class ConflictError extends Error {
  constructor() {
    super(conflictErrorMessage);
    this.name = this.constructor.name;
  }
}

const verifyAuthorityContainsAtLeastOneRole = (authority, roles) => {
  if (!validateAuthority(authority) || (roles != null && (!Number.isInteger(roles) || roles < 0 || roles > rolesMaxValue))) {
    throw new IllegalArgumentError();
  }
  if (roles == null || roles == 0) {
    return true;
  }
  if (authority == null || authority.roles == null) {
    return false;
  }
  return (authority.roles & roles) != 0;
};

const validateDatabaseInfo = (databaseInfo) => {
  if (databaseInfo == null) {
    return true;
  }
  if (typeof databaseInfo !== 'object') {
    return false;
  }
  if (typeof databaseInfo.host !== 'string') {
    return false;
  }
  if (!Number.isInteger(databaseInfo.port) || databaseInfo.port < 0 || databaseInfo.port > maxPortNumber) {
    return false;
  }
  if (typeof databaseInfo.database !== 'string') {
    return false;
  }
  if (typeof databaseInfo.username !== 'string') {
    return false;
  }
  if (typeof databaseInfo.password !== 'string') {
    return false;
  }
  return true;
};

const validateAuthority = (authority) => {
  if (authority == null) {
    return true;
  }
  if (typeof authority !== 'object') {
    return false;
  }
  if (authority.id != null && (typeof authority.id !== 'string' || authority.id.length != idLength)) {
    return false;
  }
  if (authority.roles != null && (!Number.isInteger(authority.roles) || authority.roles < 0 || authority.roles > rolesMaxValue)) {
    return false;
  }
  return true;
};

const validatePersistentSession = (persistentSession) => {
  if (persistentSession == null) {
    return true;
  }
  if (typeof persistentSession !== 'object') {
    return false;
  }
  if (typeof persistentSession.userAccountId !== 'string' || persistentSession.userAccountId.length > idLength) {
    return false;
  }
  if (!Number.isInteger(persistentSession.roles) || persistentSession.roles < 0 || persistentSession.roles > rolesMaxValue) {
    return false;
  }
  if (typeof persistentSession.refreshToken !== 'string' || persistentSession.refreshToken.length > refreshTokenMaxLength) {
    return false;
  }
  if (!Number.isInteger(persistentSession.creationTime) || persistentSession.creationTime < 0 || persistentSession.creationTime > timeMaxValue) {
    return false;
  }
  if (!Number.isInteger(persistentSession.expirationTime) || persistentSession.expirationTime < 0 || persistentSession.expirationTime > timeMaxValue) {
    return false;
  }
  return true;
};

const maxPortNumber = 65535;
const idLength = 36;
const rolesMaxValue = 255;
const refreshTokenMaxLength = 128;
const timeMaxValue = 4294967295;
const illegalArgumentErrorMessage = 'Illegal argument';
const accessDeniedErrorMessage = 'Access denied';
const notFoundErrorMessage = 'Not found';
const conflictErrorMessage = 'Conflict';
const Role = Object.freeze({
  System: Math.pow(2, 0),
  User: Math.pow(2, 1),
  Admin: Math.pow(2, 2)
});
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

export {
  PersistentSessionService,
  IllegalArgumentError,
  AccessDeniedError,
  NotFoundError,
  ConflictError,
  Role
};
