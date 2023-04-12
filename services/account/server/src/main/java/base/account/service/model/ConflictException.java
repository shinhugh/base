package base.account.service.model;

public class ConflictException extends Exception {
    public ConflictException() {
        super("Conflict");
    }
}
