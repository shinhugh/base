package base.profile.service;

import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DefaultConsumer;
import com.rabbitmq.client.Envelope;

import java.io.ByteArrayInputStream;
import java.util.Map;

public class EventSubscriberBridge implements EventSubscriberClient {
    private final Channel amqpChannel;
    private String queueName;
    private String exchangeName;
    private String routingKey;

    public EventSubscriberBridge(Channel amqpChannel, Map<String, String> config) {
        configure(config);
        this.amqpChannel = amqpChannel;
    }

    @Override
    public void subscribe(EventHandler eventHandler) {
        Consumer consumer = new Consumer(amqpChannel, eventHandler);
        try {
            amqpChannel.queueDeclare(queueName, false, false, true, null);
        }
        catch (Exception e) {
            throw new RuntimeException("Failed to create queue");
        }
        try {
            amqpChannel.queueBind(queueName, exchangeName, routingKey);
        }
        catch (Exception e) {
            throw new RuntimeException("Failed to bind queue");
        }
        try {
            amqpChannel.basicConsume(queueName, consumer);
        }
        catch (Exception e) {
            throw new RuntimeException("Failed to register consumer");
        }
    }

    private void configure(Map<String, String> config) {
        if (config == null) {
            throw new RuntimeException("Invalid config provided to EventSubscriberBridge constructor");
        }
        queueName = config.get("queueName");
        if (queueName == null) {
            throw new RuntimeException("Invalid config provided to EventSubscriberBridge constructor");
        }
        exchangeName = config.get("exchangeName");
        if (exchangeName == null) {
            throw new RuntimeException("Invalid config provided to EventSubscriberBridge constructor");
        }
        routingKey = config.get("routingKey");
        if (routingKey == null) {
            throw new RuntimeException("Invalid config provided to EventSubscriberBridge constructor");
        }
    }

    private static class Consumer extends DefaultConsumer {
        private final EventHandler eventHandler;

        public Consumer(Channel channel, EventHandler eventHandler) {
            super(channel);
            this.eventHandler = eventHandler;
        }

        @Override
        public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) {
            ByteArrayInputStream eventBody = new ByteArrayInputStream(body);
            EventSubscriberClient.EventHandler.Event event = new EventSubscriberClient.EventHandler.Event(eventBody);
            eventHandler.handle(event);
        }
    }
}
