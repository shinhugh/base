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
import java.util.UUID;

import static base.profile.Common.wrapException;

public class ProfileJpaRepository implements ProfileRepository {
    private static final int ID_MAX_LENGTH = 36;
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
    public Profile[] readByIdAndName(String id, String name) throws IllegalArgumentException {
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (id != null && id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Profile as x where ";
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
            TypedQuery<Profile> query = entityManager.createQuery(queryString, Profile.class);
            if (id != null) {
                query.setParameter("id", id);
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
        if (profile == null || !validateProfile(profile)) {
            throw new IllegalArgumentException();
        }
        Profile entry = new Profile(null, profile.getName());
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            Profile conflict = null;
            entityManager.getTransaction().begin();
            TypedQuery<Profile> query = entityManager.createQuery("from Profile as x where x.name = :name", Profile.class);
            try {
                conflict = query.setParameter("name", profile.getName()).getSingleResult();
            }
            catch (Exception ignored) { }
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
            throw wrapException(e, "Failed to execute database transaction");
        }
        finally {
            entityManager.close();
        }
    }

    @Override
    public Profile updateByIdAndName(String id, String name, Profile profile) throws IllegalArgumentException, NotFoundException, ConflictException {
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (id != null && id.length() > ID_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalArgumentException();
        }
        if (profile == null || !validateProfile(profile)) {
            throw new IllegalArgumentException();
        }
        String queryString = "from Profile as x where ";
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
            Profile match = null;
            entityManager.getTransaction().begin();
            TypedQuery<Profile> query = entityManager.createQuery(queryString, Profile.class);
            if (id != null) {
                query.setParameter("id", id);
            }
            if (name != null) {
                query.setParameter("name", name);
            }
            try {
                match = query.getSingleResult();
            }
            catch (Exception ignored) { }
            if (match == null) {
                entityManager.getTransaction().rollback();
                throw new NotFoundException();
            }
            Profile conflict = null;
            query = entityManager.createQuery("from Profile as x where x.name = :name", Profile.class);
            try {
                conflict = query.setParameter("name", profile.getName()).getSingleResult();
            }
            catch (Exception ignored) { }
            if (conflict != null && !match.getId().equals(conflict.getId())) {
                entityManager.getTransaction().rollback();
                throw new ConflictException();
            }
            match.setName(profile.getName());
            entityManager.getTransaction().commit();
            return match;
        }
        catch (NotFoundException | ConflictException e) {
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
        String queryString = "from Profile as x where ";
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
            TypedQuery<Profile> query = entityManager.createQuery(queryString, Profile.class);
            if (id != null) {
                query.setParameter("id", id);
            }
            if (name != null) {
                query.setParameter("name", name);
            }
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

    private static boolean validateProfile(Profile profile) {
        if (profile == null) {
            return true;
        }
        return profile.getName() != null && profile.getName().length() <= NAME_MAX_LENGTH;
    }

    private static String generateId(EntityManager entityManager) {
        String id = UUID.randomUUID().toString();
        while (entityManager.find(Profile.class, id) != null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }
}
