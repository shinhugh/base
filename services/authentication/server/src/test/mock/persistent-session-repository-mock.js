import { PersistentSessionRepository } from '../../main/repository/persistent-session-repository.js';

class PersistentSessionRepositoryMock extends PersistentSessionRepository {
  #readByIdReturnValue;
  #readByIdInvokeCount;
  #readByIdIdArgument;
  #readByRefreshTokenReturnValue;
  #readByRefreshTokenInvokeCount;
  #readByRefreshTokenRefreshTokenArgument;
  #createReturnValue;
  #createInvokeCount;
  #createPersistentSessionArgument;
  #deleteByAccountIdReturnValue;
  #deleteByAccountIdInvokeCount;
  #deleteByAccountIdAccountIdArgument;
  #deleteByRefreshTokenReturnValue;
  #deleteByRefreshTokenInvokeCount;
  #deleteByRefreshTokenRefreshTokenArgument;

  constructor() {
    super({
      host: '',
      port: 0,
      database: '',
      username: '',
      password: ''
    });
  }

  async readById(id) {
    this.#readByIdInvokeCount++;
    this.#readByIdIdArgument = id;
    return this.#readByIdReturnValue;
  }

  async readByRefreshToken(refreshToken) {
    this.#readByRefreshTokenInvokeCount++;
    this.#readByRefreshTokenRefreshTokenArgument = refreshToken;
    return this.#readByRefreshTokenReturnValue;
  }

  async create(persistentSession) {
    this.#createInvokeCount++;
    this.#createPersistentSessionArgument = persistentSession;
    return this.#createReturnValue;
  }

  async deleteByAccountId(accountId) {
    this.#deleteByAccountIdInvokeCount++;
    this.#deleteByAccountIdAccountIdArgument = accountId;
    return this.#deleteByAccountIdReturnValue;
  }

  async deleteByRefreshToken(refreshToken) {
    this.#deleteByRefreshTokenInvokeCount++;
    this.#deleteByRefreshTokenRefreshTokenArgument = refreshToken;
    return this.#deleteByRefreshTokenReturnValue;
  }

  resetSpy() {
    this.#readByIdInvokeCount = 0;
    this.#readByIdIdArgument = undefined;
    this.#readByRefreshTokenInvokeCount = 0;
    this.#readByRefreshTokenRefreshTokenArgument = undefined;
    this.#createInvokeCount = 0;
    this.#createPersistentSessionArgument = undefined;
    this.#deleteByAccountIdInvokeCount = 0;
    this.#deleteByAccountIdAccountIdArgument = undefined;
    this.#deleteByRefreshTokenInvokeCount = 0;
    this.#deleteByRefreshTokenRefreshTokenArgument = undefined;
  }

  set readByIdReturnValue(readByIdReturnValue) {
    this.#readByIdReturnValue = readByIdReturnValue;
  }

  get readByIdInvokeCount() {
    return this.#readByIdInvokeCount;
  }

  get readByIdIdArgument() {
    return this.#readByIdIdArgument;
  }

  set readByRefreshTokenReturnValue(readByRefreshTokenReturnValue) {
    this.#readByRefreshTokenReturnValue = readByRefreshTokenReturnValue;
  }

  get readByRefreshTokenInvokeCount() {
    return this.#readByRefreshTokenInvokeCount;
  }

  get readByRefreshTokenRefreshTokenArgument() {
    return this.#readByRefreshTokenRefreshTokenArgument;
  }

  set createReturnValue(createReturnValue) {
    this.#createReturnValue = createReturnValue;
  }

  get createInvokeCount() {
    return this.#createInvokeCount;
  }

  get createPersistentSessionArgument() {
    return this.#createPersistentSessionArgument;
  }

  set deleteByAccountIdReturnValue(deleteByAccountIdReturnValue) {
    this.#deleteByAccountIdReturnValue = deleteByAccountIdReturnValue;
  }

  get deleteByAccountIdInvokeCount() {
    return this.#deleteByAccountIdInvokeCount;
  }

  get deleteByAccountIdAccountIdArgument() {
    return this.#deleteByAccountIdAccountIdArgument;
  }

  set deleteByRefreshTokenReturnValue(deleteByRefreshTokenReturnValue) {
    this.#deleteByRefreshTokenReturnValue = deleteByRefreshTokenReturnValue;
  }

  get deleteByRefreshTokenInvokeCount() {
    return this.#deleteByRefreshTokenInvokeCount;
  }

  get deleteByRefreshTokenRefreshTokenArgument() {
    return this.#deleteByRefreshTokenRefreshTokenArgument;
  }
}

export {
  PersistentSessionRepositoryMock
};
