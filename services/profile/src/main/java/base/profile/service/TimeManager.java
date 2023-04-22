package base.profile.service;

public class TimeManager implements TimeService {
    @Override
    public long currentTimeSeconds() {
        return System.currentTimeMillis() / 1000;
    }
}
