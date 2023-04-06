import { v4 as generateUuid, validate as validateUuid } from 'uuid';
import { Sequelize, DataTypes } from 'sequelize';
import { IllegalArgumentError, AccessDeniedError, NotFoundError, ConflictError } from './errors.js';
import { Role } from './role.js';

class PersistentSessionRepository {
  #databaseInfo;
  #sequelize;

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

  async create(authority, persistentSession) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System)) {
      throw new AccessDeniedError();
    }
    if (persistentSession == null || !validatePersistentSession(persistentSession)) {
      throw new IllegalArgumentError();
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const entry = {
      userAccountId: persistentSession.userAccountId,
      roles: persistentSession.roles,
      creationTime: currentTime,
      expirationTime: currentTime + sessionDuration
    };
    await this.#openSequelize(this.#databaseInfo);
    try {
      entry.id = await this.#generateId();
      entry.refreshToken = await this.#generateRefreshToken();
      try {
        await this.#sequelize.models.persistentSessions.create(entry);
      }
      catch (e) {
        if (e instanceof Sequelize.ValidationError) {
          throw new ConflictError();
        }
        throw e;
      }
      return entry;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async readById(authority, id) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System)) {
      throw new AccessDeniedError();
    }
    if (typeof id !== 'string' || !validateUuid(id)) {
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

  async readByRefreshToken(authority, refreshToken) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System)) {
      throw new AccessDeniedError();
    }
    if (refreshToken == null || !validateRefreshToken(refreshToken)) {
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

  async deleteByUserAccountId(authority, userAccountId) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.System | Role.Admin | Role.User)) {
      throw new AccessDeniedError();
    }
    if (typeof userAccountId !== 'string' || !validateUuid(userAccountId)) {
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

  async deleteByRefreshToken(authority, refreshToken) {
    if (!validateAuthority(authority)) {
      throw new IllegalArgumentError();
    }
    if (refreshToken == null || !validateRefreshToken(refreshToken)) {
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
    let id = generateUuid();
    while (await this.#sequelize.models.persistentSessions.findOne({
      where: {
        id: id
      }
    }) != null) {
      id = generateUuid();
    }
    return id;
  }

  async #generateRefreshToken() {
    let refreshToken = generateRandomString(refreshTokenAllowedChars, refreshTokenLength);
    while (await this.#sequelize.models.persistentSessions.findOne({
      where: {
        refreshToken: refreshToken
      }
    }) != null) {
      refreshToken = generateRandomString(refreshTokenAllowedChars, refreshTokenLength);
    }
    return refreshToken;
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
  if (authority.id != null && (typeof authority.id !== 'string' || !validateUuid(authority.id))) {
    return false;
  }
  if (authority.roles != null && (!Number.isInteger(authority.roles) || authority.roles < 0 || authority.roles > rolesMaxValue)) {
    return false;
  }
  if (authority.authTime != null && (!Number.isInteger(authority.authTime) || authority.authTime < 0 || authority.authTime > timeMaxValue)) {
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
  if (typeof persistentSession.userAccountId !== 'string' || !validateUuid(persistentSession.userAccountId)) {
    return false;
  }
  if (!Number.isInteger(persistentSession.roles) || persistentSession.roles < 0 || persistentSession.roles > rolesMaxValue) {
    return false;
  }
  return true;
};

const validateRefreshToken = (refreshToken) => {
  if (refreshToken == null) {
    return true;
  }
  if (typeof refreshToken !== 'string') {
    return false;
  }
  if (refreshToken.length != refreshTokenLength) {
    return false;
  }
  for (const letter of refreshToken) {
    if (refreshTokenAllowedChars.indexOf(letter) < 0) {
      return false;
    }
  }
  return true;
};

const generateRandomString = (pool, length) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return result;
};

const maxPortNumber = 65535;
const rolesMaxValue = 255;
const timeMaxValue = 4294967295;
const sessionDuration = 1209600;
const refreshTokenAllowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const refreshTokenLength = 128;
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
  PersistentSessionRepository
};
