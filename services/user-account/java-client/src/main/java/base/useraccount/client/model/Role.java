package base.useraccount.client.model;

public class Role {
    public static short SYSTEM = (short) Math.pow(2, 0);
    public static short USER = (short) Math.pow(2, 1);
    public static short ADMIN = (short) Math.pow(2, 2);

    private Role() { }
}
