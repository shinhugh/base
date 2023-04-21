import { AccountEventSink } from '../../main/service/account-event-sink.js';

class AccountEventSinkSpy extends AccountEventSink {
  #publishAccountDeleteEventInvocationCount;
  #publishAccountDeleteEventIdArgument;

  async publishAccountDeleteEvent(id) {
    this.#publishAccountDeleteEventInvocationCount++;
    this.#publishAccountDeleteEventIdArgument = id;
  }

  resetSpy() {
    this.#publishAccountDeleteEventInvocationCount = 0;
    this.#publishAccountDeleteEventIdArgument = undefined;
  }

  get publishAccountDeleteEventInvocationCount() {
    return this.#publishAccountDeleteEventInvocationCount;
  }

  get publishAccountDeleteEventIdArgument() {
    return this.#publishAccountDeleteEventIdArgument;
  }
}

export {
  AccountEventSinkSpy
};
