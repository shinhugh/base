import { EventPublisherClient } from './event-publisher-client.js';

class EventPublisherBridge extends EventPublisherClient {
  #amqpChannel;
  #exchangeName;
  #exchangeType;
  #routingKey;

  constructor(amqpChannel, config) {
    super();
    this.#configure(config);
    this.#amqpChannel = amqpChannel;
  }

  async publishEvent(content) {
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
      throw new Error('Invalid config provided to EventPublisherBridge constructor');
    }
    if (typeof config !== 'object') {
      throw new Error('Invalid config provided to EventPublisherBridge constructor');
    }
    if (typeof config.exchangeName !== 'string') {
      throw new Error('Invalid config provided to EventPublisherBridge constructor');
    }
    this.#exchangeName = config.exchangeName;
    if (typeof config.exchangeType !== 'string') {
      throw new Error('Invalid config provided to EventPublisherBridge constructor');
    }
    this.#exchangeType = config.exchangeType;
    if (typeof config.routingKey !== 'string') {
      throw new Error('Invalid config provided to EventPublisherBridge constructor');
    }
    this.#routingKey = config.routingKey;
  }
}

export {
  EventPublisherBridge
};
