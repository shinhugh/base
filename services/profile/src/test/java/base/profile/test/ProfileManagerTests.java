package base.profile.test;

public class ProfileManagerTests {
    public static Test[] tests = new Test[] {
            new Test("Read profiles", new ReadProfilesTest()),
            new Test("Create profile", new CreateProfileTest()),
            new Test("Update profile", new UpdateProfileTest()),
            new Test("Delete profile", new DeleteProfileTest())
    };

    private static class ReadProfilesTest implements Test.Runnable {
        @Override
        public void run() {
            // TODO: Implement test
        }
    }

    private static class CreateProfileTest implements Test.Runnable {
        @Override
        public void run() {
            // TODO: Implement test
        }
    }

    private static class UpdateProfileTest implements Test.Runnable {
        @Override
        public void run() {
            // TODO: Implement test
        }
    }

    private static class DeleteProfileTest implements Test.Runnable {
        @Override
        public void run() {
            // TODO: Implement test
        }
    }
}
