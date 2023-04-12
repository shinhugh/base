package base.account.repository.model;

public class NotFoundException extends Exception {
    public NotFoundException() {
        super("Not found");
    }
}
