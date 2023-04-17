import { v4 as generateUuid } from 'uuid';
import { Sequelize, DataTypes, UniqueConstraintError } from 'sequelize';
import { AccountRepository } from './account-repository.js';
import { wrapError } from '../common.js';
import { IllegalArgumentError, NotFoundError, ConflictError } from './model/errors.js';

class AccountSequelizeRepository extends AccountRepository {
  #sequelize;
  #config;

  constructor(config) {
    super();
    if (config == null || !validateConfig(config)) {
      throw new Error('Invalid config provided to AccountSequelizeRepository constructor');
    }
    this.#config = {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password
    };
  }

  async readByIdAndName(id, name) {
    if (id == null && name == null) {
      throw new IllegalArgumentError();
    }
    if (id != null && (typeof id !== 'string' || id.length > idMaxLength)) {
      throw new IllegalArgumentError();
    }
    if (name != null && (typeof name !== 'string' || name.length > nameMaxLength)) {
      throw new IllegalArgumentError();
    }
    const query = { };
    if (id != null) {
      query.id = id;
    }
    if (name != null) {
      query.name = name;
    }
    await this.#openSequelize();
    try {
      return await this.#sequelize.models.accounts.findAll({
        raw: true,
        where: query
      });
    }
    catch (e) {
      throw wrapError(e, 'Failed to execute database transaction');
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async create(account) {
    if (account == null || !validateAccount(account)) {
      throw new IllegalArgumentError();
    }
    const entry = {
      name: account.name,
      passwordHash: account.passwordHash,
      passwordSalt: account.passwordSalt,
      roles: account.roles
    };
    await this.#openSequelize();
    try {
      entry.id = await this.#generateId();
      try {
        await this.#sequelize.models.accounts.create(entry);
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

  async updateByIdAndName(id, name, account) {
    if (id == null && name == null) {
      throw new IllegalArgumentError();
    }
    if (id != null && (typeof id !== 'string' || id.length > idMaxLength)) {
      throw new IllegalArgumentError();
    }
    if (name != null && (typeof name !== 'string' || name.length > nameMaxLength)) {
      throw new IllegalArgumentError();
    }
    if (account == null || !validateAccount(account)) {
      throw new IllegalArgumentError();
    }
    const query = { };
    if (id != null) {
      query.id = id;
    }
    if (name != null) {
      query.name = name;
    }
    const entry = {
      name: account.name,
      passwordHash: account.passwordHash,
      passwordSalt: account.passwordSalt,
      roles: account.roles
    };
    await this.#openSequelize();
    try {
      const match = await (async () => {
        try {
          return await this.#sequelize.models.accounts.findOne({
            where: query
          });
        }
        catch (e) {
          throw wrapError(e, 'Failed to execute database transaction');
        }
      })();
      if (match == null) {
        throw new NotFoundError();
      }
      await (async () => {
        try {
          return await this.#sequelize.models.accounts.update(entry, {
            where: query
          });
        }
        catch (e) {
          if (e instanceof UniqueConstraintError) {
            throw new ConflictError();
          }
          throw wrapError(e, 'Failed to execute database transaction');
        }
      })();
      entry.id = match.id;
      return entry;
    }
    finally {
      await this.#closeSequelize();
    }
  }

  async deleteByIdAndName(id, name) {
    if (id == null && name == null) {
      throw new IllegalArgumentError();
    }
    if (id != null && (typeof id !== 'string' || id.length > idMaxLength)) {
      throw new IllegalArgumentError();
    }
    if (name != null && (typeof name !== 'string' || name.length > nameMaxLength)) {
      throw new IllegalArgumentError();
    }
    const query = { };
    if (id != null) {
      query.id = id;
    }
    if (name != null) {
      query.name = name;
    }
    await this.#openSequelize();
    try {
      return await this.#sequelize.models.accounts.destroy({
        where: query
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
          return await this.#sequelize.models.accounts.findOne({
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
      this.#sequelize.define('accounts', sequelizeAccountAttributes, sequelizeAccountOptions);
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

const validateAccount = (account) => {
  if (account == null) {
    return true;
  }
  if (typeof account !== 'object') {
    return false;
  }
  if (typeof account.name !== 'string' || account.name.length > nameMaxLength) {
    return false;
  }
  if (typeof account.passwordHash !== 'string' || account.passwordHash.length > passwordHashMaxLength) {
    return false;
  }
  if (typeof account.passwordSalt !== 'string' || account.passwordSalt.length > passwordSaltMaxLength) {
    return false;
  }
  if (!Number.isInteger(account.roles) || account.roles < 0 || account.roles > rolesMaxValue) {
    return false;
  }
  return true;
};

const portMaxValue = 65535;
const idMaxLength = 36;
const nameMaxLength = 32;
const passwordHashMaxLength = 64;
const passwordSaltMaxLength = 32;
const rolesMaxValue = 255;
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
const sequelizeAccountAttributes = {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    field: 'Id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'Name'
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'PasswordHash'
  },
  passwordSalt: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'PasswordSalt'
  },
  roles: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    field: 'Roles'
  }
};
const sequelizeAccountOptions = {
  timestamps: false,
  tableName: 'Accounts'
};

export {
  AccountSequelizeRepository
};
