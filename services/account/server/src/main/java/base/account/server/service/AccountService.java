package base.account.server.service;

import base.account.server.model.Account;
import base.account.server.model.Authority;

public interface AccountService {
    Account create(Authority authority, Account account);
    Account readById(Authority authority, String id);
    Account readByName(Authority authority, String name);
    Account updateById(Authority authority, String id, Account account);
    void deleteById(Authority authority, String id);
}
