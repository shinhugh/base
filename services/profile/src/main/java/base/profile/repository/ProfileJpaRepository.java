package base.profile.repository;

import base.profile.repository.model.ConflictException;
import base.profile.repository.model.IllegalArgumentException;
import base.profile.repository.model.NotFoundException;
import base.profile.repository.model.Profile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.Map;

import static base.profile.Common.wrapException;

public class ProfileJpaRepository implements ProfileRepository {
    private static final int ACCOUNT_ID_MAX_LENGTH = 36;
    private static final int NAME_MAX_LENGTH = 16;
    private final EntityManagerFactory entityManagerFactory;

    public ProfileJpaRepository(Map<String, String> config) {
        if (config == null) {
            throw new RuntimeException("Invalid config provided to ProfileJpaRepository constructor");
        }
        try {
            entityManagerFactory = Persistence.createEntityManagerFactory("base", config);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to connect to database");
        }
    }

    @Override
    public Profile[] readByAccountId(String accountId) throws IllegalArgumentException {
        if (accountId == null || accountId.length() > ACCOUNT_ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Profile as x where x.accountId = :accountId";
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            entityManager.getTransaction().begin();
            TypedQuery<Profile> query = entityManager.createQuery(queryString, Profile.class);
            query.setParameter("accountId", accountId);
            List<Profile> matches = query.getResultList();
            entityManager.getTransaction().rollback();
            return matches.toArray(new Profile[0]);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to execute database transaction");
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public Profile[] readByAccountIdAndName(String accountId, String name) throws IllegalArgumentException {
        if (accountId == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (accountId != null && accountId.length() > ACCOUNT_ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Profile as x where ";
        boolean filterAdded = false;
        if (accountId != null) {
            queryString += "x.accountId = :accountId";
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
            TypedQuery<Profile> query = entityManager.createQuery(queryString, Profile.class);
            if (accountId != null) {
                query.setParameter("accountId", accountId);
            }
            if (name != null) {
                query.setParameter("name", name);
            }
            List<Profile> matches = query.getResultList();
            entityManager.getTransaction().rollback();
            return matches.toArray(new Profile[0]);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to execute database transaction");
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public Profile create(Profile profile) throws IllegalArgumentException, ConflictException {
        if (profile == null || !validateProfile(profile, true)) {
            throw new IllegalArgumentException();
        }
        Profile entry = new Profile(profile.getAccountId(), profile.getName());
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            Profile conflict = null;
            entityManager.getTransaction().begin();
            TypedQuery<Profile> query = entityManager.createQuery("from Profile as x where x.accountId = :accountId", Profile.class);
            try {
                conflict = query.setParameter("accountId", profile.getAccountId()).getSingleResult();
            }
            catch (Exception ignored) { }
            if (conflict != null) {
                entityManager.getTransaction().rollback();
                throw new ConflictException();
            }
            entityManager.merge(entry);
            entityManager.getTransaction().commit();
            return entry;
        }
        catch (ConflictException e) {
            throw e;
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to execute database transaction");
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public Profile updateByAccountId(String accountId, Profile profile) throws IllegalArgumentException, NotFoundException {
        if (accountId == null || accountId.length() > ACCOUNT_ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (profile == null || !validateProfile(profile, false)) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Profile as x where x.accountId = :accountId";
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            Profile match = null;
            entityManager.getTransaction().begin();
            TypedQuery<Profile> query = entityManager.createQuery(queryString, Profile.class);
            query.setParameter("accountId", accountId);
            try {
                match = query.getSingleResult();
            }
            catch (Exception ignored) { }
            if (match == null) {
                entityManager.getTransaction().rollback();
                throw new NotFoundException();
            }
            match.setName(profile.getName());
            entityManager.getTransaction().commit();
            return match;
        }
        catch (NotFoundException e) {
            throw e;
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to execute database transaction");
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public int deleteByAccountId(String accountId) throws IllegalArgumentException {
        if (accountId == null || accountId.length() > ACCOUNT_ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Profile as x where x.accountId = :accountId";
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            entityManager.getTransaction().begin();
            TypedQuery<Profile> query = entityManager.createQuery(queryString, Profile.class);
            query.setParameter("accountId", accountId);
            List<Profile> matches = query.getResultList();
            for (Profile match : matches) {
                entityManager.remove(match);
            }
            entityManager.getTransaction().commit();
            return matches.size();
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to execute database transaction");
        }
        finally {
            entityManager.close();
        }
    }

    private static boolean validateProfile(Profile profile, boolean validateAccountId) {
        if (profile == null) {
            return true;
        }
        if (validateAccountId && (profile.getAccountId() == null || profile.getAccountId().length() > ACCOUNT_ID_MAX_LENGTH)) {
            return false;
        }
        return profile.getName() != null && profile.getName().length() <= NAME_MAX_LENGTH;
    }
}
