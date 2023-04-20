import { EventPublisherClient } from '../../main/service/event-publisher-client.js';

class EventPublisherClientSpy extends EventPublisherClient {
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
  EventPublisherClientSpy
};
