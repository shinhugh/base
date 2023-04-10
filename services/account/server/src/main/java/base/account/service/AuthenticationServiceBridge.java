package base.account.service;

import base.account.model.Authority;

import java.util.Map;

public class AuthenticationServiceBridge implements AuthenticationServiceClient {
    public AuthenticationServiceBridge(Map<String, String> config) {
        // TODO: Implement
        // TODO: Don't shallow copy endpointConfig
    }

    @Override
    public void logout(Authority authority, String accountId) {
        // TODO: Implement
    }
}
