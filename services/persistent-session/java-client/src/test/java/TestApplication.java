public class TestApplication {
    public static void main(String[] args) {
        for (Test test : PersistentSessionManagerTests.tests) {
            test.run();
        }
    }
}
