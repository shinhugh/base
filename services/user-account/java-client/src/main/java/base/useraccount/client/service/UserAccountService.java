package base.useraccount.client.service;

import base.useraccount.client.model.Authority;
import base.useraccount.client.model.UserAccount;

public interface UserAccountService {
    String create(Authority authority, UserAccount userAccount);
    UserAccount readById(Authority authority, String id);
    UserAccount readByName(Authority authority, String name);
    void updateById(Authority authority, String id, UserAccount userAccount);
    void deleteById(Authority authority, String id);
}
