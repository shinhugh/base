package base.persistentsession.client.model;

public class NotFoundException extends RuntimeException {
    public NotFoundException() {
        super("Not found");
    }
}