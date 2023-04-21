import { EventSinkClient } from './event-sink-client.js';

class EventSinkBridge extends EventSinkClient {
  #amqpChannel;
  #exchangeName;
  #exchangeType;
  #routingKey;

  constructor(amqpChannel, config) {
    super();
    this.#configure(config);
    this.#amqpChannel = amqpChannel;
  }

  async publish(content) {
    try {
      await this.#amqpChannel.assertExchange(this.#exchangeName, this.#exchangeType);
    }
    catch {
      throw new Error('Failed to assert exchange');
    }
    try {
      await this.#amqpChannel.publish(this.#exchangeName, this.#routingKey, content);
    }
    catch {
      throw new Error('Failed to publish event');
    }
  }

  #configure(config) {
    if (config == null) {
      throw new Error('Invalid config provided to EventSinkBridge constructor');
    }
    if (typeof config !== 'object') {
      throw new Error('Invalid config provided to EventSinkBridge constructor');
    }
    if (typeof config.exchangeName !== 'string') {
      throw new Error('Invalid config provided to EventSinkBridge constructor');
    }
    this.#exchangeName = config.exchangeName;
    if (typeof config.exchangeType !== 'string') {
      throw new Error('Invalid config provided to EventSinkBridge constructor');
    }
    this.#exchangeType = config.exchangeType;
    if (typeof config.routingKey !== 'string') {
      throw new Error('Invalid config provided to EventSinkBridge constructor');
    }
    this.#routingKey = config.routingKey;
  }
}

export {
  EventSinkBridge
};
