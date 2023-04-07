package base.useraccount.server.service;

import base.useraccount.server.model.Authority;

public interface AuthenticationServiceClient {
    void logout(Authority authority, String userAccountId);
}
