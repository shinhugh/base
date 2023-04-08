package base.useraccount.repository;

import base.useraccount.model.ConflictException;
import base.useraccount.model.IllegalArgumentException;
import base.useraccount.model.NotFoundException;
import base.useraccount.model.UserAccount;
import jakarta.persistence.*;

import java.util.Map;
import java.util.UUID;

public class UserAccountJpaRepository implements UserAccountRepository {
    private static final int ID_MAX_LENGTH = 36;
    private static final int NAME_MAX_LENGTH = 32;
    private static final int PASSWORD_HASH_MAX_LENGTH = 64;
    private static final int PASSWORD_SALT_MAX_LENGTH = 32;
    private static final short ROLES_MAX_VALUE = 255;
    private final EntityManagerFactory entityManagerFactory;

    public UserAccountJpaRepository(Map<String, String> databaseInfo) {
        if (databaseInfo == null) {
            throw new RuntimeException();
        }
        entityManagerFactory = Persistence.createEntityManagerFactory("base", databaseInfo);
    }

    @Override
    public UserAccount read(String id, String name) {
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (id != null && id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from UserAccount as x where ";
        boolean filterAdded = false;
        if (id != null) {
            queryString += "x.id = :id";
            filterAdded = true;
        }
        if (name != null) {
            if (filterAdded) {
                queryString += " and ";
            }
            queryString += "x.name = :name";
        }
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            UserAccount match = null;
            entityManager.getTransaction().begin();
            TypedQuery<UserAccount> query = entityManager.createQuery(queryString, UserAccount.class);
            if (id != null) {
                query.setParameter("id", id);
            }
            if (name != null) {
                query.setParameter("name", name);
            }
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
    public UserAccount create(UserAccount userAccount) {
        if (userAccount == null || !validateUserAccount(userAccount)) {
            throw new IllegalArgumentException();
        }
        UserAccount entry = new UserAccount(null, userAccount.getName(), null, userAccount.getPasswordHash(), userAccount.getPasswordSalt(), userAccount.getRoles());
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            UserAccount conflict = null;
            entityManager.getTransaction().begin();
            TypedQuery<UserAccount> query = entityManager.createQuery("from UserAccount as x where x.name = :name", UserAccount.class);
            try {
                conflict = query.setParameter("name", userAccount.getName()).getSingleResult();
            }
            catch (NoResultException ignored) { }
            if (conflict != null) {
                entityManager.getTransaction().rollback();
                throw new ConflictException();
            }
            entry.setId(generateId(entityManager));
            entityManager.merge(entry);
            entityManager.getTransaction().commit();
            return entry;
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public UserAccount update(String id, String name, UserAccount userAccount) {
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (id != null && id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from UserAccount as x where ";
        boolean filterAdded = false;
        if (id != null) {
            queryString += "x.id = :id";
            filterAdded = true;
        }
        if (name != null) {
            if (filterAdded) {
                queryString += " and ";
            }
            queryString += "x.name = :name";
        }
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            UserAccount match = null;
            entityManager.getTransaction().begin();
            TypedQuery<UserAccount> query = entityManager.createQuery(queryString, UserAccount.class);
            if (id != null) {
                query.setParameter("id", id);
            }
            if (name != null) {
                query.setParameter("name", name);
            }
            try {
                match = query.getSingleResult();
            }
            catch (NoResultException ignored) { }
            if (match == null) {
                entityManager.getTransaction().rollback();
                throw new NotFoundException();
            }
            if (userAccount == null || !validateUserAccount(userAccount)) {
                entityManager.getTransaction().rollback();
                throw new IllegalArgumentException();
            }
            UserAccount conflict = null;
            query = entityManager.createQuery("from UserAccount as x where x.name = :name", UserAccount.class);
            try {
                conflict = query.setParameter("name", userAccount.getName()).getSingleResult();
            }
            catch (NoResultException ignored) { }
            if (conflict != null) {
                entityManager.getTransaction().rollback();
                throw new ConflictException();
            }
            match.setName(userAccount.getName());
            match.setPasswordHash(userAccount.getPasswordHash());
            match.setPasswordSalt(userAccount.getPasswordSalt());
            match.setRoles(userAccount.getRoles());
            entityManager.getTransaction().commit();
            return match;
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public void delete(String id, String name) {
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (id != null && id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from UserAccount as x where ";
        boolean filterAdded = false;
        if (id != null) {
            queryString += "x.id = :id";
            filterAdded = true;
        }
        if (name != null) {
            if (filterAdded) {
                queryString += " and ";
            }
            queryString += "x.name = :name";
        }
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            UserAccount match = null;
            entityManager.getTransaction().begin();
            TypedQuery<UserAccount> query = entityManager.createQuery(queryString, UserAccount.class);
            if (id != null) {
                query.setParameter("id", id);
            }
            if (name != null) {
                query.setParameter("name", name);
            }
            try {
                match = query.getSingleResult();
            }
            catch (NoResultException ignored) { }
            if (match == null) {
                entityManager.getTransaction().rollback();
                return;
            }
            entityManager.remove(match);
            entityManager.getTransaction().commit();
        }
        finally {
            entityManager.close();
        }
    }

    private static boolean validateUserAccount(UserAccount userAccount) {
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

    private static String generateId(EntityManager entityManager) {
        String id = UUID.randomUUID().toString();
        while (entityManager.find(UserAccount.class, id) != null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }
}
