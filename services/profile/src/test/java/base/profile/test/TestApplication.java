package base.profile.test;

import static base.profile.test.ProfileManagerTests.tests;

public class TestApplication {
    public static void main(String[] args) {
        for (Test test : tests) {
            test.run();
        }
    }
}
