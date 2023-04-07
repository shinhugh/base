package base.useraccount.model;

public class ConflictException extends RuntimeException {
    public ConflictException() {
        super("Conflict");
    }
}
