package base.useraccount.model;

public class NotFoundException extends RuntimeException {
    public NotFoundException() {
        super("Not found");
    }
}
