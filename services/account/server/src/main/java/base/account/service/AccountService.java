package base.account.service;

import base.account.service.model.IllegalArgumentException;
import base.account.service.model.*;

public interface AccountService {
    Account read(Authority authority, String id, String name) throws IllegalArgumentException, AccessDeniedException, NotFoundException;
    Account create(Authority authority, Account account) throws IllegalArgumentException, ConflictException;
    Account update(Authority authority, String id, String name, Account account) throws IllegalArgumentException, AccessDeniedException, NotFoundException, ConflictException;
    void delete(Authority authority, String id, String name) throws IllegalArgumentException, AccessDeniedException, NotFoundException;
}
