import { v4 as generateUuid } from 'uuid';
import { Sequelize, DataTypes, Op, UniqueConstraintError } from 'sequelize';
import { PersistentSessionRepository } from './persistent-session-repository.js';
import { wrapError } from '../common.js';
import { IllegalArgumentError, ConflictError } from './model/errors.js';

class PersistentSessionSequelizeRepository extends PersistentSessionRepository {
  #sequelize;
  #config;

  constructor(config) {
    super();
    this.#configure(config);
  }

  async readById(id) {
    if (typeof id !== 'string' || id.length > idMaxLength) {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize();
    try {
      return await this.#sequelize.models.persistentSessions.findAll({
        raw: true,
        where: {
          id: id
        }
      });
    }
    catch (e) {
      throw wrapError(e, 'Failed to execute database transaction');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async readByRefreshToken(refreshToken) {
    if (typeof refreshToken !== 'string' || refreshToken.length > refreshTokenMaxLength) {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize();
    try {
      return await this.#sequelize.models.persistentSessions.findAll({
        raw: true,
        where: {
          refreshToken: refreshToken
        }
      });
    }
    catch (e) {
      throw wrapError(e, 'Failed to execute database transaction');
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
      accountId: persistentSession.accountId,
      roles: persistentSession.roles,
      refreshToken: persistentSession.refreshToken,
      creationTime: persistentSession.creationTime,
      expirationTime: persistentSession.expirationTime
    };
    await this.#openSequelize();
    try {
      entry.id = await this.#generateId();
      try {
        await this.#sequelize.models.persistentSessions.create(entry);
      }
      catch (e) {
        if (e instanceof UniqueConstraintError) {
          throw new ConflictError();
        }
        throw wrapError(e, 'Failed to execute database transaction');
      }
      return entry;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async deleteByAccountId(accountId) {
    if (typeof accountId !== 'string' || accountId.length > accountIdMaxLength) {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize();
    try {
      return await this.#sequelize.models.persistentSessions.destroy({
        where: {
          accountId: accountId
        }
      });
    }
    catch (e) {
      throw wrapError(e, 'Failed to execute database transaction');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async deleteByRefreshToken(refreshToken) {
    if (typeof refreshToken !== 'string' || refreshToken.length > refreshTokenMaxLength) {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize();
    try {
      return await this.#sequelize.models.persistentSessions.destroy({
        where: {
          refreshToken: refreshToken
        }
      });
    }
    catch (e) {
      throw wrapError(e, 'Failed to execute database transaction');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async deleteByLessThanExpirationTime(expirationTime) {
    if (!Number.isInteger(expirationTime) || expirationTime < 0 || expirationTime > expirationTimeMaxValue) {
      throw new IllegalArgumentError();
    }
    await this.#openSequelize();
    try {
      return await this.#sequelize.models.persistentSessions.destroy({
        where: {
          expirationTime: {
            [Op.lte]: expirationTime
          }
        }
      });
    }
    catch (e) {
      throw wrapError(e, 'Failed to execute database transaction');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async #generateId() {
    while (true) {
      const id = generateUuid();
      const match = await (async () => {
        try {
          return await this.#sequelize.models.persistentSessions.findOne({
            where: {
              id: id
            }
          });
        }
        catch (e) {
          throw wrapError(e, 'Failed to execute database transaction');
        }
      })();
      if (match == null) {
        return id;
      }
    }
  }

  async #openSequelize() {
    if (this.#sequelize == null) {
      this.#sequelize = new Sequelize({
        host: this.#config.host,
        port: this.#config.port,
        database: this.#config.database,
        username: this.#config.username,
        password: this.#config.password,
        dialect: sequelizeOptions.dialect,
        logging: sequelizeOptions.logging,
        pool: sequelizeOptions.pool
      });
      try {
        await this.#sequelize.authenticate();
      }
      catch (e) {
        throw wrapError(e, 'Failed to connect to database');
      }
      this.#sequelize.define('persistentSessions', sequelizePersistentSessionAttributes, sequelizePersistentSessionOptions);
    }
  }

  async #closeSequelize() {
    if (this.#sequelize != null) {
      await this.#sequelize.close();
    }
    this.#sequelize = undefined;
  }

  #configure(config) {
    this.#config = { };
    if (config == null) {
      throw new Error('Invalid config provided to PersistentSessionSequelizeRepository constructor');
    }
    if (typeof config !== 'object') {
      throw new Error('Invalid config provided to PersistentSessionSequelizeRepository constructor');
    }
    if (config.host != null && typeof config.host !== 'string') {
      throw new Error('Invalid config provided to PersistentSessionSequelizeRepository constructor');
    }
    if (config.host == null || config.host.length == 0) {
      this.#config.host = 'localhost';
    }
    else {
      this.#config.host = config.host;
    }
    if (!Number.isInteger(config.port)) {
      throw new Error('Invalid config provided to PersistentSessionSequelizeRepository constructor');
    }
    this.#config.port = config.port;
    try {
      new URL('mysql://' + this.#config.host + ':' + this.#config.port + '/');
    }
    catch {
      throw new Error('Invalid config provided to AccountSequelizeRepository constructor');
    }
    if (typeof config.database !== 'string') {
      throw new Error('Invalid config provided to PersistentSessionSequelizeRepository constructor');
    }
    this.#config.database = config.database;
    if (typeof config.username !== 'string') {
      throw new Error('Invalid config provided to PersistentSessionSequelizeRepository constructor');
    }
    this.#config.username = config.username;
    if (typeof config.password !== 'string') {
      throw new Error('Invalid config provided to PersistentSessionSequelizeRepository constructor');
    }
    this.#config.password = config.password;
  }
}

const validatePersistentSession = (persistentSession) => {
  if (persistentSession == null) {
    return true;
  }
  if (typeof persistentSession !== 'object') {
    return false;
  }
  if (typeof persistentSession.accountId !== 'string' || persistentSession.accountId.length > accountIdMaxLength) {
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

const idMaxLength = 36;
const accountIdMaxLength = 36;
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
  accountId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'AccountId'
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
  PersistentSessionSequelizeRepository
};
