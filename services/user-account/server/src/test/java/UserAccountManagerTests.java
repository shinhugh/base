import base.useraccount.model.Authority;
import base.useraccount.model.Role;
import base.useraccount.model.UserAccount;
import base.useraccount.repository.UserAccountJpaRepository;
import base.useraccount.repository.UserAccountRepository;
import base.useraccount.service.AuthenticationServiceBridge;
import base.useraccount.service.AuthenticationServiceClient;
import base.useraccount.service.UserAccountManager;
import base.useraccount.service.UserAccountService;

import java.util.Map;

public class UserAccountManagerTests {
    private static final String DB_HOST = "localhost";
    private static final String DB_PORT = "3306";
    private static final String DB_DATABASE = "base";
    private static final String DB_USERNAME = "root";
    private static final String DB_PASSWORD = "";
    private static final String CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";
    private static final Map<String, String> DATABASE_INFO = Map.of("hibernate.connection.url", String.format(CONNECTION_URL_FORMAT, DB_HOST, DB_PORT, DB_DATABASE), "hibernate.connection.username", DB_USERNAME, "hibernate.connection.password", DB_PASSWORD);
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final String USERACCOUNT_NAME = "qwer";
    private static final String USERACCOUNT_PASSWORD = "Qwer!234";
    private static final short USERACCOUNT_ROLES = (short) (Role.USER | Role.ADMIN);
    private static final UserAccountRepository userAccountRepository = new UserAccountJpaRepository(DATABASE_INFO);
    private static final AuthenticationServiceClient authenticationServiceClient = new AuthenticationServiceBridge();
    private static final UserAccountService userAccountManager = new UserAccountManager(userAccountRepository, authenticationServiceClient);
    private static String userAccountId;
    private static String userAccountName;

    public static final Test[] tests = new Test[] {
            new Test("Create", new CreateTest()),
            new Test("Read", new ReadTest()),
            new Test("Update", new UpdateTest()),
            new Test("Delete", new DeleteTest()),
    };

    private static class CreateTest implements Test.Runnable {
        @Override
        public void run() {
            UserAccount inputUserAccount = new UserAccount(null, USERACCOUNT_NAME, USERACCOUNT_PASSWORD, null, null, USERACCOUNT_ROLES);
            userAccountId = userAccountManager.create(AUTHORITY, inputUserAccount).getId();
        }
    }

    private static class ReadTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.read(AUTHORITY, userAccountId, USERACCOUNT_NAME);
        }
    }

    private static class UpdateTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountName = "changed";
            UserAccount inputUserAccount = new UserAccount(null, userAccountName, USERACCOUNT_PASSWORD, null, null, USERACCOUNT_ROLES);
            userAccountManager.update(AUTHORITY, userAccountId, USERACCOUNT_NAME, inputUserAccount);
        }
    }

    private static class DeleteTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountManager.delete(AUTHORITY, userAccountId, userAccountName);
        }
    }
}
