package base.useraccount.client.model;

public class Authority {
    private String id;
    private short roles;

    public Authority() { }

    public Authority(String id, short roles) {
        this.id = id;
        this.roles = roles;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public short getRoles() {
        return roles;
    }

    public void setRoles(short roles) {
        this.roles = roles;
    }
}
