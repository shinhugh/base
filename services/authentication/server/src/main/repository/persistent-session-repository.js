import { v4 as generateUuid } from 'uuid';
import { Sequelize, DataTypes } from 'sequelize';
import { RepositoryIllegalArgumentError, RepositoryConflictError } from './model/errors.js';

class PersistentSessionRepository {
  #sequelize;
  #config;

  constructor(config) {
    if (config == null || !validateConfig(config)) {
      throw new Error('Invalid config provided to PersistentSessionRepository constructor');
    }
    this.#config = {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password
    };
  }

  async readById(id) {
    if (typeof id !== 'string' || id.length > idMaxLength) {
      throw new RepositoryIllegalArgumentError();
    }
    await this.#openSequelize(this.#config);
    try {
      return await this.#sequelize.models.persistentSessions.findAll({
        where: {
          id: id
        }
      });
    }
    catch {
      throw new Error('Unexpected error when querying database');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async readByRefreshToken(refreshToken) {
    if (typeof refreshToken !== 'string' || refreshToken.length > refreshTokenMaxLength) {
      throw new RepositoryIllegalArgumentError();
    }
    await this.#openSequelize(this.#config);
    try {
      return await this.#sequelize.models.persistentSessions.findAll({
        where: {
          refreshToken: refreshToken
        }
      });
    }
    catch {
      throw new Error('Unexpected error when querying database');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async create(persistentSession) {
    if (persistentSession == null || !validatePersistentSession(persistentSession)) {
      throw new RepositoryIllegalArgumentError();
    }
    const entry = {
      accountId: persistentSession.accountId,
      roles: persistentSession.roles,
      refreshToken: persistentSession.refreshToken,
      creationTime: persistentSession.creationTime,
      expirationTime: persistentSession.expirationTime
    };
    await this.#openSequelize(this.#config);
    try {
      entry.id = await this.#generateId();
      try {
        await this.#sequelize.models.persistentSessions.create(entry);
      }
      catch (e) {
        if (e instanceof Sequelize.ValidationError) {
          throw new RepositoryConflictError();
        }
        throw new Error('Unexpected error when querying database');
      }
      return entry;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async deleteByAccountId(accountId) {
    if (typeof accountId !== 'string' || accountId.length > accountIdMaxLength) {
      throw new RepositoryIllegalArgumentError();
    }
    await this.#openSequelize(this.#config);
    try {
      return await this.#sequelize.models.persistentSessions.destroy({
        where: {
          accountId: accountId
        }
      });
    }
    catch {
      throw new Error('Unexpected error when querying database');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async deleteByRefreshToken(refreshToken) {
    if (typeof refreshToken !== 'string' || refreshToken.length > refreshTokenMaxLength) {
      throw new RepositoryIllegalArgumentError();
    }
    await this.#openSequelize(this.#config);
    try {
      return await this.#sequelize.models.persistentSessions.destroy({
        where: {
          refreshToken: refreshToken
        }
      });
    }
    catch {
      throw new Error('Unexpected error when querying database');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async #generateId() {
    let id = generateUuid();
    while (true) {
      const match = await (async () => {
        try {
          return await this.#sequelize.models.persistentSessions.findOne({
            where: {
              id: id
            }
          });
        }
        catch {
          throw new Error('Unexpected error when querying database');
        }
      })();
      if (match == null) {
        break;
      }
      id = generateUuid();
    }
    return id;
  }

  async #openSequelize(config) {
    if (this.#sequelize == null) {
      this.#sequelize = new Sequelize({
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        dialect: sequelizeOptions.dialect,
        logging: sequelizeOptions.logging,
        pool: sequelizeOptions.pool
      });
      try {
        await this.#sequelize.authenticate();
      }
      catch {
        throw new Error('Connection to database failed');
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
}

const validateConfig = (config) => {
  if (config == null) {
    return true;
  }
  if (typeof config !== 'object') {
    return false;
  }
  if (typeof config.host !== 'string') {
    return false;
  }
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > portMaxValue) {
    return false;
  }
  if (typeof config.database !== 'string') {
    return false;
  }
  if (typeof config.username !== 'string') {
    return false;
  }
  if (typeof config.password !== 'string') {
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

const portMaxValue = 65535;
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
  PersistentSessionRepository
};
