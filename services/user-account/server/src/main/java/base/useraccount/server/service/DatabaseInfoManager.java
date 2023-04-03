package base.useraccount.server.service;

import java.util.Map;

public class DatabaseInfoManager implements DatabaseInfoService {
    private static final String DB_HOST = System.getenv("AUTH_DB_HOST");
    private static final String DB_PORT = System.getenv("AUTH_DB_PORT");
    private static final String DB_DATABASE = System.getenv("AUTH_DB_DATABASE");
    private static final String DB_USERNAME = System.getenv("AUTH_DB_USERNAME");
    private static final String DB_PASSWORD = System.getenv("AUTH_DB_PASSWORD");
    private static final String CONNECTION_URL_FORMAT = "jdbc:mysql://%s:%s/%s";

    @Override
    public Map<String, String> getDatabaseInfo() {
        return Map.of("hibernate.connection.url", String.format(CONNECTION_URL_FORMAT, DB_HOST, DB_PORT, DB_DATABASE), "hibernate.connection.username", DB_USERNAME, "hibernate.connection.password", DB_PASSWORD);
    }
}
