import { TimeService } from '../../main/service/time-service.js';

class TimeServiceSpy extends TimeService {
  #currentTimeSecondsReturnValue;
  #currentTimeSecondsInvokeCount = 0;

  currentTimeSeconds() {
    this.#currentTimeSecondsInvokeCount++;
    return this.#currentTimeSecondsReturnValue;
  }

  resetSpy() {
    this.#currentTimeSecondsInvokeCount = 0;
  }

  set currentTimeSecondsReturnValue(currentTimeSecondsReturnValue) {
    this.#currentTimeSecondsReturnValue = currentTimeSecondsReturnValue;
  }

  get currentTimeSecondsInvokeCount() {
    return this.#currentTimeSecondsInvokeCount;
  }
}

export {
  TimeServiceSpy
};
