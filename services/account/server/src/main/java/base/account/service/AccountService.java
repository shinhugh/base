package base.account.service;

import base.account.model.Account;
import base.account.model.Authority;

public interface AccountService {
    Account read(Authority authority, String id, String name);
    Account create(Authority authority, Account account);
    Account update(Authority authority, String id, String name, Account account);
    void delete(Authority authority, String id, String name);
}
