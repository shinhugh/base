package base.persistentsession.client.model;

public class ConflictException extends RuntimeException {
    public ConflictException() {
        super("Conflict");
    }
}
