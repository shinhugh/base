import { UserAccountServiceClient } from '../../main/service/user-account-service-client.js';

class UserAccountServiceClientMock extends UserAccountServiceClient {
  #readReturnValue;
  #readInvokeCount;
  #readAuthorityArgument;
  #readNameArgument;

  constructor() {
    super({
      host: '',
      port: 0
    });
  }

  async read(authority, name) {
    this.#readInvokeCount++;
    this.#readAuthorityArgument = authority;
    this.#readNameArgument = name;
    return this.#readReturnValue;
  }

  resetSpy() {
    this.#readInvokeCount = 0;
    this.#readAuthorityArgument = undefined;
    this.#readNameArgument = undefined;
  }

  set readReturnValue(readReturnValue) {
    this.#readReturnValue = readReturnValue;
  }

  get readInvokeCount() {
    return this.#readInvokeCount;
  }

  get readAuthorityArgument() {
    return this.#readAuthorityArgument;
  }

  get readNameArgument() {
    return this.#readNameArgument;
  }
}

export {
  UserAccountServiceClientMock
};
