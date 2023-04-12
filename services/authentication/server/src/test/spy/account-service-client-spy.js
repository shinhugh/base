import { AccountServiceClient } from '../../main/service/account-service-client.js';

class AccountServiceClientSpy extends AccountServiceClient {
  #readByNameReturnValue;
  #readByNameInvokeCount;
  #readByNameAuthorityArgument;
  #readByNameNameArgument;

  constructor() {
    super({
      host: '',
      port: 0
    });
  }

  async readByName(authority, name) {
    this.#readByNameInvokeCount++;
    this.#readByNameAuthorityArgument = authority;
    this.#readByNameNameArgument = name;
    return this.#readByNameReturnValue;
  }

  resetSpy() {
    this.#readByNameInvokeCount = 0;
    this.#readByNameAuthorityArgument = undefined;
    this.#readByNameNameArgument = undefined;
  }

  set readByNameReturnValue(readByNameReturnValue) {
    this.#readByNameReturnValue = readByNameReturnValue;
  }

  get readByNameInvokeCount() {
    return this.#readByNameInvokeCount;
  }

  get readByNameAuthorityArgument() {
    return this.#readByNameAuthorityArgument;
  }

  get readByNameNameArgument() {
    return this.#readByNameNameArgument;
  }
}

export {
  AccountServiceClientSpy
};
