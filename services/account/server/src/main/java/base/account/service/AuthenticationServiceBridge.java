package base.account.service;

import base.account.service.model.AccessDeniedException;
import base.account.service.model.Authority;
import base.account.service.model.IllegalArgumentException;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AuthenticationServiceBridge implements AuthenticationServiceClient {
    private final HttpClient httpClient;
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
        // TODO: Bridge should not know what's acceptable or not for parameters - leave that up to actual service
        // TODO: Invoke endpoint via HTTP request using httpClient
        // TODO: Anticipate connection problems and invalid host/port values
        //       Categorize these under unexpected exceptions - use wrapException() to wrap exception with custom
        //       message
        Map<String, List<String>> requestHeaders = new HashMap<>();
        requestHeaders.put("content-type", List.of("application/json"));
        if (authority != null) {
            if (authority.getId() != null) {
                requestHeaders.put("authority-id", List.of(authority.getId()));
            }
            requestHeaders.put("authority-roles", List.of(String.valueOf(authority.getRoles())));
            requestHeaders.put("authority-auth-time", List.of(String.valueOf(authority.getAuthTime())));
        }
        InputStream requestBody = null; // TODO: Map accountId to body as JSON
        HttpClient.Request request = new HttpClient.Request(host, port, "/logout", HttpClient.Method.POST, requestHeaders, null, requestBody);
        HttpClient.Response response = httpClient.sendRequest(request);
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
        if (!config.containsKey("host")) {
            return false;
        }
        int port;
        try {
            port = Integer.parseInt(config.get("port"));
        }
        catch (Exception e) {
            return false;
        }
        return port >= 0;
    }
}
