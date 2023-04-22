import { AccountRepository } from '../../main/repository/account-repository.js';

class AccountRepositorySpy extends AccountRepository {
  #readByNameReturnValue;
  #readByNameInvokeCount = 0;
  #readByNameNameArgument;
  #readByIdAndNameReturnValue;
  #readByIdAndNameInvokeCount = 0;
  #readByIdAndNameIdArgument;
  #readByIdAndNameNameArgument;
  #createReturnValue;
  #createInvokeCount = 0;
  #createAccountArgument;
  #updateByIdAndNameReturnValue;
  #updateByIdAndNameInvokeCount = 0;
  #updateByIdAndNameIdArgument;
  #updateByIdAndNameNameArgument;
  #updateByIdAndNameAccountArgument;
  #deleteByIdAndNameReturnValue;
  #deleteByIdAndNameInvokeCount = 0;
  #deleteByIdAndNameIdArgument;
  #deleteByIdAndNameNameArgument;

  async readByName(name) {
    this.#readByNameInvokeCount++;
    this.#readByNameNameArgument = name;
    return this.#readByNameReturnValue;
  }

  async readByIdAndName(id, name) {
    this.#readByIdAndNameInvokeCount++;
    this.#readByIdAndNameIdArgument = id;
    this.#readByIdAndNameNameArgument = name;
    return this.#readByIdAndNameReturnValue;
  }

  async create(account) {
    this.#createInvokeCount++;
    this.#createAccountArgument = account;
    return this.#createReturnValue;
  }

  async updateByIdAndName(id, name, account) {
    this.#updateByIdAndNameInvokeCount++;
    this.#updateByIdAndNameIdArgument = id;
    this.#updateByIdAndNameNameArgument = name;
    this.#updateByIdAndNameAccountArgument = account;
    return this.#updateByIdAndNameReturnValue;
  }

  async deleteByIdAndName(id, name) {
    this.#deleteByIdAndNameInvokeCount++;
    this.#deleteByIdAndNameIdArgument = id;
    this.#deleteByIdAndNameNameArgument = name;
    return this.#deleteByIdAndNameReturnValue;
  }

  resetSpy() {
    this.#readByNameInvokeCount = 0;
    this.#readByNameNameArgument = undefined;
    this.#readByIdAndNameInvokeCount = 0;
    this.#readByIdAndNameIdArgument = undefined;
    this.#readByIdAndNameNameArgument = undefined;
    this.#createInvokeCount = 0;
    this.#createAccountArgument = undefined;
    this.#updateByIdAndNameInvokeCount = 0;
    this.#updateByIdAndNameIdArgument = undefined;
    this.#updateByIdAndNameNameArgument = undefined;
    this.#updateByIdAndNameAccountArgument = undefined;
    this.#deleteByIdAndNameInvokeCount = 0;
    this.#deleteByIdAndNameIdArgument = undefined;
    this.#deleteByIdAndNameNameArgument = undefined;
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

  set readByIdAndNameReturnValue(readByIdAndNameReturnValue) {
    this.#readByIdAndNameReturnValue = readByIdAndNameReturnValue;
  }

  get readByIdAndNameInvokeCount() {
    return this.#readByIdAndNameInvokeCount;
  }

  get readByIdAndNameIdArgument() {
    return this.#readByIdAndNameIdArgument;
  }

  get readByIdAndNameNameArgument() {
    return this.#readByIdAndNameNameArgument;
  }

  set createReturnValue(createReturnValue) {
    this.#createReturnValue = createReturnValue;
  }

  get createInvokeCount() {
    return this.#createInvokeCount;
  }

  get createAccountArgument() {
    return this.#createAccountArgument;
  }

  set updateByIdAndNameReturnValue(updateByIdAndNameReturnValue) {
    this.#updateByIdAndNameReturnValue = updateByIdAndNameReturnValue;
  }

  get updateByIdAndNameInvokeCount() {
    return this.#updateByIdAndNameInvokeCount;
  }

  get updateByIdAndNameIdArgument() {
    return this.#updateByIdAndNameIdArgument;
  }

  get updateByIdAndNameNameArgument() {
    return this.#updateByIdAndNameNameArgument;
  }

  get updateByIdAndNameAccountArgument() {
    return this.#updateByIdAndNameAccountArgument;
  }

  set deleteByIdAndNameReturnValue(deleteByIdAndNameReturnValue) {
    this.#deleteByIdAndNameReturnValue = deleteByIdAndNameReturnValue;
  }

  get deleteByIdAndNameInvokeCount() {
    return this.#deleteByIdAndNameInvokeCount;
  }

  get deleteByIdAndNameIdArgument() {
    return this.#deleteByIdAndNameIdArgument;
  }

  get deleteByIdAndNameNameArgument() {
    return this.#deleteByIdAndNameNameArgument;
  }
}

export {
  AccountRepositorySpy
};
