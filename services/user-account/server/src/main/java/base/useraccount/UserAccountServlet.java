package base.useraccount;

import base.useraccount.controller.UserAccountController;
import base.useraccount.repository.UserAccountJpaRepository;
import base.useraccount.repository.UserAccountRepository;
import base.useraccount.service.AuthenticationServiceBridge;
import base.useraccount.service.AuthenticationServiceClient;
import base.useraccount.service.UserAccountManager;
import base.useraccount.service.UserAccountService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

public class UserAccountServlet extends HttpServlet {
    private static final String DB_HOST = "localhost";
    private static final String DB_PORT = "3306";
    private static final String DB_DATABASE = "base";
    private static final String DB_USERNAME = "root";
    private static final String DB_PASSWORD = "";
    private static final String CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";
    private static final Map<String, String> DATABASE_CONFIG = Map.of("hibernate.connection.url", String.format(CONNECTION_URL_FORMAT, DB_HOST, DB_PORT, DB_DATABASE), "hibernate.connection.username", DB_USERNAME, "hibernate.connection.password", DB_PASSWORD);
    private static final Map<String, String> AUTHENTICATION_SERVICE_ENDPOINT_CONFIG = Map.of("host", "", "port", "");
    private static final Map<String, String> PASSWORD_HASH_CONFIG = Map.of("algorithm", "SHA-256");
    private final UserAccountRepository userAccountRepository = new UserAccountJpaRepository(DATABASE_CONFIG);
    private final AuthenticationServiceClient authenticationServiceClient = new AuthenticationServiceBridge(AUTHENTICATION_SERVICE_ENDPOINT_CONFIG);
    private final UserAccountService userAccountService = new UserAccountManager(userAccountRepository, authenticationServiceClient, PASSWORD_HASH_CONFIG);
    private final UserAccountController userAccountController = new UserAccountController(userAccountService);

    @Override
    public void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        System.out.println("@@ service() invoked"); // DEBUG
        super.service(request, response);
        // TODO: Use request path and method to determine which controller method to invoke
        // TODO: Return 404 or 405 if no valid mapping exists
        // TODO: Generate UserAccountController.Request from HttpServletRequest
        // TODO: Invoke appropriate UserAccountController method
        // TODO: Configure HttpServletResponse using UserAccountController.Response
    }
}
