package base.account.server.service;

import base.account.server.model.Authority;
import base.account.server.model.PersistentSession;

public interface PersistentSessionService {
    PersistentSession create(Authority authority, PersistentSession persistentSession);
    PersistentSession readById(Authority authority, String id);
    PersistentSession readByRefreshToken(Authority authority, String refreshToken);
    void deleteByUserAccountId(Authority authority, String userAccountId);
    void deleteByRefreshToken(Authority authority, String refreshToken);
}
