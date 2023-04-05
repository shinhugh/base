package base.account.server.model;

public class ConflictException extends RuntimeException {
    public ConflictException() {
        super("Conflict");
    }
}
