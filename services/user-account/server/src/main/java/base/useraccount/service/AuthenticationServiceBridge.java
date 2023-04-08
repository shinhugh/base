package base.useraccount.service;

import base.useraccount.model.Authority;

import java.util.Map;

public class AuthenticationServiceBridge implements AuthenticationServiceClient {
    public AuthenticationServiceBridge(Map<String, String> endpointConfig) {
        // TODO: Implement
        // TODO: Don't shallow copy endpointConfig
    }

    @Override
    public void logout(Authority authority, String userAccountId) {
        // TODO: Implement
    }
}
