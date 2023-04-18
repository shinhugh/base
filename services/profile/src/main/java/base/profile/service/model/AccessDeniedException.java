package base.profile.service.model;

public class AccessDeniedException extends Exception {
    public AccessDeniedException() {
        super("Access denied");
    }
}
