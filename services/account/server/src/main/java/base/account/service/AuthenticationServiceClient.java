package base.account.service;

import base.account.service.model.Authority;

public interface AuthenticationServiceClient {
    void logout(Authority authority, String accountId);
}
