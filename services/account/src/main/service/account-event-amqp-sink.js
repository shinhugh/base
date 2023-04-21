import { AccountEventSink } from './account-event-sink.js';

class AccountEventAmqpSink extends AccountEventSink {
  #channel;
  #accountDeleteEventExchangeName;
  #accountDeleteEventExchangeType;
  #accountDeleteEventRoutingKey;

  constructor(channel, config) {
    super();
    this.#configure(config);
    this.#channel = channel;
  }

  async publishAccountDeleteEvent(id) {
    if (typeof id !== 'string') {
      throw new Error('Invalid id provided to AccountEventAmqpSink.publishAccountDeleteEvent()');
    }
    try {
      await this.#channel.assertExchange(this.#accountDeleteEventExchangeName, this.#accountDeleteEventExchangeType);
    }
    catch {
      throw new Error('Failed to assert exchange');
    }
    try {
      await this.#channel.publish(this.#accountDeleteEventExchangeName, this.#accountDeleteEventRoutingKey, Buffer.from(id));
    }
    catch {
      throw new Error('Failed to publish event');
    }
  }

  #configure(config) {
    if (config == null) {
      throw new Error('Invalid config provided to AccountEventAmqpSink constructor');
    }
    if (typeof config !== 'object') {
      throw new Error('Invalid config provided to AccountEventAmqpSink constructor');
    }
    if (typeof config.accountDeleteEventExchangeName !== 'string') {
      throw new Error('Invalid config provided to AccountEventAmqpSink constructor');
    }
    this.#accountDeleteEventExchangeName = config.accountDeleteEventExchangeName;
    if (typeof config.accountDeleteEventExchangeType !== 'string') {
      throw new Error('Invalid config provided to AccountEventAmqpSink constructor');
    }
    this.#accountDeleteEventExchangeType = config.accountDeleteEventExchangeType;
    if (typeof config.accountDeleteEventRoutingKey !== 'string') {
      throw new Error('Invalid config provided to AccountEventAmqpSink constructor');
    }
    this.#accountDeleteEventRoutingKey = config.accountDeleteEventRoutingKey;
  }
}

export {
  AccountEventAmqpSink
};
