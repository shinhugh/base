package base.account.repository;

import base.account.repository.model.Account;
import base.account.repository.model.ConflictException;
import base.account.repository.model.IllegalArgumentException;
import base.account.repository.model.NotFoundException;

public interface AccountRepository {
    Account[] readByIdAndName(String id, String name) throws IllegalArgumentException;
    Account create(Account account) throws IllegalArgumentException, ConflictException;
    Account updateByIdAndName(String id, String name, Account account) throws IllegalArgumentException, NotFoundException, ConflictException;
    int deleteByIdAndName(String id, String name) throws IllegalArgumentException;
}
