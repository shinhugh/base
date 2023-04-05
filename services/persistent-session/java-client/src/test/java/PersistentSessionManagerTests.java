import base.persistentsession.client.model.Authority;
import base.persistentsession.client.model.PersistentSession;
import base.persistentsession.client.model.Role;
import base.persistentsession.client.service.PersistentSessionManager;

public class PersistentSessionManagerTests {
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final String SESSION_USER_ACCOUNT_ID = "d1da9b21-5106-49b5-8ff1-6f3137fdf403";
    private static final short SESSION_ROLES = (short) (Role.USER | Role.ADMIN);
    private static final PersistentSessionManager persistentSessionManager = new PersistentSessionManager();
    private static String id;
    private static String refreshToken;

    public static Test[] tests = new Test[] {
            new Test("Create", new CreateTest()),
            new Test("ReadById", new ReadByIdTest()),
            new Test("ReadByRefreshToken", new ReadByRefreshTokenTest()),
            new Test("DeleteByUserAccountId", new DeleteByUserAccountIdTest()),
            new Test("DeleteByRefreshToken", new DeleteByRefreshTokenTest()),
    };

    private static class CreateTest implements Test.Runnable {
        @Override
        public void run() {
            PersistentSession inputPersistentSession = new PersistentSession(null, SESSION_USER_ACCOUNT_ID, SESSION_ROLES, null, 0, 0);
            PersistentSession output = persistentSessionManager.create(AUTHORITY, inputPersistentSession);
            id = output.getId();
            refreshToken = output.getRefreshToken();
        }
    }

    private static class ReadByIdTest implements Test.Runnable {
        @Override
        public void run() {
            persistentSessionManager.readById(AUTHORITY, id);
        }
    }

    private static class ReadByRefreshTokenTest implements Test.Runnable {
        @Override
        public void run() {
            persistentSessionManager.readByRefreshToken(AUTHORITY, refreshToken);
        }
    }

    private static class DeleteByUserAccountIdTest implements Test.Runnable {
        @Override
        public void run() {
            persistentSessionManager.deleteByUserAccountId(AUTHORITY, SESSION_USER_ACCOUNT_ID);
        }
    }

    private static class DeleteByRefreshTokenTest implements Test.Runnable {
        @Override
        public void run() {
            persistentSessionManager.deleteByRefreshToken(AUTHORITY, refreshToken);
        }
    }
}
