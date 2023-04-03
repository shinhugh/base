package base.useraccount.server.service;

import base.useraccount.server.model.IllegalArgumentException;
import base.useraccount.server.model.*;
import jakarta.persistence.*;

import java.util.Map;
import java.util.UUID;

public class UserAccountManager implements UserAccountService {
    private static final int ID_MAX_LENGTH = 36;
    private static final int NAME_MAX_LENGTH = 32;
    private static final int PASSWORD_HASH_MAX_LENGTH = 64;
    private static final int PASSWORD_SALT_MAX_LENGTH = 32;
    private static final short ROLES_MAX_VALUE = 255;
    private final EntityManagerFactory entityManagerFactory;

    public UserAccountManager(Map<String, String> databaseInfo) {
        if (databaseInfo == null) {
            throw new IllegalArgumentException();
        }
        entityManagerFactory = Persistence.createEntityManagerFactory("base", databaseInfo);
    }

    @Override
    public String create(Authority authority, UserAccount userAccount) {
        if (detectInvalidUserAccountInput(userAccount)) {
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
        if (authority == null || (authority.getRoles() & (Role.SYSTEM.getBitFlag() | Role.USER.getBitFlag() | Role.ADMIN.getBitFlag())) == 0) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = (authority.getRoles() & (Role.SYSTEM.getBitFlag() | Role.ADMIN.getBitFlag())) == 0;
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (id == null || id.length() > ID_MAX_LENGTH) {
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
        if (authority == null || (authority.getRoles() & (Role.SYSTEM.getBitFlag() | Role.USER.getBitFlag() | Role.ADMIN.getBitFlag())) == 0) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = (authority.getRoles() & (Role.SYSTEM.getBitFlag() | Role.ADMIN.getBitFlag())) == 0;
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
        if (authority == null || (authority.getRoles() & (Role.SYSTEM.getBitFlag() | Role.USER.getBitFlag() | Role.ADMIN.getBitFlag())) == 0) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = (authority.getRoles() & (Role.SYSTEM.getBitFlag() | Role.ADMIN.getBitFlag())) == 0;
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (id == null || id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (onlyAuthorizedAsUser && !id.equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        if (detectInvalidUserAccountInput(userAccount)) {
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
        if (authority == null || (authority.getRoles() & (Role.SYSTEM.getBitFlag() | Role.USER.getBitFlag() | Role.ADMIN.getBitFlag())) == 0) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = (authority.getRoles() & (Role.SYSTEM.getBitFlag() | Role.ADMIN.getBitFlag())) == 0;
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (id == null || id.length() > ID_MAX_LENGTH) {
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

    private boolean detectInvalidUserAccountInput(UserAccount userAccount) {
        if (userAccount == null) {
            return true;
        }
        if (userAccount.getName() == null || userAccount.getName().length() > NAME_MAX_LENGTH) {
            return true;
        }
        if (userAccount.getPasswordHash() == null || userAccount.getPasswordHash().length() > PASSWORD_HASH_MAX_LENGTH) {
            return true;
        }
        if (userAccount.getPasswordSalt() == null || userAccount.getPasswordSalt().length() > PASSWORD_SALT_MAX_LENGTH) {
            return true;
        }
        return userAccount.getRoles() < 0 || userAccount.getRoles() > ROLES_MAX_VALUE;
    }

    private String generateId(EntityManager entityManager) {
        String id = UUID.randomUUID().toString();
        while (entityManager.find(UserAccount.class, id) != null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }
}
