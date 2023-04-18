import { RandomService } from '../../main/service/random-service.js';

class RandomServiceSpy extends RandomService {
  #generateRandomStringReturnValue;
  #generateRandomStringInvokeCount;
  #generateRandomStringPoolArgument;
  #generateRandomStringLengthArgument;

  generateRandomString(pool, length) {
    this.#generateRandomStringInvokeCount++;
    this.#generateRandomStringPoolArgument = pool;
    this.#generateRandomStringLengthArgument = length;
    return this.#generateRandomStringReturnValue;
  }

  resetSpy() {
    this.#generateRandomStringInvokeCount = 0;
    this.#generateRandomStringPoolArgument = undefined;
    this.#generateRandomStringLengthArgument = undefined;
  }

  set generateRandomStringReturnValue(generateRandomStringReturnValue) {
    this.#generateRandomStringReturnValue = generateRandomStringReturnValue;
  }

  get generateRandomStringInvokeCount() {
    return this.#generateRandomStringInvokeCount;
  }

  get generateRandomStringPoolArgument() {
    return this.#generateRandomStringPoolArgument;
  }

  get generateRandomStringLengthArgument() {
    return this.#generateRandomStringLengthArgument;
  }
}

export {
  RandomServiceSpy
};
