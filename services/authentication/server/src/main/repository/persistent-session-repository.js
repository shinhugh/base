import { v4 as generateUuid } from 'uuid';
import { Sequelize, DataTypes } from 'sequelize';
import { IllegalArgumentError, NotFoundError, ConflictError } from '../model/errors.js';

class PersistentSessionRepository {
  #sequelize;
  #databaseInfo;

  constructor(databaseInfo) {
    if (databaseInfo == null || !validateDatabaseInfo(databaseInfo)) {
      throw new Error();
    }
    this.#databaseInfo = {
      host: databaseInfo.host,
      port: databaseInfo.port,
      database: databaseInfo.database,
      username: databaseInfo.username,
      password: databaseInfo.password
    };
  }

  async readByIdAndRefreshToken(id, refreshToken) {
    if (id == null && refreshToken == null) {
      throw new IllegalArgumentError();
    }
    if (id != null && (typeof id !== 'string' || id.length > idMaxLength)) {
      throw new IllegalArgumentError();
    }
    if (refreshToken != null && (typeof refreshToken !== 'string' || refreshToken.length > refreshTokenMaxLength)) {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      const matches = await this.#sequelize.models.persistentSessions.findAll({
        where: {
          id: id ?? undefined,
          refreshToken: refreshToken ?? undefined
        }
      });
      return matches;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async create(persistentSession) {
    if (persistentSession == null || !validatePersistentSession(persistentSession)) {
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
      return entry;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async deleteByUserAccountIdAndRefreshToken(userAccountId, refreshToken) {
    if (userAccountId == null && refreshToken == null) {
      throw new IllegalArgumentError();
    }
    if (userAccountId != null && (typeof userAccountId !== 'string' || userAccountId.length > userAccountIdMaxLength)) {
      throw new IllegalArgumentError();
    }
    if (refreshToken != null && (typeof refreshToken !== 'string' || refreshToken.length > refreshTokenMaxLength)) {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      return await this.#sequelize.models.persistentSessions.destroy({
        where: {
          userAccountId: userAccountId ?? undefined,
          refreshToken: refreshToken ?? undefined
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

const validatePersistentSession = (persistentSession) => {
  if (persistentSession == null) {
    return true;
  }
  if (typeof persistentSession !== 'object') {
    return false;
  }
  if (typeof persistentSession.userAccountId !== 'string' || persistentSession.userAccountId.length > userAccountIdMaxLength) {
    return false;
  }
  if (!Number.isInteger(persistentSession.roles) || persistentSession.roles < 0 || persistentSession.roles > rolesMaxValue) {
    return false;
  }
  if (typeof persistentSession.refreshToken !== 'string' || persistentSession.refreshToken.length > refreshTokenMaxLength) {
    return false;
  }
  if (!Number.isInteger(persistentSession.creationTime) || persistentSession.creationTime < 0 || persistentSession.creationTime > creationTimeMaxValue) {
    return false;
  }
  if (!Number.isInteger(persistentSession.expirationTime) || persistentSession.expirationTime < 0 || persistentSession.expirationTime > expirationTimeMaxValue) {
    return false;
  }
  return true;
};

const maxPortNumber = 65535;
const idMaxLength = 36;
const userAccountIdMaxLength = 36;
const rolesMaxValue = 255;
const refreshTokenMaxLength = 128;
const creationTimeMaxValue = 4294967295;
const expirationTimeMaxValue = 4294967295;
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
