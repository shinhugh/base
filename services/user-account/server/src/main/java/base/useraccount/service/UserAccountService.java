package base.useraccount.service;

import base.useraccount.model.Authority;
import base.useraccount.model.UserAccount;

public interface UserAccountService {
    UserAccount read(Authority authority, String id, String name);
    UserAccount create(Authority authority, UserAccount userAccount);
    UserAccount update(Authority authority, String id, String name, UserAccount userAccount);
    void delete(Authority authority, String id, String name);
}
