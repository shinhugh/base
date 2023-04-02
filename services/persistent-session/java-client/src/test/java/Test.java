public class Test {
    private final String name;
    private final Runnable runnable;

    public Test(String name, Runnable runnable) {
        this.name = name;
        this.runnable = runnable;
    }

    public void run() {
        String header = "[" + name + "] ";
        System.out.println(header + "Entering test");
        try {
            runnable.run();
        }
        catch (Exception ex) {
            System.out.println(header + ex.getMessage());
        }
        System.out.println(header + "Exiting test");
    }

    public interface Runnable {
        void run();
    }
}
