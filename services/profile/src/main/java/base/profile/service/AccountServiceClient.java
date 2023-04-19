package base.profile.service;

import base.profile.service.model.AccessDeniedException;
import base.profile.service.model.Authority;
import base.profile.service.model.IllegalArgumentException;

public interface AccountServiceClient {
    boolean checkForAccountExistence(Authority authority, String id) throws IllegalArgumentException, AccessDeniedException;
}
