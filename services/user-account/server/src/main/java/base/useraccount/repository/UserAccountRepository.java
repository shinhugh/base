package base.useraccount.repository;

import base.useraccount.model.UserAccount;

public interface UserAccountRepository {
    UserAccount[] readByIdAndName(String id, String name);
    UserAccount create(UserAccount userAccount);
    UserAccount updateByIdAndName(String id, String name, UserAccount userAccount);
    int deleteByIdAndName(String id, String name);
}
