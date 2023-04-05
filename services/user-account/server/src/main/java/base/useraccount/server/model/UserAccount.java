package base.useraccount.server.model;

import jakarta.persistence.*;

@Entity
@Table(name = "UserAccounts")
public class UserAccount {
    @Id
    @Column(name = "Id", nullable = false)
    private String id;
    @Column(name = "Name", nullable = false, unique = true)
    private String name;
    @Transient
    private String password;
    @Column(name = "PasswordHash", nullable = false)
    private String passwordHash;
    @Column(name = "PasswordSalt", nullable = false)
    private String passwordSalt;
    @Column(name = "Roles", nullable = false)
    private short roles;

    public UserAccount() { }

    public UserAccount(String id, String name, String password, String passwordHash, String passwordSalt, short roles) {
        this.id = id;
        this.name = name;
        this.password = password;
        this.passwordHash = passwordHash;
        this.passwordSalt = passwordSalt;
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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPasswordSalt() {
        return passwordSalt;
    }

    public void setPasswordSalt(String passwordSalt) {
        this.passwordSalt = passwordSalt;
    }

    public short getRoles() {
        return roles;
    }

    public void setRoles(short roles) {
        this.roles = roles;
    }
}
