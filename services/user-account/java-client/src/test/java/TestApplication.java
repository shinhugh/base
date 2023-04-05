public class TestApplication {
    public static void main(String[] args) {
        for (Test test : UserAccountManagerTests.tests) {
            test.run();
        }
    }
}
