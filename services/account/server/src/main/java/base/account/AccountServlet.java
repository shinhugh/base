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
import java.util.Enumeration;
import java.util.HashMap;
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
        if (!request.getServletPath().equals("/account")) {
            response.setStatus(404);
            return;
        }
        switch (request.getMethod().toLowerCase()) {
            case "get": {
                AccountController.Response res = accountController.read(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "post": {
                AccountController.Response res = accountController.create(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "put": {
                AccountController.Response res = accountController.update(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "delete": {
                AccountController.Response res = accountController.delete(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            default: {
                response.setStatus(405);
            }
        }
    }

    private static AccountController.Request translateRequest(HttpServletRequest request) throws IOException {
        return new AccountController.Request(getHeaders(request), getQuery(request), request.getInputStream());
    }

    private static void translateResponse(AccountController.Response src, HttpServletResponse dst) throws IOException {
        dst.setStatus(src.getStatus());
        if (src.getHeaders() != null) {
            for (Map.Entry<String, String> header : src.getHeaders().entrySet()) {
                dst.setHeader(header.getKey(), header.getValue());
            }
        }
        if (src.getBody() != null) {
            src.getBody().transferTo(dst.getOutputStream());
        }
    }

    private static Map<String, String> getHeaders(HttpServletRequest request) {
        Enumeration<String> headerNames = request.getHeaderNames();
        if (headerNames != null) {
            Map<String, String> headers = new HashMap<>();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                headers.put(headerName, request.getHeader(headerName));
            }
            return headers;
        }
        return null;
    }

    private static Map<String, String> getQuery(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        if (parameterMap != null) {
            Map<String, String> query = new HashMap<>();
            for (Map.Entry<String, String[]> parameter : parameterMap.entrySet()) {
                query.put(parameter.getKey(), parameter.getValue()[0]);
            }
            return query;
        }
        return null;
    }
}
