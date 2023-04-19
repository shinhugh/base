package base.profile.service.model;

public class Profile {
    private String accountId;
    private String name;

    public Profile() { }

    public Profile(String accountId, String name) {
        this.accountId = accountId;
        this.name = name;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
