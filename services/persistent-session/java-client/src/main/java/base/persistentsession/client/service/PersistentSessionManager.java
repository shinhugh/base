package base.persistentsession.client.service;

import base.persistentsession.client.model.Authority;
import base.persistentsession.client.model.PersistentSession;

public class PersistentSessionManager implements PersistentSessionService {
    @Override
    public String create(Authority authority, PersistentSession persistentSession) {
        // TODO: Implement
        throw new RuntimeException("Not implemented");
    }

    @Override
    public PersistentSession readById(Authority authority, String id) {
        // TODO: Implement
        throw new RuntimeException("Not implemented");
    }

    @Override
    public PersistentSession readByRefreshToken(Authority authority, String refreshToken) {
        // TODO: Implement
        throw new RuntimeException("Not implemented");
    }

    @Override
    public void deleteByUserAccountId(Authority authority, String userAccountId) {
        // TODO: Implement
        throw new RuntimeException("Not implemented");
    }

    @Override
    public void deleteByRefreshToken(Authority authority, String refreshToken) {
        // TODO: Implement
        throw new RuntimeException("Not implemented");
    }
}
