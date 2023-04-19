package base.profile.repository;

import base.profile.repository.model.ConflictException;
import base.profile.repository.model.IllegalArgumentException;
import base.profile.repository.model.NotFoundException;
import base.profile.repository.model.Profile;

public interface ProfileRepository {
    Profile[] readByAccountId(String accountId) throws IllegalArgumentException;
    Profile[] readByAccountIdAndName(String accountId, String name) throws IllegalArgumentException;
    Profile create(Profile profile) throws IllegalArgumentException, ConflictException;
    Profile updateByAccountId(String accountId, Profile profile) throws IllegalArgumentException, NotFoundException;
    int deleteByAccountId(String accountId) throws IllegalArgumentException;
}
