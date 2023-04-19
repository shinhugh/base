package base.profile.service;

import base.profile.service.model.AccessDeniedException;
import base.profile.service.model.Authority;
import base.profile.service.model.IllegalArgumentException;

import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AccountServiceBridge implements AccountServiceClient {
    private final String host;
    private final int port;
    private final HttpClient httpClient;

    public AccountServiceBridge(HttpClient httpClient, Map<String, String> config) {
        if (httpClient == null) {
            throw new RuntimeException("Invalid httpClient provided to AccountServiceBridge constructor");
        }
        if (config == null || !validateConfig(config)) {
            throw new RuntimeException("Invalid config provided to AccountServiceBridge constructor");
        }
        this.httpClient = httpClient;
        host = (config.get("host") == null || config.get("host").length() == 0) ? "localhost" : config.get("host");
        port = (config.get("port") == null || config.get("port").length() == 0) ? 80 : Integer.parseInt(config.get("port"));
    }

    @Override
    public boolean checkForAccountExistence(Authority authority, String id) throws IllegalArgumentException, AccessDeniedException {
        Map<String, List<String>> requestHeaders = null;
        if (authority != null) {
            requestHeaders = new HashMap<>();
            if (authority.getId() != null) {
                requestHeaders.put("authority-id", List.of(authority.getId()));
            }
            requestHeaders.put("authority-roles", List.of(String.valueOf(authority.getRoles())));
            requestHeaders.put("authority-auth-time", List.of(String.valueOf(authority.getAuthTime())));
        }
        Map<String, List<String>> requestQueryParameters = Map.of("id", List.of(id));
        HttpClient.Request request = new HttpClient.Request(host, port, "/account", HttpClient.Method.GET, requestHeaders, requestQueryParameters, null);
        HttpClient.Response response = httpClient.sendRequest(request);
        switch (response.getStatus()) {
            case 200: {
                return true;
            }
            case 400: {
                throw new IllegalArgumentException();
            }
            case 401: {
                throw new AccessDeniedException();
            }
            case 404: {
                return false;
            }
            default: {
                throw new RuntimeException("Unexpected status code received from account service");
            }
        }
    }

    private static boolean validateConfig(Map<String, String> config) {
        if (config == null) {
            return true;
        }
        String host = config.get("host");
        if (host == null || host.length() == 0) {
            host = "localhost";
        }
        int port;
        if (config.get("port") == null || config.get("port").length() == 0) {
            port = 80;
        }
        else {
            try {
                port = Integer.parseInt(config.get("port"));
            }
            catch (Exception e) {
                return false;
            }
        }
        try {
            new URL("http://" + host + ":" + port);
        }
        catch (Exception e) {
            return false;
        }
        return true;
    }
}
