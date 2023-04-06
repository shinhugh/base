import base.useraccount.server.model.Authority;
import base.useraccount.server.model.Role;
import base.useraccount.server.model.UserAccount;
import base.useraccount.server.service.UserAccountManager;

import java.util.Map;

public class UserAccountManagerTests {
    private static final String DB_HOST = "localhost";
    private static final int DB_PORT = 3306;
    private static final String DB_DATABASE = "base";
    private static final String DB_USERNAME = "root";
    private static final String DB_PASSWORD = "";
    private static final String CONNECTION_URL = "jdbc:mysql://" + DB_HOST + ":" + DB_PORT + "/" + DB_DATABASE;
    private static final Map<String, String> DATABASE_INFO = Map.of("hibernate.connection.url", CONNECTION_URL, "hibernate.connection.username", DB_USERNAME, "hibernate.connection.password", DB_PASSWORD);
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final String USERACCOUNT_NAME = "qwer";
    private static final String USERACCOUNT_PASSWORD = "Qwer!234";
    private static final short USERACCOUNT_ROLES = (short) (Role.USER | Role.ADMIN);
    private static final UserAccountManager userAccountManager = new UserAccountManager(DATABASE_INFO);
    private static String userAccountId;

    public static final Test[] tests = new Test[]{
            new Test("Create", new CreateTest()),
            new Test("ReadById", new ReadByIdTest()),
            new Test("ReadByName", new ReadByNameTest()),
            new Test("UpdateById", new UpdateByIdTest()),
            new Test("DeleteById", new DeleteByIdTest()),
    };

    private static class CreateTest implements Test.Runnable {
        @Override
        public void run() {
            UserAccount inputUserAccount = new UserAccount(null, USERACCOUNT_NAME, USERACCOUNT_PASSWORD, null, null, USERACCOUNT_ROLES);
            userAccountId = userAccountManager.create(AUTHORITY, inputUserAccount).getId();
        }
    }

    private static class ReadByIdTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.readById(AUTHORITY, userAccountId);
        }
    }

    private static class ReadByNameTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.readByName(AUTHORITY, USERACCOUNT_NAME);
        }
    }

    private static class UpdateByIdTest implements Test.Runnable {
        @Override
        public void run() {
            UserAccount inputUserAccount = new UserAccount(null, "changed", USERACCOUNT_PASSWORD, null, null, USERACCOUNT_ROLES);
            userAccountManager.updateById(AUTHORITY, userAccountId, inputUserAccount);
        }
    }

    private static class DeleteByIdTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.deleteById(AUTHORITY, userAccountId);
        }
    }
}
