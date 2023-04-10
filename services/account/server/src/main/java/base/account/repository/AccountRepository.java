package base.account.repository;

import base.account.model.Account;

public interface AccountRepository {
    Account[] readByIdAndName(String id, String name);
    Account create(Account account);
    Account updateByIdAndName(String id, String name, Account account);
    int deleteByIdAndName(String id, String name);
}
