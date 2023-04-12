package base.account.repository;

import base.account.repository.model.Account;
import base.account.repository.model.ConflictException;
import base.account.repository.model.IllegalArgumentException;
import base.account.repository.model.NotFoundException;
import jakarta.persistence.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AccountJpaRepository implements AccountRepository {
    private static final int ID_MAX_LENGTH = 36;
    private static final int NAME_MAX_LENGTH = 32;
    private static final int PASSWORD_HASH_MAX_LENGTH = 64;
    private static final int PASSWORD_SALT_MAX_LENGTH = 32;
    private static final short ROLES_MAX_VALUE = 255;
    private final EntityManagerFactory entityManagerFactory;

    public AccountJpaRepository(Map<String, String> config) {
        if (config == null) {
            throw new RuntimeException("Invalid config provided to AccountJpaRepository constructor");
        }
        try {
            entityManagerFactory = Persistence.createEntityManagerFactory("base", config);
        }
        catch (Exception e) {
            throw new RuntimeException("Connection to database failed");
        }
    }

    @Override
    public Account[] readByIdAndName(String id, String name) throws IllegalArgumentException {
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (id != null && id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Account as x where ";
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
            entityManager.getTransaction().begin();
            TypedQuery<Account> query = entityManager.createQuery(queryString, Account.class);
            if (id != null) {
                query.setParameter("id", id);
            }
            if (name != null) {
                query.setParameter("name", name);
            }
            List<Account> matches = query.getResultList();
            entityManager.getTransaction().rollback();
            return matches.toArray(new Account[0]);
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception when querying database");
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public Account create(Account account) throws IllegalArgumentException, ConflictException {
        if (account == null || !validateAccount(account)) {
            throw new IllegalArgumentException();
        }
        Account entry = new Account(null, account.getName(), account.getPasswordHash(), account.getPasswordSalt(), account.getRoles());
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            Account conflict = null;
            entityManager.getTransaction().begin();
            TypedQuery<Account> query = entityManager.createQuery("from Account as x where x.name = :name", Account.class);
            try {
                conflict = query.setParameter("name", account.getName()).getSingleResult();
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
        catch (ConflictException e) {
            throw e;
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception when querying database");
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public Account updateByIdAndName(String id, String name, Account account) throws IllegalArgumentException, NotFoundException, ConflictException {
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (id != null && id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (account == null || !validateAccount(account)) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Account as x where ";
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
            Account match = null;
            entityManager.getTransaction().begin();
            TypedQuery<Account> query = entityManager.createQuery(queryString, Account.class);
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
            Account conflict = null;
            query = entityManager.createQuery("from Account as x where x.name = :name", Account.class);
            try {
                conflict = query.setParameter("name", account.getName()).getSingleResult();
            }
            catch (NoResultException ignored) { }
            if (conflict != null) {
                entityManager.getTransaction().rollback();
                throw new ConflictException();
            }
            match.setName(account.getName());
            match.setPasswordHash(account.getPasswordHash());
            match.setPasswordSalt(account.getPasswordSalt());
            match.setRoles(account.getRoles());
            entityManager.getTransaction().commit();
            return match;
        }
        catch (NotFoundException | ConflictException e) {
            throw e;
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception when querying database");
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public int deleteByIdAndName(String id, String name) throws IllegalArgumentException {
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (id != null && id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Account as x where ";
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
            entityManager.getTransaction().begin();
            TypedQuery<Account> query = entityManager.createQuery(queryString, Account.class);
            if (id != null) {
                query.setParameter("id", id);
            }
            if (name != null) {
                query.setParameter("name", name);
            }
            List<Account> matches = query.getResultList();
            for (Account match : matches) {
                entityManager.remove(match);
            }
            entityManager.getTransaction().commit();
            return matches.size();
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception when querying database");
        }
        finally {
            entityManager.close();
        }
    }

    private static boolean validateAccount(Account account) {
        if (account == null) {
            return true;
        }
        if (account.getName() == null || account.getName().length() > NAME_MAX_LENGTH) {
            return false;
        }
        if (account.getPasswordHash() == null || account.getPasswordHash().length() > PASSWORD_HASH_MAX_LENGTH) {
            return false;
        }
        if (account.getPasswordSalt() == null || account.getPasswordSalt().length() > PASSWORD_SALT_MAX_LENGTH) {
            return false;
        }
        return account.getRoles() >= 0 && account.getRoles() <= ROLES_MAX_VALUE;
    }

    private static String generateId(EntityManager entityManager) {
        String id = UUID.randomUUID().toString();
        while (entityManager.find(Account.class, id) != null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }
}
