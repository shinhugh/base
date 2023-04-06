import base.persistentsession.client.model.Authority;
import base.persistentsession.client.model.PersistentSession;
import base.persistentsession.client.model.Role;
import base.persistentsession.client.service.PersistentSessionManager;

public class PersistentSessionManagerTests {
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final String PERSISTENTSESSION_USERACCOUNTID = "d1da9b21-5106-49b5-8ff1-6f3137fdf403";
    private static final short PERSISTENTSESSION_ROLES = (short) (Role.USER | Role.ADMIN);
    private static final PersistentSessionManager persistentSessionManager = new PersistentSessionManager();
    private static String persistentSessionId;
    private static String persistentSessionRefreshToken;

    public static final Test[] tests = new Test[] {
            new Test("Create", new CreateTest()),
            new Test("ReadById", new ReadByIdTest()),
            new Test("ReadByRefreshToken", new ReadByRefreshTokenTest()),
            new Test("DeleteByUserAccountId", new DeleteByUserAccountIdTest()),
            new Test("DeleteByRefreshToken", new DeleteByRefreshTokenTest()),
    };

    private static class CreateTest implements Test.Runnable {
        @Override
        public void run() {
            PersistentSession inputPersistentSession = new PersistentSession(null, PERSISTENTSESSION_USERACCOUNTID, PERSISTENTSESSION_ROLES, null, 0, 0);
            PersistentSession output = persistentSessionManager.create(AUTHORITY, inputPersistentSession);
            persistentSessionId = output.getId();
            persistentSessionRefreshToken = output.getRefreshToken();
        }
    }

    private static class ReadByIdTest implements Test.Runnable {
        @Override
        public void run() {
            persistentSessionManager.readById(AUTHORITY, persistentSessionId);
        }
    }

    private static class ReadByRefreshTokenTest implements Test.Runnable {
        @Override
        public void run() {
            persistentSessionManager.readByRefreshToken(AUTHORITY, persistentSessionRefreshToken);
        }
    }

    private static class DeleteByUserAccountIdTest implements Test.Runnable {
        @Override
        public void run() {
            persistentSessionManager.deleteByUserAccountId(AUTHORITY, PERSISTENTSESSION_USERACCOUNTID);
        }
    }

    private static class DeleteByRefreshTokenTest implements Test.Runnable {
        @Override
        public void run() {
            persistentSessionManager.deleteByRefreshToken(AUTHORITY, persistentSessionRefreshToken);
        }
    }
}
