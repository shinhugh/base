import { EventPublisherClient } from '../../main/service/event-publisher-client.js';

class EventPublisherClientSpy extends EventPublisherClient {
  #publishEventInvocationCount;
  #publishEventContentArgument;

  async publishEvent(content) {
    this.#publishEventInvocationCount++;
    this.#publishEventContentArgument = content;
  }

  resetSpy() {
    this.#publishEventInvocationCount = 0;
    this.#publishEventContentArgument = undefined;
  }

  get publishEventInvocationCount() {
    return this.#publishEventInvocationCount;
  }

  get publishEventContentArgument() {
    return this.#publishEventContentArgument;
  }
}

export {
  EventPublisherClientSpy
};
