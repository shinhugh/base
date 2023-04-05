import base.persistentsession.client.model.Authority;
import base.persistentsession.client.model.PersistentSession;
import base.persistentsession.client.model.Role;
import base.persistentsession.client.service.PersistentSessionManager;

public class PersistentSessionManagerTests {
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final String SESSION_USER_ACCOUNT_ID = "d1da9b21-5106-49b5-8ff1-6f3137fdf403";
    private static final short SESSION_ROLES = (short) (Role.USER | Role.ADMIN);
    private static final String SESSION_REFRESH_TOKEN = "xt02bgf0srkdb6g572eqcww6umdaik9566bt42axzs67aw9jd3bul6zspaktf8pp2k7lob6tmihmdutzmszvztyrlzj3xdqyx1eipffml19ph1b9a7w5mjk32hq4vsrh";
    private static final long SESSION_DURATION = 600;
    private static final PersistentSessionManager persistentSessionManager = new PersistentSessionManager();
    private static String id;

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
            long currentTime = System.currentTimeMillis() / 1000;
            PersistentSession persistentSession = new PersistentSession(null, SESSION_USER_ACCOUNT_ID, SESSION_ROLES, SESSION_REFRESH_TOKEN, currentTime, currentTime + SESSION_DURATION);
            id = persistentSessionManager.create(AUTHORITY, persistentSession);
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
            persistentSessionManager.readByRefreshToken(AUTHORITY, SESSION_REFRESH_TOKEN);
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
            persistentSessionManager.deleteByRefreshToken(AUTHORITY, SESSION_REFRESH_TOKEN);
        }
    }
}
