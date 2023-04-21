import { EventSinkClient } from '../../main/service/event-sink-client.js';

class EventSinkClientSpy extends EventSinkClient {
  #publishInvocationCount;
  #publishContentArgument;

  async publish(content) {
    this.#publishInvocationCount++;
    this.#publishContentArgument = content;
  }

  resetSpy() {
    this.#publishInvocationCount = 0;
    this.#publishContentArgument = undefined;
  }

  get publishInvocationCount() {
    return this.#publishInvocationCount;
  }

  get publishContentArgument() {
    return this.#publishContentArgument;
  }
}

export {
  EventSinkClientSpy
};
