package base.profile;

import base.profile.controller.ProfileController;
import base.profile.repository.ProfileJpaRepository;
import base.profile.service.ProfileManager;
import base.profile.service.ProfileService;
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
    private static final Map<String, String> PROFILE_MANAGER_CONFIG = Map.of();
    private final ProfileJpaRepository profileJpaRepository = new ProfileJpaRepository(PROFILE_JPA_REPOSITORY_CONFIG);
    private final ProfileService profileService = new ProfileManager(profileJpaRepository, PROFILE_MANAGER_CONFIG);
    private final ProfileController profileController = new ProfileController(profileService);

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
        InputStream bodyStream = new ByteArrayInputStream(bodyBufferStream.toByteArray());
        return new ProfileController.Request(getHeaders(request), getQuery(request), bodyStream);
    }

    private static void translateResponse(ProfileController.Response src, HttpServletResponse dst) throws IOException {
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
