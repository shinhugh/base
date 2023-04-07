package base.useraccount.service;

import base.useraccount.model.Authority;

public interface AuthenticationServiceClient {
    void logout(Authority authority, String userAccountId);
}
