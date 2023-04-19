package base.profile;

import base.profile.controller.ProfileController;
import base.profile.repository.ProfileJpaRepository;
import base.profile.service.AccountServiceBridge;
import base.profile.service.HttpBridge;
import base.profile.service.ProfileManager;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

public class ProfileServlet extends HttpServlet {
    // Use environment variables for production; hard-coded for testing only
    private static final String PROFILE_DB_HOST = "localhost";
    private static final String PROFILE_DB_PORT = "3306";
    private static final String PROFILE_DB_DATABASE = "base";
    private static final String PROFILE_DB_USERNAME = "root";
    private static final String PROFILE_DB_PASSWORD = "";
    private static final String PROFILE_DB_CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";
    private static final Map<String, String> PROFILE_JPA_REPOSITORY_CONFIG = Map.of("hibernate.connection.url", String.format(PROFILE_DB_CONNECTION_URL_FORMAT, PROFILE_DB_HOST, PROFILE_DB_PORT, PROFILE_DB_DATABASE), "hibernate.connection.username", PROFILE_DB_USERNAME, "hibernate.connection.password", PROFILE_DB_PASSWORD);
    private static final Map<String, String> ACCOUNT_SERVICE_BRIDGE_CONFIG = Map.of("port", "8081");
    private final ProfileJpaRepository profileJpaRepository = new ProfileJpaRepository(PROFILE_JPA_REPOSITORY_CONFIG);
    private final HttpBridge httpBridge = new HttpBridge();
    private final AccountServiceBridge accountServiceBridge = new AccountServiceBridge(httpBridge, ACCOUNT_SERVICE_BRIDGE_CONFIG);
    private final ProfileManager profileManager = new ProfileManager(profileJpaRepository, accountServiceBridge);
    private final ProfileController profileController = new ProfileController(profileManager);

    @Override
    public void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        if (!request.getServletPath().equals("/profile")) {
            response.setStatus(404);
            return;
        }
        switch (request.getMethod().toLowerCase()) {
            case "get": {
                ProfileController.Response res = profileController.readProfile(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "post": {
                ProfileController.Response res = profileController.createProfile(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "put": {
                ProfileController.Response res = profileController.updateProfile(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            case "delete": {
                ProfileController.Response res = profileController.deleteProfile(translateRequest(request));
                translateResponse(res, response);
                return;
            }
            default: {
                response.setStatus(405);
            }
        }
    }

    private static ProfileController.Request translateRequest(HttpServletRequest request) throws IOException {
        ByteArrayOutputStream bodyBufferStream = new ByteArrayOutputStream();
        request.getInputStream().transferTo(bodyBufferStream);
        InputStream body = new ByteArrayInputStream(bodyBufferStream.toByteArray());
        return new ProfileController.Request(getHeaders(request), getQueryParameters(request), body);
    }

    private static void translateResponse(ProfileController.Response src, HttpServletResponse dst) throws IOException {
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
}
