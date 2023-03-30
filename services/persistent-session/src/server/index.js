import { Sequelize, DataTypes } from 'sequelize';

// TODO: Remove comments
// TODO: Organize code

export class PersistentSessionServiceServer {
  #databaseInfo;
  #sequelize;

  // databaseInfo: Object
  // databaseInfo.host: String
  // databaseInfo.port: Number
  // databaseInfo.database: String
  // databaseInfo.username: String
  // databaseInfo.password: String
  constructor(databaseInfo) {
    this.#databaseInfo = databaseInfo;
  }

  // From Identification service
  // authority: Object (optional)
  // authority.id: String (optional)
  // authority.roles: [Role] (optional)
  // id: String
  async readById(authority, id) {
    if (!authority || !authority.roles || !authority.roles.includes(Role.System)) {
      throw new AccessDeniedError();
    }
    await this.#openSequelize(this.#databaseInfo);
    try {
      const persistentSession = await this.#sequelize.models.persistentSessions.findOne({
        where: {
          id: id
        }
      });
      if (!persistentSession) {
        throw new NotFoundError();
      }
      return new PersistentSession(persistentSession.id, persistentSession.userAccountId, persistentSession.roles, persistentSession.refreshToken, persistentSession.creationTime, persistentSession.expirationTime);
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Login service
  // authority: Object (optional)
  // authority.id: String (optional)
  // authority.roles: [Role] (optional)
  // refreshToken: String
  async readByRefreshToken(authority, refreshToken) {
    await this.#openSequelize(this.#databaseInfo);
    try {
      const persistentSession = await this.#sequelize.models.persistentSessions.findOne({
        where: {
          refreshToken: refreshToken
        }
      });
      if (!persistentSession) {
        throw new NotFoundError();
      }
      return new PersistentSession(persistentSession.id, persistentSession.userAccountId, persistentSession.roles, persistentSession.refreshToken, persistentSession.creationTime, persistentSession.expirationTime);
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Login service
  // authority: Object (optional)
  // authority.id: String (optional)
  // authority.roles: [Role] (optional)
  // persistentSession: PersistentSession
  async create(authority, persistentSession) {
    // TODO: Handle illegal argument
    await this.#openSequelize(this.#databaseInfo);
    try {
      const roles = translateRoleArrayToBitFlags(persistentSession.roles);
      try {
        await this.#sequelize.models.persistentSessions.create({
          id: persistentSession.id,
          userAccountId: persistentSession.userAccountId,
          roles: roles,
          refreshToken: persistentSession.refreshToken,
          creationTime: persistentSession.creationTime,
          expirationTime: persistentSession.expirationTime
        });
      }
      catch (e) {
        throw new ConflictError();
      }
    }
    finally {
      await this.#closeSequelize();
    }
  }

  // From Logout service
  // authority: Object (optional)
  // authority.id: String (optional)
  // authority.roles: [Role] (optional)
  // refreshToken: String
  async deleteByRefreshToken(authority, refreshToken) {
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

  // From Account service
  // authority: Object (optional)
  // authority.id: String (optional)
  // authority.roles: [Role] (optional)
  // userAccountId: String
  async deleteByUserAccountId(authority, userAccountId) {
    if (!authority || !authority.roles || !(authority.roles.includes(Role.System) || authority.roles.includes(Role.Admin) || (authority.roles.includes(Role.User) && authority.id && authority.id === userAccountId))) {
      throw new AccessDeniedError();
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

  async #openSequelize(databaseInfo) {
    if (!this.#sequelize) {
      this.#sequelize = new Sequelize({
        host: databaseInfo.host,
        port: databaseInfo.port,
        database: databaseInfo.database,
        username: databaseInfo.username,
        password: databaseInfo.password,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 2,
          min: 0,
          idle: 0,
          acquire: 5000,
          evict: 5000
        }
      });
      await this.#sequelize.authenticate();
      this.#sequelize.define('persistentSessions', sequelizePersistentSessionAttributes, sequelizePersistentSessionOptions);
    }
  }

  async #closeSequelize() {
    if (this.#sequelize) {
      await this.#sequelize.close();
    }
    this.#sequelize = undefined;
  }
}

export class PersistentSession {
  // id: String
  // userAccountId: String
  // roles: [Role]
  // refreshToken: String
  // creationTime: Number
  // expirationTime: Number
  constructor(id, userAccountId, roles, refreshToken, creationTime, expirationTime) {
    this.id = id;
    this.userAccountId = userAccountId;
    this.roles = roles;
    this.refreshToken = refreshToken;
    this.creationTime = Math.floor(creationTime);
    this.expirationTime = Math.floor(expirationTime);
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
      throw new Error('Role cannot be instantiated');
    }
    this.#name = name;
  }

  get name() {
    return this.#name;
  }
}

export class AccessDeniedError extends Error {
  constructor() {
    super('Access denied');
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends Error {
  constructor() {
    super('Not found');
    this.name = this.constructor.name;
  }
}

export class ConflictError extends Error {
  constructor() {
    super('Conflict');
    this.name = this.constructor.name;
  }
}

const translateRoleArrayToBitFlags = (roleArray) => {
  const filteredRoleArray = [...new Set(roleArray)];
  let bitFlags = 0;
  for (const role of filteredRoleArray) {
    bitFlags += Math.pow(2, roleBitFlagOrder.indexOf(role));
  }
  return bitFlags;
};

const translateBitFlagsToRoleArray = (bitFlags) => {
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

const roleBitFlagOrder = [Role.System, Role.User, Role.Admin];
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
