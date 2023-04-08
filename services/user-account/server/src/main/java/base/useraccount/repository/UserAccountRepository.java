package base.useraccount.repository;

import base.useraccount.model.UserAccount;

public interface UserAccountRepository {
    UserAccount[] read(String id, String name);
    UserAccount create(UserAccount userAccount);
    UserAccount update(String id, String name, UserAccount userAccount);
    int delete(String id, String name);
}
