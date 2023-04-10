package base.account.model;

public class ConflictException extends RuntimeException {
    public ConflictException() {
        super("Conflict");
    }
}
