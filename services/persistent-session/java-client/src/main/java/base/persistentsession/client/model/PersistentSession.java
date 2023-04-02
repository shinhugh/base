package base.persistentsession.client.model;

public class PersistentSession {
    private String id;
    private String userAccountId;
    private short roles;
    private String refreshToken;
    private long creationTime;
    private long expirationTime;

    public PersistentSession() { }

    public PersistentSession(String id, String userAccountId, short roles, String refreshToken, long creationTime, long expirationTime) {
        this.id = id;
        this.userAccountId = userAccountId;
        this.roles = roles;
        this.refreshToken = refreshToken;
        this.creationTime = creationTime;
        this.expirationTime = expirationTime;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserAccountId() {
        return userAccountId;
    }

    public void setUserAccountId(String userAccountId) {
        this.userAccountId = userAccountId;
    }

    public short getRoles() {
        return roles;
    }

    public void setRoles(short roles) {
        this.roles = roles;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public long getCreationTime() {
        return creationTime;
    }

    public void setCreationTime(long creationTime) {
        this.creationTime = creationTime;
    }

    public long getExpirationTime() {
        return expirationTime;
    }

    public void setExpirationTime(long expirationTime) {
        this.expirationTime = expirationTime;
    }
}
