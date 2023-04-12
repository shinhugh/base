package base.account.service.model;

public class AccessDeniedException extends Exception {
    public AccessDeniedException() {
        super("Access denied");
    }
}
