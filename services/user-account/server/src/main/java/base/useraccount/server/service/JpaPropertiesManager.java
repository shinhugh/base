package base.useraccount.server.service;

import java.util.HashMap;
import java.util.Map;

public class JpaPropertiesManager implements JpaPropertiesService {
    @Override
    public Map<String, String> generateProperties() {
        Map<String, String> properties = new HashMap<>();
        properties.put("hibernate.connection.url", "jdbc:mysql://" + System.getenv("AUTH_DB_HOST") + ":" + System.getenv("AUTH_DB_PORT") + "/" + System.getenv("AUTH_DB_DATABASE"));
        properties.put("hibernate.connection.username", System.getenv("AUTH_DB_USERNAME"));
        properties.put("hibernate.connection.password", System.getenv("AUTH_DB_PASSWORD"));
        return properties;
    }
}
