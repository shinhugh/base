package base.persistentsession.client.service;

import base.persistentsession.client.model.Authority;
import base.persistentsession.client.model.PersistentSession;

public interface PersistentSessionService {
    String create(Authority authority, PersistentSession persistentSession);
    PersistentSession readById(Authority authority, String id);
    PersistentSession readByRefreshToken(Authority authority, String refreshToken);
    void deleteByUserAccountId(Authority authority, String userAccountId);
    void deleteByRefreshToken(Authority authority, String refreshToken);
}
