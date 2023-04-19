package base.profile.service;

import base.profile.service.model.Authority;

public interface AccountServiceClient {
    boolean checkForAccountExistence(Authority authority, String id);
}
