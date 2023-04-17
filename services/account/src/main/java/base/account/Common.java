package base.account;

public class Common {
    public static RuntimeException wrapException(Throwable e, String message) {
        if (e.getCause() == null) {
            return new RuntimeException(message, e);
        }
        return new RuntimeException(message, e.getCause());
    }
}
