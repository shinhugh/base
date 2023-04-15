package base.account;

import base.account.controller.AccountController;
import base.account.repository.AccountJpaRepository;
import base.account.service.AccountManager;
import base.account.service.AccountService;
import base.account.service.AuthenticationServiceBridge;
import base.account.service.HttpBridge;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

public class AccountServlet extends HttpServlet {
    // Use environment variables for production; hard-coded for testing only
    private static final String ACCOUNT_DB_HOST = "localhost";
    private static final String ACCOUNT_DB_PORT = "3306";
    private static final String ACCOUNT_DB_DATABASE = "base";
    private static final String ACCOUNT_DB_USERNAME = "root";
    private static final String ACCOUNT_DB_PASSWORD = "";
    private static final String ACCOUNT_DB_CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";
    private static final Map<String, String> ACCOUNT_JPA_REPOSITORY_CONFIG = Map.of("hibernate.connection.url", String.format(ACCOUNT_DB_CONNECTION_URL_FORMAT, ACCOUNT_DB_HOST, ACCOUNT_DB_PORT, ACCOUNT_DB_DATABASE), "hibernate.connection.username", ACCOUNT_DB_USERNAME, "hibernate.connection.password", ACCOUNT_DB_PASSWORD);
    private static final Map<String, String> AUTHENTICATION_SERVICE_BRIDGE_CONFIG = Map.of("host", "localhost", "port", "8000");
    private static final Map<String, String> ACCOUNT_MANAGER_CONFIG = Map.of("modificationEnabledSessionAgeMaxValue", "900", "passwordHashAlgorithm", "SHA-256");
    private final AccountJpaRepository accountJpaRepository = new AccountJpaRepository(ACCOUNT_JPA_REPOSITORY_CONFIG);
    private final HttpBridge httpBridge = new HttpBridge();
    private final AuthenticationServiceBridge authenticationServiceBridge = new AuthenticationServiceBridge(httpBridge, AUTHENTICATION_SERVICE_BRIDGE_CONFIG);
    private final AccountService accountService = new AccountManager(accountJpaRepository, authenticationServiceBridge, ACCOUNT_MANAGER_CONFIG);
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
        ByteArrayOutputStream bodyBufferStream = new ByteArrayOutputStream();
        request.getInputStream().transferTo(bodyBufferStream);
        InputStream bodyStream = new ByteArrayInputStream(bodyBufferStream.toByteArray());
        return new AccountController.Request(getHeaders(request), getQuery(request), bodyStream);
    }

    private static void translateResponse(AccountController.Response src, HttpServletResponse dst) throws IOException {
        dst.setStatus(src.getStatus());
        if (src.getHeaders() != null) {
            for (Map.Entry<String, List<String>> entry : src.getHeaders().entrySet()) {
                for (String headerValue : entry.getValue()) {
                    dst.addHeader(entry.getKey(), headerValue);
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

    private static Map<String, List<String>> getQuery(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        if (parameterMap == null) {
            return null;
        }
        Map<String, List<String>> query = new HashMap<>();
        for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
            query.put(entry.getKey(), Arrays.asList(entry.getValue()));
        }
        return query;
    }
}
