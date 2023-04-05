import base.useraccount.client.model.Authority;
import base.useraccount.client.model.Role;
import base.useraccount.client.model.UserAccount;
import base.useraccount.client.service.UserAccountManager;

public class UserAccountManagerTests {
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final String ACCOUNT_NAME = "qwer";
    private static final String ACCOUNT_PASSWORD = "Qwer!234";
    private static final short ACCOUNT_ROLES = (short) (Role.USER | Role.ADMIN);
    private static final UserAccountManager userAccountManager = new UserAccountManager();
    private static String id;

    public static Test[] tests = new Test[] {
            new Test("Create", new CreateTest()),
            new Test("ReadById", new ReadByIdTest()),
            new Test("ReadByName", new ReadByNameTest()),
            new Test("UpdateById", new UpdateByIdTest()),
            new Test("DeleteById", new DeleteByIdTest()),
    };

    private static class CreateTest implements Test.Runnable {
        @Override
        public void run() {
            UserAccount inputUserAccount = new UserAccount(null, ACCOUNT_NAME, ACCOUNT_PASSWORD, null, null, ACCOUNT_ROLES);
            id = userAccountManager.create(AUTHORITY, inputUserAccount).getId();
        }
    }

    private static class ReadByIdTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.readById(AUTHORITY, id);
        }
    }

    private static class ReadByNameTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.readByName(AUTHORITY, ACCOUNT_NAME);
        }
    }

    private static class UpdateByIdTest implements Test.Runnable {
        @Override
        public void run() {
            UserAccount inputUserAccount = new UserAccount(null, "changed", ACCOUNT_PASSWORD, null, null, ACCOUNT_ROLES);
            userAccountManager.updateById(AUTHORITY, id, inputUserAccount);
        }
    }

    private static class DeleteByIdTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.deleteById(AUTHORITY, id);
        }
    }
}
