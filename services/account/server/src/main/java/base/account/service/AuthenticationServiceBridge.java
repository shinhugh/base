package base.account.service;

import base.account.model.Authority;

import java.util.Map;
import java.util.UUID;

public class AuthenticationServiceBridge implements AuthenticationServiceClient {
    private static final short ROLES_MAX_VALUE = 255;
    private static final long TIME_MAX_VALUE = 4294967295L;
    private final String host;
    private final int port;

    public AuthenticationServiceBridge(Map<String, String> config) {
        if (config == null || !validateConfig(config)) {
            throw new RuntimeException("AuthenticationServiceBridge constructor failed");
        }
        host = config.get("host");
        port = Integer.parseInt(config.get("port"));
    }

    @Override
    public void logout(Authority authority, String accountId) {
        if (!validateAuthority(authority)) {
            throw new RuntimeException("Invalid authority provided to AuthenticationServiceBridge.logout()");
        }
        // TODO: Implement
    }

    private static boolean validateConfig(Map<String, String> config) {
        if (config == null) {
            return true;
        }
        if (!config.containsKey("host")) {
            return false;
        }
        if (!config.containsKey("port")) {
            return false;
        }
        try {
            Integer.parseInt(config.get("port"));
        }
        catch (NumberFormatException ex) {
            return false;
        }
        return true;
    }

    private static boolean validateUuid(String id) {
        if (id == null) {
            return true;
        }
        try {
            UUID.fromString(id);
        }
        catch (java.lang.IllegalArgumentException ex) {
            return false;
        }
        return true;
    }

    private static boolean validateAuthority(Authority authority) {
        if (authority == null) {
            return true;
        }
        if (authority.getId() != null && !validateUuid(authority.getId())) {
            return false;
        }
        if (authority.getRoles() < 0 || authority.getRoles() > ROLES_MAX_VALUE) {
            return false;
        }
        return authority.getAuthTime() >= 0 && authority.getAuthTime() <= TIME_MAX_VALUE;
    }
}
