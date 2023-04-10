package base.account.model;

public class NotFoundException extends RuntimeException {
    public NotFoundException() {
        super("Not found");
    }
}
