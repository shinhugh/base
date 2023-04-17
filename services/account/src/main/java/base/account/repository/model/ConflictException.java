package base.account.repository.model;

public class ConflictException extends Exception {
    public ConflictException() {
        super("Conflict");
    }
}
