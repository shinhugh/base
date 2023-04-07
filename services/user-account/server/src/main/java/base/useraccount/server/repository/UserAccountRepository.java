package base.useraccount.server.repository;

import base.useraccount.server.model.UserAccount;

public interface UserAccountRepository {
    UserAccount read(String id, String name);
    UserAccount create(UserAccount userAccount);
    UserAccount update(String id, String name, UserAccount userAccount);
    void delete(String id, String name);
}
