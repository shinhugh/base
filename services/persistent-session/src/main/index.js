export class PersistentSessionService {
  getById(authority, id) {
    // TODO: Implement
  }

  getByRefreshToken(authority, refreshToken) {
    // TODO: Implement
  }

  create(authority, persistentSession) {
    // TODO: Implement
  }

  deleteByRefreshToken(authority, refreshToken) {
    // TODO: Implement
  }

  deleteByUserAccountId(authority, userAccountId) {
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
    this.#roles = roles;
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
