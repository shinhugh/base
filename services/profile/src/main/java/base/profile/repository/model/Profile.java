package base.profile.repository.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Profiles")
public class Profile {
    @Id
    @Column(name = "AccountId", nullable = false)
    private String accountId;
    @Column(name = "Name", nullable = false)
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
