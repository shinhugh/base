import base.useraccount.client.model.Authority;
import base.useraccount.client.model.Role;
import base.useraccount.client.model.UserAccount;
import base.useraccount.client.service.UserAccountManager;

public class UserAccountManagerTests {
    private static final Authority AUTHORITY = new Authority(null, (short) 1);
    private static final String ACCOUNT_NAME = "qwer";
    private static final String ACCOUNT_PASSWORD_HASH = "4a804274c38354a356d5373e091089d343454b551f6116d94bc06d786f9bbcea";
    private static final String ACCOUNT_PASSWORD_SALT = "pmm7pvj7pbnn18k7ld3pfrkszj80i135";
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
            UserAccount userAccount = new UserAccount(null, ACCOUNT_NAME, ACCOUNT_PASSWORD_HASH, ACCOUNT_PASSWORD_SALT, ACCOUNT_ROLES);
            id = userAccountManager.create(AUTHORITY, userAccount);
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
            String name = "changed";
            UserAccount userAccount = new UserAccount(null, name, ACCOUNT_PASSWORD_HASH, ACCOUNT_PASSWORD_SALT, ACCOUNT_ROLES);
            userAccountManager.updateById(AUTHORITY, id, userAccount);
        }
    }

    private static class DeleteByIdTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.deleteById(AUTHORITY, id);
        }
    }
}
