package base.account.service;

import base.account.service.model.AccessDeniedException;
import base.account.service.model.Authority;
import base.account.service.model.IllegalArgumentException;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static base.account.Common.wrapException;

public class AuthenticationServiceBridge implements AuthenticationServiceClient {
    private static final int PORT_MAX_VALUE = 65535;
    private final HttpClient httpClient;
    private final Gson gson = new GsonBuilder().create();
    private final String host;
    private final int port;

    public AuthenticationServiceBridge(HttpClient httpClient, Map<String, String> config) {
        if (httpClient == null) {
            throw new RuntimeException("Invalid httpClient provided to AuthenticationServiceBridge constructor");
        }
        if (config == null || !validateConfig(config)) {
            throw new RuntimeException("Invalid config provided to AuthenticationServiceBridge constructor");
        }
        this.httpClient = httpClient;
        host = config.get("host");
        port = Integer.parseInt(config.get("port"));
    }

    @Override
    public void logout(Authority authority, String accountId) throws IllegalArgumentException, AccessDeniedException {
        Map<String, List<String>> requestHeaders = new HashMap<>();
        requestHeaders.put("content-type", List.of("application/json"));
        if (authority != null) {
            if (authority.getId() != null) {
                requestHeaders.put("authority-id", List.of(authority.getId()));
            }
            requestHeaders.put("authority-roles", List.of(String.valueOf(authority.getRoles())));
            requestHeaders.put("authority-auth-time", List.of(String.valueOf(authority.getAuthTime())));
        }
        Map<String, String> requestBodyObject = null;
        if (accountId != null) {
            requestBodyObject = Map.of("accountId", accountId);
        }
        InputStream requestBody = new ByteArrayInputStream(gson.toJson(requestBodyObject).getBytes(StandardCharsets.UTF_8));
        HttpClient.Request request = new HttpClient.Request(host, port, "/logout", HttpClient.Method.POST, requestHeaders, null, requestBody);
        HttpClient.Response response;
        try {
            response = httpClient.sendRequest(request);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to send request to authentication service");
        }
        switch (response.getStatus()) {
            case 200: {
                return;
            }
            case 400: {
                throw new IllegalArgumentException();
            }
            case 401: {
                throw new AccessDeniedException();
            }
            default: {
                throw new RuntimeException("Unrecognized status code received from authentication service");
            }
        }
    }

    private static boolean validateConfig(Map<String, String> config) {
        if (config == null) {
            return true;
        }
        if (config.get("host") == null) {
            return false;
        }
        int port;
        try {
            port = Integer.parseInt(config.get("port"));
        }
        catch (Exception e) {
            return false;
        }
        return port >= 0 && port <= PORT_MAX_VALUE;
    }
}
