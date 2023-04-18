package base.profile.service.model;

public class NotFoundException extends Exception {
    public NotFoundException() {
        super("Not found");
    }
}
