package base.account.service;

import base.account.service.model.Authority;

import java.util.Map;

public class AuthenticationServiceBridge implements AuthenticationServiceClient {
    private static final int PORT_MAX_VALUE = 65535;
    private final String host;
    private final int port;

    public AuthenticationServiceBridge(Map<String, String> config) {
        if (config == null || !validateConfig(config)) {
            throw new RuntimeException("Invalid config provided to AuthenticationServiceBridge constructor");
        }
        host = config.get("host");
        port = Integer.parseInt(config.get("port"));
    }

    @Override
    public void logout(Authority authority, String accountId) {
        // TODO: Bridge should not know what's acceptable or not for parameters - leave that up to actual service
        // TODO: Invoke endpoint via HTTP request
        // TODO: Anticipate connection problems and invalid host/port values
        //       Categorize these under unexpected exceptions - throw generic RuntimeException w/ message instead of
        //       subroutine's exception types
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
        catch (NumberFormatException e) {
            return false;
        }
        return port >= 0 && port <= PORT_MAX_VALUE;
    }
}
