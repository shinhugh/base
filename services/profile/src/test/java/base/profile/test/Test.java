package base.profile.test;

public class Test {
    private final String name;
    private final Runnable runnable;

    public Test(String name, Runnable runnable) {
        this.name = name;
        this.runnable = runnable;
    }

    public void run() {
        String header = "[" + name + "] ";
        try {
            runnable.run();
            System.out.println(header + "PASS");
        }
        catch (Exception e) {
            System.out.println(header + e.getMessage());
            System.out.println(header + "FAIL");
        }
    }

    public interface Runnable {
        void run();
    }
}
