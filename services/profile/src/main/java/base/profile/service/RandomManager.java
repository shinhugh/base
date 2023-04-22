package base.profile.service;

public class RandomManager implements RandomService {
    @Override
    public String generateRandomString(String pool, int length) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            result.append(pool.charAt((int) (Math.random() * pool.length())));
        }
        return result.toString();
    }

}
