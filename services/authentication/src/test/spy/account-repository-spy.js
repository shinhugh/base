import { AccountRepository } from '../../main/repository/account-repository.js';

class AccountRepositorySpy extends AccountRepository {
  #readByNameReturnValue;
  #readByNameInvokeCount;
  #readByNameNameArgument;

  async readByName(name) {
    this.#readByNameInvokeCount++;
    this.#readByNameNameArgument = name;
    return this.#readByNameReturnValue;
  }

  resetSpy() {
    this.#readByNameInvokeCount = 0;
    this.#readByNameNameArgument = undefined;
  }

  set readByNameReturnValue(readByNameReturnValue) {
    this.#readByNameReturnValue = readByNameReturnValue;
  }

  get readByNameInvokeCount() {
    return this.#readByNameInvokeCount;
  }

  get readByNameNameArgument() {
    return this.#readByNameNameArgument;
  }
}

export {
  AccountRepositorySpy
};
