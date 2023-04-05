public class TestApplication {
    public static void main(String[] args) {
        for (Test test : AccountManagerTests.tests) {
            test.run();
        }
    }
}
