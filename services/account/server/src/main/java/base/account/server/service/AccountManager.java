package base.account.server.service;

import base.account.server.model.Account;
import base.account.server.model.Authority;
import base.account.server.model.UserAccount;

public class AccountManager implements AccountService {
    private final PersistentSessionService persistentSessionService = new PersistentSessionManager();
    private final UserAccountService userAccountService = new UserAccountManager();

    @Override
    public Account create(Authority authority, Account account) {
        UserAccount inputUserAccount = new UserAccount(account.getId(), account.getName(), account.getPassword(), null, null, account.getRoles());
        UserAccount output = userAccountService.create(authority, inputUserAccount);
        return new Account(output.getId(), output.getName(), output.getPassword(), output.getRoles());
    }

    @Override
    public Account readById(Authority authority, String id) {
        UserAccount output = userAccountService.readById(authority, id);
        return new Account(output.getId(), output.getName(), output.getPassword(), output.getRoles());
    }

    @Override
    public Account readByName(Authority authority, String name) {
        UserAccount output = userAccountService.readByName(authority, name);
        return new Account(output.getId(), output.getName(), output.getPassword(), output.getRoles());
    }

    @Override
    public Account updateById(Authority authority, String id, Account account) {
        UserAccount inputUserAccount = new UserAccount(account.getId(), account.getName(), account.getPassword(), null, null, account.getRoles());
        UserAccount output = userAccountService.updateById(authority, id, inputUserAccount);
        persistentSessionService.deleteByUserAccountId(authority, output.getId());
        return new Account(output.getId(), output.getName(), output.getPassword(), output.getRoles());
    }

    @Override
    public void deleteById(Authority authority, String id) {
        userAccountService.deleteById(authority, id);
        persistentSessionService.deleteByUserAccountId(authority, id);
    }
}
