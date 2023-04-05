package base.account.server.model;

public class Account {
    private String id;
    private String name;
    private String password;
    private short roles;

    public Account() { }

    public Account(String id, String name, String password, short roles) {
        this.id = id;
        this.name = name;
        this.password = password;
        this.roles = roles;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public short getRoles() {
        return roles;
    }

    public void setRoles(short roles) {
        this.roles = roles;
    }
}
