package base.account.service.model;

public class NotFoundException extends Exception {
    public NotFoundException() {
        super("Not found");
    }
}
