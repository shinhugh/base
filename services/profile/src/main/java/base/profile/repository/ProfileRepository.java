package base.profile.repository;

import base.profile.repository.model.ConflictException;
import base.profile.repository.model.IllegalArgumentException;
import base.profile.repository.model.NotFoundException;
import base.profile.repository.model.Profile;

public interface ProfileRepository {
    Profile[] readByIdAndName(String id, String name) throws IllegalArgumentException;
    Profile create(Profile profile) throws IllegalArgumentException, ConflictException;
    Profile updateByIdAndName(String id, String name, Profile profile) throws IllegalArgumentException, NotFoundException, ConflictException;
    int deleteByIdAndName(String id, String name) throws IllegalArgumentException;
}
