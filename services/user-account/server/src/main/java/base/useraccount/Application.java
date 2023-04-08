package base.useraccount;

import base.useraccount.controller.UserAccountController;
import base.useraccount.repository.UserAccountJpaRepository;
import base.useraccount.repository.UserAccountRepository;
import base.useraccount.service.AuthenticationServiceBridge;
import base.useraccount.service.AuthenticationServiceClient;
import base.useraccount.service.UserAccountManager;
import base.useraccount.service.UserAccountService;

import java.util.Map;

public class Application {
    // Use environment variables for production; hard-coded for testing only
    private static final String DB_HOST = "localhost";
    private static final int DB_PORT = 3306;
    private static final String DB_DATABASE = "base";
    private static final String DB_USERNAME = "root";
    private static final String DB_PASSWORD = "";
    private static final String CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";
    private static final Map<String, String> PERSISTENCE_CONFIG = Map.of("hibernate.connection.url", String.format(CONNECTION_URL_FORMAT, DB_HOST, DB_PORT, DB_DATABASE), "hibernate.connection.username", DB_USERNAME, "hibernate.connection.password", DB_PASSWORD);
    private static final Map<String, String> AUTHENTICATION_SERVICE_CONFIG = Map.of(); // TODO: Add config properties
    private static final Map<String, String> PASSWORD_HASH_CONFIG = Map.of("algorithm", "SHA-256");
    private static final UserAccountRepository userAccountRepository = new UserAccountJpaRepository(PERSISTENCE_CONFIG);
    private static final AuthenticationServiceClient authenticationServiceClient = new AuthenticationServiceBridge(AUTHENTICATION_SERVICE_CONFIG);
    private static final UserAccountService userAccountService = new UserAccountManager(userAccountRepository, authenticationServiceClient, PASSWORD_HASH_CONFIG);
    private static final UserAccountController userAccountController = new UserAccountController(userAccountService);

    public static void main(String[] args) {
        // TODO: Implement server
    }
}
