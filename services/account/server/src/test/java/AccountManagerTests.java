import base.account.server.model.Account;
import base.account.server.model.Authority;
import base.account.server.model.Role;
import base.account.server.service.AccountManager;

public class AccountManagerTests {
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final String ACCOUNT_NAME = "qwer";
    private static final String ACCOUNT_PASSWORD = "Qwer!234";
    private static final short ACCOUNT_ROLES = (short) (Role.USER | Role.ADMIN);
    private static final AccountManager accountManager = new AccountManager();
    private static String id;

    public static Test[] tests = new Test[]{
            new Test("Create", new CreateTest()),
            new Test("ReadById", new ReadByIdTest()),
            new Test("ReadByName", new ReadByNameTest()),
            new Test("UpdateById", new UpdateByIdTest()),
            new Test("DeleteById", new DeleteByIdTest()),
    };

    private static class CreateTest implements Test.Runnable {
        @Override
        public void run() {
            Account inputAccount = new Account(null, ACCOUNT_NAME, ACCOUNT_PASSWORD, ACCOUNT_ROLES);
            id = accountManager.create(AUTHORITY, inputAccount).getId();
        }
    }

    private static class ReadByIdTest implements Test.Runnable {
        @Override
        public void run() {
            accountManager.readById(AUTHORITY, id);
        }
    }

    private static class ReadByNameTest implements Test.Runnable {
        @Override
        public void run() {
            accountManager.readByName(AUTHORITY, ACCOUNT_NAME);
        }
    }

    private static class UpdateByIdTest implements Test.Runnable {
        @Override
        public void run() {
            Account inputAccount = new Account(null, "changed", ACCOUNT_PASSWORD, ACCOUNT_ROLES);
            accountManager.updateById(AUTHORITY, id, inputAccount);
        }
    }

    private static class DeleteByIdTest implements Test.Runnable {
        @Override
        public void run() {
            accountManager.deleteById(AUTHORITY, id);
        }
    }
}
