package base.useraccount.server.service;

import base.useraccount.server.model.IllegalArgumentException;
import base.useraccount.server.model.*;
import jakarta.persistence.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.UUID;

public class UserAccountManager implements UserAccountService {
    private static final short ROLES_MAX_VALUE = 255;
    private static final long TIME_MAX_VALUE = 4294967295L;
    private static final int NAME_MIN_LENGTH = 4;
    private static final int NAME_MAX_LENGTH = 32;
    private static final String NAME_ALLOWED_CHARS = "-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    private static final int PASSWORD_MIN_LENGTH = 8;
    private static final int PASSWORD_MAX_LENGTH = 32;
    private static final String PASSWORD_ALLOWED_CHARS = " !\\\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
    private static final int PASSWORD_SALT_LENGTH = 32;
    private static final String PASSWORD_SALT_ALLOWED_CHARS = PASSWORD_ALLOWED_CHARS;
    private static final byte[] HEX_CHARS = "0123456789abcdef".getBytes(StandardCharsets.US_ASCII);
    private final EntityManagerFactory entityManagerFactory;

    public UserAccountManager(Map<String, String> databaseInfo) {
        if (databaseInfo == null) {
            throw new IllegalArgumentException();
        }
        entityManagerFactory = Persistence.createEntityManagerFactory("base", databaseInfo);
    }

    @Override
    public UserAccount create(Authority authority, UserAccount userAccount) {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (userAccount == null || !validateUserAccount(userAccount)) {
            throw new IllegalArgumentException();
        }
        String passwordSalt = generateRandomString(PASSWORD_SALT_ALLOWED_CHARS, PASSWORD_SALT_LENGTH);
        String passwordHash = hashPassword(userAccount.getPassword(), passwordSalt);
        UserAccount entry = new UserAccount(null, userAccount.getName(), null, passwordHash, passwordSalt, userAccount.getRoles());
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            UserAccount match = null;
            entityManager.getTransaction().begin();
            TypedQuery<UserAccount> query = entityManager.createQuery("from UserAccount as x where x.name = :name", UserAccount.class);
            try {
                match = query.setParameter("name", userAccount.getName()).getSingleResult();
            }
            catch (NoResultException ignored) { }
            if (match != null) {
                entityManager.getTransaction().rollback();
                throw new ConflictException();
            }
            entry.setId(generateId(entityManager));
            entityManager.merge(entry);
            entityManager.getTransaction().commit();
            if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
                entry.setPasswordHash(null);
                entry.setPasswordSalt(null);
            }
            return entry;
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public UserAccount readById(Authority authority, String id) {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (id == null || !validateId(id)) {
            throw new IllegalArgumentException();
        }
        if (onlyAuthorizedAsUser && !id.equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        String queryString = "from UserAccount as x where x.id = :id";
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            UserAccount match = null;
            entityManager.getTransaction().begin();
            TypedQuery<UserAccount> query = entityManager.createQuery(queryString, UserAccount.class);
            query.setParameter("id", id);
            try {
                match = query.getSingleResult();
            }
            catch (NoResultException ignored) { }
            entityManager.getTransaction().rollback();
            if (match == null) {
                throw new NotFoundException();
            }
            if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
                match.setPasswordHash(null);
                match.setPasswordSalt(null);
            }
            return match;
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public UserAccount readByName(Authority authority, String name) {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (name == null || !validateName(name)) {
            throw new IllegalArgumentException();
        }
        String queryString = "from UserAccount as x where x.name = :name";
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            UserAccount match = null;
            entityManager.getTransaction().begin();
            TypedQuery<UserAccount> query = entityManager.createQuery(queryString, UserAccount.class);
            query.setParameter("name", name);
            try {
                match = query.getSingleResult();
            }
            catch (NoResultException ignored) { }
            entityManager.getTransaction().rollback();
            if (match == null) {
                if (onlyAuthorizedAsUser) {
                    throw new AccessDeniedException();
                }
                throw new NotFoundException();
            }
            if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
                throw new AccessDeniedException();
            }
            if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
                match.setPasswordHash(null);
                match.setPasswordSalt(null);
            }
            return match;
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public UserAccount updateById(Authority authority, String id, UserAccount userAccount) {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (id == null || !validateId(id)) {
            throw new IllegalArgumentException();
        }
        if (onlyAuthorizedAsUser && !id.equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        if (userAccount == null || !validateUserAccount(userAccount)) {
            throw new IllegalArgumentException();
        }
        String passwordSalt = generateRandomString(PASSWORD_SALT_ALLOWED_CHARS, PASSWORD_SALT_LENGTH);
        String passwordHash = hashPassword(userAccount.getPassword(), passwordSalt);
        String queryString = "from UserAccount as x where x.id = :id";
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            UserAccount match = null;
            entityManager.getTransaction().begin();
            TypedQuery<UserAccount> query = entityManager.createQuery(queryString, UserAccount.class);
            query.setParameter("id", id);
            try {
                match = query.getSingleResult();
            }
            catch (NoResultException ignored) { }
            if (match == null) {
                entityManager.getTransaction().rollback();
                throw new NotFoundException();
            }
            match.setName(userAccount.getName());
            match.setPasswordHash(passwordHash);
            match.setPasswordSalt(passwordSalt);
            match.setRoles(userAccount.getRoles());
            entityManager.getTransaction().commit();
            if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
                match.setPasswordHash(null);
                match.setPasswordSalt(null);
            }
            return match;
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public void deleteById(Authority authority, String id) {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (id == null || !validateId(id)) {
            throw new IllegalArgumentException();
        }
        if (onlyAuthorizedAsUser && !id.equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            entityManager.getTransaction().begin();
            UserAccount userAccount = entityManager.find(UserAccount.class, id);
            if (userAccount == null) {
                entityManager.getTransaction().rollback();
                return;
            }
            entityManager.remove(userAccount);
            entityManager.getTransaction().commit();
        }
        finally {
            entityManager.close();
        }
    }

    private boolean verifyAuthorityContainsAtLeastOneRole(Authority authority, short roles) {
        if (!validateAuthority(authority) || roles < 0 || roles > ROLES_MAX_VALUE) {
            throw new IllegalArgumentException();
        }
        if (roles == 0) {
            return true;
        }
        if (authority == null) {
            return false;
        }
        return (authority.getRoles() & roles) != 0;
    }

    private boolean validateId(String id) {
        if (id == null) {
            return true;
        }
        try {
            UUID.fromString(id);
        }
        catch (java.lang.IllegalArgumentException ex) {
            return false;
        }
        return true;
    }

    private boolean validateAuthority(Authority authority) {
        if (authority == null) {
            return true;
        }
        if (authority.getId() != null && !validateId(authority.getId())) {
            return false;
        }
        if (authority.getRoles() < 0 || authority.getRoles() > ROLES_MAX_VALUE) {
            return false;
        }
        return authority.getAuthTime() >= 0 && authority.getAuthTime() <= TIME_MAX_VALUE;
    }

    private boolean validateUserAccount(UserAccount userAccount) {
        if (userAccount == null) {
            return true;
        }
        if (userAccount.getName() == null || !validateName(userAccount.getName())) {
            return false;
        }
        if (userAccount.getPassword() == null || !validatePassword(userAccount.getPassword())) {
            return false;
        }
        return userAccount.getRoles() >= 0 && userAccount.getRoles() <= ROLES_MAX_VALUE;
    }

    private boolean validateName(String name) {
        if (name == null) {
            return true;
        }
        if (name.length() < NAME_MIN_LENGTH || name.length() > NAME_MAX_LENGTH) {
            return false;
        }
        for (char letter : name.toCharArray()) {
            if (NAME_ALLOWED_CHARS.indexOf(letter) < 0) {
                return false;
            }
        }
        return true;
    }

    private boolean validatePassword(String password) {
        if (password == null) {
            return true;
        }
        if (password.length() < PASSWORD_MIN_LENGTH || password.length() > PASSWORD_MAX_LENGTH) {
            return false;
        }
        for (char letter : password.toCharArray()) {
            if (PASSWORD_ALLOWED_CHARS.indexOf(letter) < 0) {
                return false;
            }
        }
        return true;
    }

    private String generateId(EntityManager entityManager) {
        String id = UUID.randomUUID().toString();
        while (entityManager.find(UserAccount.class, id) != null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }

    private String generateRandomString(String pool, int length) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            result.append(pool.charAt((int) (Math.random() * pool.length())));
        }
        return result.toString();
    }

    private String hashPassword(String password, String salt) {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException error) {
            throw new RuntimeException();
        }
        byte[] bytes = digest.digest((password + salt).getBytes(StandardCharsets.UTF_8));
        return hexString(bytes);
    }

    private String hexString(byte[] bytes) {
        byte[] builder = new byte[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int b = Byte.toUnsignedInt(bytes[i]);
            builder[i * 2] = HEX_CHARS[b >>> 4];
            builder[i * 2 + 1] = HEX_CHARS[b & 0x0F];
        }
        return new String(builder, StandardCharsets.UTF_8);
    }
}
