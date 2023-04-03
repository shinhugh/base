package base.useraccount.server.service;

import base.useraccount.server.model.*;
import jakarta.persistence.*;

import java.lang.IllegalArgumentException;
import java.util.UUID;

public class UserAccountManager implements UserAccountService {
    private static final int ID_LENGTH = 36;
    private static final int NAME_MIN_LENGTH = 4;
    private static final int NAME_MAX_LENGTH = 16;
    private static final int PASSWORD_HASH_LENGTH = 64; // TODO: Password hash length
    private static final int PASSWORD_SALT_LENGTH = 32;
    private static final short MAX_ROLES = 255;
    private final EntityManagerFactory entityManagerFactory;

    public UserAccountManager() {
        JpaPropertiesService jpaPropertiesService = new JpaPropertiesManager();
        entityManagerFactory = Persistence.createEntityManagerFactory("base", jpaPropertiesService.generateProperties());
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
        if (authority == null || (authority.getRoles() & (1 | 2 | 4)) == 0) { // TODO: Don't hard-code role values
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = (authority.getRoles() & (2 | 4)) == 0; // TODO: Don't hard-code role values
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (id == null) {
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
        if (authority == null || (authority.getRoles() & (1 | 2 | 4)) == 0) { // TODO: Don't hard-code role values
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = (authority.getRoles() & (2 | 4)) == 0; // TODO: Don't hard-code role values
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (name == null) {
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
        // TODO
        throw new RuntimeException("Not implemented");
    }

    @Override
    public void deleteById(Authority authority, String id) {
        // TODO
        throw new RuntimeException("Not implemented");
    }

    private boolean detectInvalidUserAccountInput(UserAccount userAccount) {
        if (userAccount == null) {
            return true;
        }
        if (userAccount.getName() == null || userAccount.getName().length() < NAME_MIN_LENGTH || userAccount.getName().length() > NAME_MAX_LENGTH) {
            return true;
        }
        if (userAccount.getPasswordHash() == null || userAccount.getPasswordHash().length() != PASSWORD_HASH_LENGTH) {
            return true;
        }
        if (userAccount.getPasswordSalt() == null || userAccount.getPasswordSalt().length() != PASSWORD_SALT_LENGTH) {
            return true;
        }
        return userAccount.getRoles() < 0 || userAccount.getRoles() > MAX_ROLES;
    }

    private String generateId(EntityManager entityManager) {
        String id = UUID.randomUUID().toString();
        while (entityManager.find(UserAccount.class, id) != null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }
}
