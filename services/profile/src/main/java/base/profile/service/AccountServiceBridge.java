package base.profile.service;

import base.profile.service.model.Authority;

import java.util.Map;

public class AccountServiceBridge implements AccountServiceClient {
    private final HttpClient httpClient;

    public AccountServiceBridge(HttpClient httpClient, Map<String, String> config) {
        if (httpClient == null) {
            throw new RuntimeException("Invalid httpClient provided to AccountServiceBridge constructor");
        }
        if (config == null || !validateConfig(config)) {
            throw new RuntimeException("Invalid config provided to AccountServiceBridge constructor");
        }
        this.httpClient = httpClient;
    }

    @Override
    public boolean checkForAccountExistence(Authority authority, String id) {
        // TODO: Implement
        return true;
    }

    private static boolean validateConfig(Map<String, String> config) {
        // TODO: Implement
        return true;
    }
}
