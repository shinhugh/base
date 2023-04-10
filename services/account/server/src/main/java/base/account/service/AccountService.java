package base.account.service;

import base.account.model.Authority;
import base.account.model.Account;

public interface AccountService {
    Account read(Authority authority, String id, String name);
    Account create(Authority authority, Account account);
    Account update(Authority authority, String id, String name, Account account);
    void delete(Authority authority, String id, String name);
}
