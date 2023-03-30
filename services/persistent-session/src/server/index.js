import { Sequelize, DataTypes } from 'sequelize';

export class PersistentSessionServiceServer {
  #databaseInfo;

  constructor(databaseInfo) {
    this.#databaseInfo = databaseInfo;
  }

  async getById(authority, id) {
    throw new Error('Not implemented');
    // TODO: Implement
  }

  async getByRefreshToken(authority, refreshToken) {
    throw new Error('Not implemented');
    // TODO: Implement
  }

  async create(authority, persistentSession) {
    await openSequelize(this.#databaseInfo);
    try {
      await sequelize.models.persistentSessions.create({
        id: persistentSession.id,
        owner: persistentSession.owner,
        roles: translateRoleArrayToBitFlags(persistentSession.roles),
        refreshToken: persistentSession.refreshToken,
        creationTime: persistentSession.creationTime,
        expirationTime: persistentSession.expirationTime
      });
    }
    finally {
      await closeSequelize();
    }
  }

  async deleteByRefreshToken(authority, refreshToken) {
    throw new Error('Not implemented');
    // TODO: Implement
  }

  async deleteByUserAccountId(authority, userAccountId) {
    throw new Error('Not implemented');
    // TODO: Implement
  }
}

export class PersistentSession {
  #id;
  #owner;
  #roles;
  #refreshToken;
  #creationTime;
  #expirationTime;

  constructor(id, owner, roles, refreshToken, creationTime, expirationTime) {
    this.#id = id;
    this.#owner = owner;
    this.#roles = roles;
    this.#refreshToken = refreshToken;
    this.#creationTime = creationTime;
    this.#expirationTime = expirationTime;
  }

  get id() {
    return this.#id;
  }

  set id(id) {
    this.#id = id;
  }

  get owner() {
    return this.#owner;
  }

  set owner(owner) {
    this.#owner = owner;
  }

  get roles() {
    return this.#roles;
  }

  set roles(roles) {
    this.#roles = roles;
  }

  get refreshToken() {
    return this.#refreshToken;
  }

  set refreshToken(refreshToken) {
    this.#refreshToken = refreshToken;
  }

  get creationTime() {
    return this.#creationTime;
  }

  set creationTime(creationTime) {
    this.#creationTime = creationTime;
  }

  get expirationTime() {
    return this.#expirationTime;
  }

  set expirationTime(expirationTime) {
    this.#expirationTime = expirationTime;
  }
}

export class Authority {
  #id;
  #roles;

  constructor(id, roles) {
    this.#id = id;
    this.roles = roles;
  }

  get id() {
    return this.#id;
  }

  set id(id) {
    this.#id = id;
  }

  get roles() {
    return this.#roles;
  }

  set roles(roles) {
    this.#roles = roles;
  }
}

export class Role {
  static #allowConstructor = false;

  #name;

  static #create(name) {
    Role.#allowConstructor = true;
    const instance = new Role(name);
    Role.#allowConstructor = false;
    return instance;
  }

  static System = Role.#create('system');
  static User = Role.#create('user');
  static Admin = Role.#create('admin');

  constructor(name) {
    if (!Role.#allowConstructor) {
      throw new Error('Role cannot be instantiated');
    }
    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  set name(name) {
    this.#name = name;
  }
}

export class DatabaseInfo {
  #host;
  #port;
  #database;
  #username;
  #password;

  constructor(host, port, database, username, password) {
    this.#host = host;
    this.#port = port;
    this.#database = database;
    this.#username = username;
    this.#password = password;
  }

  get host() {
    return this.#host;
  }

  set host(host) {
    this.#host = host;
  }

  get port() {
    return this.#port;
  }

  set port(port) {
    this.#port = port;
  }

  get database() {
    return this.#database;
  }

  set database(database) {
    this.#database = database;
  }

  get username() {
    return this.#username;
  }

  set username(username) {
    this.#username = username;
  }

  get password() {
    return this.#password;
  }

  set password(password) {
    this.#password = password;
  }
}

const translateRoleArrayToBitFlags = (roles) => {
  const uniqueRoles = [...new Set(roles)];
  let bitFlags = 0;
  for (const role of uniqueRoles) {
    bitFlags += roleToBitFlagMap.get(role);
  }
  return bitFlags;
};

const openSequelize = async (databaseInfo) => {
  if (!sequelize) {
    sequelize = new Sequelize({
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
    await sequelize.authenticate();
    sequelize.define('persistentSessions', sequelizePersistentSessionAttributes, sequelizePersistentSessionOptions);
  }
};

const closeSequelize = async () => {
  if (sequelize) {
    await sequelize.close();
  }
  sequelize = undefined;
};

const roleToBitFlagMap = new Map([
  [Role.System, 1],
  [Role.User, 2],
  [Role.Admin, 4]
]);
const sequelizePersistentSessionAttributes = {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    field: 'Id'
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Owner'
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
let sequelize;
