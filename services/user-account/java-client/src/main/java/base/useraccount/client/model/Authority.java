package base.useraccount.client.model;

public class Authority {
    private String id;
    private short roles;
    private long authTime;

    public Authority() { }

    public Authority(String id, short roles, long authTime) {
        this.id = id;
        this.roles = roles;
        this.authTime = authTime;
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

    public long getAuthTime() {
        return authTime;
    }

    public void setAuthTime(long authTime) {
        this.authTime = authTime;
    }
}
