package base.useraccount.controller;

import base.useraccount.repository.UserAccountJpaRepository;
import base.useraccount.repository.UserAccountRepository;
import base.useraccount.service.AuthenticationServiceBridge;
import base.useraccount.service.AuthenticationServiceClient;
import base.useraccount.service.UserAccountManager;
import base.useraccount.service.UserAccountService;

import java.util.Map;

public class LambdaWrapper {
    private static final String DB_HOST = System.getenv("AUTH_DB_HOST");
    private static final String DB_PORT = System.getenv("AUTH_DB_PORT");
    private static final String DB_DATABASE = System.getenv("AUTH_DB_DATABASE");
    private static final String DB_USERNAME = System.getenv("AUTH_DB_USERNAME");
    private static final String DB_PASSWORD = System.getenv("AUTH_DB_PASSWORD");
    private static final String CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";
    private static final Map<String, String> DATABASE_INFO = Map.of("hibernate.connection.url", String.format(CONNECTION_URL_FORMAT, DB_HOST, DB_PORT, DB_DATABASE), "hibernate.connection.username", DB_USERNAME, "hibernate.connection.password", DB_PASSWORD);
    private static final UserAccountRepository userAccountRepository = new UserAccountJpaRepository(DATABASE_INFO);
    private static final AuthenticationServiceClient authenticationServiceClient = new AuthenticationServiceBridge();
    private static final UserAccountService userAccountService = new UserAccountManager(userAccountRepository, authenticationServiceClient);
    private static final UserAccountController userAccountController = new UserAccountController(userAccountService);

    public void handler() { // TODO
        // TODO
    }
}
