package base.account;

import base.account.controller.AccountController;
import base.account.repository.AccountJpaRepository;
import base.account.repository.AccountRepository;
import base.account.service.AccountManager;
import base.account.service.AccountService;
import base.account.service.AuthenticationServiceBridge;
import base.account.service.AuthenticationServiceClient;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

public class AccountServlet extends HttpServlet {
    private static final String DB_HOST = "localhost";
    private static final String DB_PORT = "3306";
    private static final String DB_DATABASE = "base";
    private static final String DB_USERNAME = "root";
    private static final String DB_PASSWORD = "";
    private static final String CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";
    private static final Map<String, String> ACCOUNT_JPA_REPOSITORY_CONFIG = Map.of("hibernate.connection.url", String.format(CONNECTION_URL_FORMAT, DB_HOST, DB_PORT, DB_DATABASE), "hibernate.connection.username", DB_USERNAME, "hibernate.connection.password", DB_PASSWORD);
    private static final Map<String, String> AUTHENTICATION_SERVICE_BRIDGE_CONFIG = Map.of("host", "", "port", ""); // TODO: Add endpoint configuration
    private static final Map<String, String> ACCOUNT_MANAGER_CONFIG = Map.of("sessionAgeForModificationMaxValue", "900", "passwordHashAlgorithm", "SHA-256");
    private final AccountRepository accountRepository = new AccountJpaRepository(ACCOUNT_JPA_REPOSITORY_CONFIG);
    private final AuthenticationServiceClient authenticationServiceClient = new AuthenticationServiceBridge(AUTHENTICATION_SERVICE_BRIDGE_CONFIG);
    private final AccountService accountService = new AccountManager(accountRepository, authenticationServiceClient, ACCOUNT_MANAGER_CONFIG);
    private final AccountController accountController = new AccountController(accountService);

    @Override
    public void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        System.out.println("@@ service() invoked"); // DEBUG
        // TODO: Use request path and method to determine which controller method to invoke
        System.out.println("@@ Path info: " + request.getPathInfo()); // DEBUG
        System.out.println("@@ Path translated: " + request.getPathTranslated()); // DEBUG
        System.out.println("@@ Servlet path: " + request.getServletPath()); // DEBUG
        System.out.println("@@ Context path: " + request.getContextPath()); // DEBUG
        // TODO: Return 404 or 405 if no valid mapping exists
        // TODO: Generate AccountController.Request from HttpServletRequest
        // TODO: Invoke appropriate AccountController method
        // TODO: Configure HttpServletResponse using AccountController.Response
        super.service(request, response); // TODO: Remove
    }
}
