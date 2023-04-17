package base.account.service;

import base.account.service.model.AccessDeniedException;
import base.account.service.model.Authority;
import base.account.service.model.IllegalArgumentException;

public interface AuthenticationServiceClient {
    void logout(Authority authority, String accountId) throws IllegalArgumentException, AccessDeniedException;
}
