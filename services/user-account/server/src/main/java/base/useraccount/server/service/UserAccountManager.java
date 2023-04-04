package base.useraccount.server.service;

import base.useraccount.server.model.IllegalArgumentException;
import base.useraccount.server.model.*;
import jakarta.persistence.*;

import java.util.Map;
import java.util.UUID;

public class UserAccountManager implements UserAccountService {
    private static final int ID_LENGTH = 36;
    private static final short ROLES_MAX_VALUE = 255;
    private static final int NAME_MAX_LENGTH = 32;
    private static final int PASSWORD_HASH_MAX_LENGTH = 64;
    private static final int PASSWORD_SALT_MAX_LENGTH = 32;
    private final EntityManagerFactory entityManagerFactory;

    public UserAccountManager(Map<String, String> databaseInfo) {
        if (databaseInfo == null) {
            throw new IllegalArgumentException();
        }
        entityManagerFactory = Persistence.createEntityManagerFactory("base", databaseInfo);
    }

    @Override
    public String create(Authority authority, UserAccount userAccount) {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (userAccount == null || !validateUserAccount(userAccount)) {
            throw new IllegalArgumentException();
        }
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
            UserAccount entry = new UserAccount(generateId(entityManager), userAccount.getName(), userAccount.getPasswordHash(), userAccount.getPasswordSalt(), userAccount.getRoles());
            entityManager.merge(entry);
            entityManager.getTransaction().commit();
            return entry.getId();
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
        if (id == null || id.length() > ID_LENGTH) {
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
        if (name == null || name.length() > NAME_MAX_LENGTH) {
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
            return match;
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public void updateById(Authority authority, String id, UserAccount userAccount) {
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
        if (id == null || id.length() > ID_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (onlyAuthorizedAsUser && !id.equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        if (userAccount == null || !validateUserAccount(userAccount)) {
            throw new IllegalArgumentException();
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
            if (match == null) {
                entityManager.getTransaction().rollback();
                throw new NotFoundException();
            }
            match.setName(userAccount.getName());
            match.setPasswordHash(userAccount.getPasswordHash());
            match.setPasswordSalt(userAccount.getPasswordSalt());
            match.setRoles(userAccount.getRoles());
            entityManager.getTransaction().commit();
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
        if (id == null || id.length() > ID_LENGTH) {
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

    private boolean validateAuthority(Authority authority) {
        if (authority == null) {
            return true;
        }
        if (authority.getId() != null && authority.getId().length() != ID_LENGTH) {
            return false;
        }
        return authority.getRoles() >= 0 && authority.getRoles() <= ROLES_MAX_VALUE;
    }

    private boolean validateUserAccount(UserAccount userAccount) {
        if (userAccount == null) {
            return true;
        }
        if (userAccount.getName() == null || userAccount.getName().length() > NAME_MAX_LENGTH) {
            return false;
        }
        if (userAccount.getPasswordHash() == null || userAccount.getPasswordHash().length() > PASSWORD_HASH_MAX_LENGTH) {
            return false;
        }
        if (userAccount.getPasswordSalt() == null || userAccount.getPasswordSalt().length() > PASSWORD_SALT_MAX_LENGTH) {
            return false;
        }
        return userAccount.getRoles() >= 0 && userAccount.getRoles() <= ROLES_MAX_VALUE;
    }

    private String generateId(EntityManager entityManager) {
        String id = UUID.randomUUID().toString();
        while (entityManager.find(UserAccount.class, id) != null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }
}
