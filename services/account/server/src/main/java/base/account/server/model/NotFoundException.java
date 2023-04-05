package base.account.server.model;

public class NotFoundException extends RuntimeException {
    public NotFoundException() {
        super("Not found");
    }
}
