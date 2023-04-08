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
  #deleteByUserAccountIdReturnValue;
  #deleteByUserAccountIdInvokeCount;
  #deleteByUserAccountIdUserAccountIdArgument;
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

  async deleteByUserAccountId(userAccountId) {
    this.#deleteByUserAccountIdInvokeCount++;
    this.#deleteByUserAccountIdUserAccountIdArgument = userAccountId;
    return this.#deleteByUserAccountIdReturnValue;
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
    this.#deleteByUserAccountIdInvokeCount = 0;
    this.#deleteByUserAccountIdUserAccountIdArgument = undefined;
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

  set deleteByUserAccountIdReturnValue(deleteByUserAccountIdReturnValue) {
    this.#deleteByUserAccountIdReturnValue = deleteByUserAccountIdReturnValue;
  }

  get deleteByUserAccountIdInvokeCount() {
    return this.#deleteByUserAccountIdInvokeCount;
  }

  get deleteByUserAccountIdUserAccountIdArgument() {
    return this.#deleteByUserAccountIdUserAccountIdArgument;
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
