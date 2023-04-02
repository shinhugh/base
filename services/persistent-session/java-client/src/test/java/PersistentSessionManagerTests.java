import base.persistentsession.client.model.Authority;
import base.persistentsession.client.model.PersistentSession;
import base.persistentsession.client.service.PersistentSessionManager;
import com.google.gson.Gson;

public class PersistentSessionManagerTests {
    private static final Authority AUTHORITY = new Authority(null, (short) 1);
    private static final String SESSION_USER_ACCOUNT_ID = "d1da9b21-5106-49b5-8ff1-6f3137fdf403";
    private static final String SESSION_REFRESH_TOKEN = "xt02bgf0srkdb6g572eqcww6umdaik9566bt42axzs67aw9jd3bul6zspaktf8pp2k7lob6tmihmdutzmszvztyrlzj3xdqyx1eipffml19ph1b9a7w5mjk32hq4vsrh";
    private static final long SESSION_DURATION = 600;
    private static final short SESSION_ROLES = 6;
    private final PersistentSessionManager persistentSessionManager = new PersistentSessionManager();
    private final Gson gson = new Gson();
    private String id;

    public void testAll() {
        testCreate();
        testReadById();
        testReadByRefreshToken();
        testDeleteByUserAccountId();
        testDeleteByRefreshToken();
    }

    public void testCreate() {
        String header = "[create] ";
        System.out.println(header + "Entering test");
        try {
            long currentTime = System.currentTimeMillis() / 1000;
            PersistentSession persistentSession = new PersistentSession(null, SESSION_USER_ACCOUNT_ID, SESSION_ROLES, SESSION_REFRESH_TOKEN, currentTime, currentTime + SESSION_DURATION);
            id = persistentSessionManager.create(AUTHORITY, persistentSession);
            System.out.println(header + "id: " + id);
        }
        catch (Exception e) {
            System.out.println(header + e.getMessage());
        }
        System.out.println(header + "Exiting test");
    }

    public void testReadById() {
        String header = "[readById] ";
        System.out.println(header + "Entering test");
        try {
            PersistentSession persistentSession = persistentSessionManager.readById(AUTHORITY, id);
            System.out.println(header + "persistentSession: " + gson.toJson(persistentSession));
        }
        catch (Exception e) {
            System.out.println(header + e.getMessage());
        }
        System.out.println(header + "Exiting test");
    }

    public void testReadByRefreshToken() {
        String header = "[readByRefreshToken] ";
        System.out.println(header + "Entering test");
        try {
            PersistentSession persistentSession = persistentSessionManager.readByRefreshToken(AUTHORITY, SESSION_REFRESH_TOKEN);
            System.out.println(header + "persistentSession: " + gson.toJson(persistentSession));
        }
        catch (Exception e) {
            System.out.println(header + e.getMessage());
        }
        System.out.println(header + "Exiting test");
    }

    public void testDeleteByUserAccountId() {
        String header = "[deleteByUserAccountId] ";
        System.out.println(header + "Entering test");
        try {
            persistentSessionManager.deleteByUserAccountId(AUTHORITY, SESSION_USER_ACCOUNT_ID);
        }
        catch (Exception e) {
            System.out.println(header + e.getMessage());
        }
        System.out.println(header + "Exiting test");
    }

    public void testDeleteByRefreshToken() {
        String header = "[deleteByRefreshToken] ";
        System.out.println(header + "Entering test");
        try {
            persistentSessionManager.deleteByRefreshToken(AUTHORITY, SESSION_REFRESH_TOKEN);
        }
        catch (Exception e) {
            System.out.println(header + e.getMessage());
        }
        System.out.println(header + "Exiting test");
    }
}
