package base.profile;

import base.profile.controller.ProfileAmqpController;
import base.profile.controller.ProfileHttpController;
import base.profile.repository.ProfileJpaRepository;
import base.profile.service.AccountServiceBridge;
import base.profile.service.HttpBridge;
import base.profile.service.ProfileManager;
import com.rabbitmq.client.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.TimeoutException;

public class ProfileServlet extends HttpServlet {
    // Use environment variables for production; hard-coded for testing only
    private static final String PROFILE_DB_HOST = "localhost";
    private static final String PROFILE_DB_PORT = "3306";
    private static final String PROFILE_DB_DATABASE = "base";
    private static final String PROFILE_DB_USERNAME = "root";
    private static final String PROFILE_DB_PASSWORD = "";
    private static final String PROFILE_DB_CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";
    private static final String AMQP_HOST = "localhost";
    private static final int AMQP_PORT = 5672;
    private static final String AMQP_PROFILE_DELETE_QUEUE_NAME = "profile.delete";
    private static final String AMQP_ACCOUNT_EXCHANGE_NAME = "account";
    private static final String AMQP_ACCOUNT_DELETE_ROUTING_KEY = "account.delete";
    private static final Map<String, String> PROFILE_JPA_REPOSITORY_CONFIG = Map.of("hibernate.connection.url", String.format(PROFILE_DB_CONNECTION_URL_FORMAT, PROFILE_DB_HOST, PROFILE_DB_PORT, PROFILE_DB_DATABASE), "hibernate.connection.username", PROFILE_DB_USERNAME, "hibernate.connection.password", PROFILE_DB_PASSWORD);
    private static final Map<String, String> ACCOUNT_SERVICE_BRIDGE_CONFIG = Map.of("port", "8081");
    private final ProfileJpaRepository profileJpaRepository = new ProfileJpaRepository(PROFILE_JPA_REPOSITORY_CONFIG);
    private final HttpBridge httpBridge = new HttpBridge();
    private final AccountServiceBridge accountServiceBridge = new AccountServiceBridge(httpBridge, ACCOUNT_SERVICE_BRIDGE_CONFIG);
    private final ProfileManager profileManager = new ProfileManager(profileJpaRepository, accountServiceBridge);
    private final ProfileHttpController profileHttpController = new ProfileHttpController(profileManager);
    private final ProfileAmqpController profileAmqpController = new ProfileAmqpController(profileManager);
    private Connection amqpConnection;
    private Channel amqpChannel;

    @Override
    public void init() {
        try {
            initializeAmqp();
        }
        catch (Exception e) {
            System.out.println("Unexpected exception while initializing AMQP:\n" + e);
        }
    }

    @Override
    public void destroy() {
        try {
            deinitializeAmqp();
        }
        catch (Exception e) {
            System.out.println("Unexpected exception while deinitializing AMQP:\n" + e);
        }
    }

    @Override
    public void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        if (!request.getServletPath().equals("/profile")) {
            response.setStatus(404);
            return;
        }
        switch (request.getMethod().toLowerCase()) {
            case "get": {
                ProfileHttpController.Response res = profileHttpController.readProfile(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "post": {
                ProfileHttpController.Response res = profileHttpController.createProfile(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "put": {
                ProfileHttpController.Response res = profileHttpController.updateProfile(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "delete": {
                ProfileHttpController.Response res = profileHttpController.deleteProfile(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            default: {
                response.setStatus(405);
            }
        }
    }

    private static ProfileHttpController.Request translateRequest(HttpServletRequest request) throws IOException {
        ByteArrayOutputStream bodyBufferStream = new ByteArrayOutputStream();
        request.getInputStream().transferTo(bodyBufferStream);
        InputStream body = new ByteArrayInputStream(bodyBufferStream.toByteArray());
        return new ProfileHttpController.Request(getHeaders(request), getQueryParameters(request), body);
    }

    private static void translateResponse(ProfileHttpController.Response src, HttpServletResponse dst) throws IOException {
        dst.setStatus(src.getStatus());
        if (src.getHeaders() != null) {
            for (Map.Entry<String, List<String>> header : src.getHeaders().entrySet()) {
                for (String headerValue : header.getValue()) {
                    dst.addHeader(header.getKey(), headerValue);
                }
            }
        }
        if (src.getBody() != null) {
            src.getBody().transferTo(dst.getOutputStream());
        }
    }

    private static Map<String, List<String>> getHeaders(HttpServletRequest request) {
        Enumeration<String> headerNames = request.getHeaderNames();
        if (headerNames == null) {
            return null;
        }
        Map<String, List<String>> headers = new HashMap<>();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headers.put(headerName, Collections.list(request.getHeaders(headerName)));
        }
        return headers;
    }

    private static Map<String, List<String>> getQueryParameters(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        if (parameterMap == null) {
            return null;
        }
        Map<String, List<String>> queryParameters = new HashMap<>();
        for (Map.Entry<String, String[]> parameter : parameterMap.entrySet()) {
            queryParameters.put(parameter.getKey(), Arrays.asList(parameter.getValue()));
        }
        return queryParameters;
    }

    private void initializeAmqp() throws IOException, TimeoutException {
        if (amqpConnection == null) {
            ConnectionFactory connectionFactory = new ConnectionFactory();
            connectionFactory.setHost(AMQP_HOST);
            connectionFactory.setPort(AMQP_PORT);
            amqpConnection = connectionFactory.newConnection();
        }
        if (amqpChannel == null) {
            amqpChannel = amqpConnection.createChannel();
        }
        amqpChannel.queueDeclare(AMQP_PROFILE_DELETE_QUEUE_NAME, true, false, false, null);
        amqpChannel.queueBind(AMQP_PROFILE_DELETE_QUEUE_NAME, AMQP_ACCOUNT_EXCHANGE_NAME, AMQP_ACCOUNT_DELETE_ROUTING_KEY);
        ProfileDeleteConsumer profileDeleteConsumer = new ProfileDeleteConsumer(amqpChannel, profileAmqpController);
        amqpChannel.basicConsume(AMQP_PROFILE_DELETE_QUEUE_NAME, profileDeleteConsumer);
    }

    private void deinitializeAmqp() throws IOException, TimeoutException {
        if (amqpChannel != null) {
            amqpChannel.close();
            amqpChannel = null;
        }
        if (amqpConnection != null) {
            amqpConnection.close();
            amqpConnection = null;
        }
    }

    private static class ProfileDeleteConsumer extends DefaultConsumer {
        private final ProfileAmqpController profileAmqpController;

        public ProfileDeleteConsumer(Channel channel, ProfileAmqpController profileAmqpController) {
            super(channel);
            this.profileAmqpController = profileAmqpController;
        }

        @Override
        public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) {
            ByteArrayInputStream messageBody = new ByteArrayInputStream(body);
            ProfileAmqpController.Message message = new ProfileAmqpController.Message(messageBody);
            profileAmqpController.deleteProfile(message);
            try {
                getChannel().basicAck(envelope.getDeliveryTag(), false);
            }
            catch (Exception ignored) { }
        }
    }
}
