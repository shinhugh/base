package base.account.server.service;

import base.account.server.model.Authority;
import base.account.server.model.UserAccount;

public interface UserAccountService {
    UserAccount create(Authority authority, UserAccount userAccount);
    UserAccount readById(Authority authority, String id);
    UserAccount readByName(Authority authority, String name);
    UserAccount updateById(Authority authority, String id, UserAccount userAccount);
    void deleteById(Authority authority, String id);
}
