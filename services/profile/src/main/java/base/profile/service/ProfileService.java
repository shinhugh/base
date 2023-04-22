package base.profile.service;

import base.profile.service.model.IllegalArgumentException;
import base.profile.service.model.*;

public interface ProfileService {
    Profile[] readProfiles(Authority authority, String accountId, String name) throws IllegalArgumentException;
    Profile createProfile(Authority authority, Profile profile) throws IllegalArgumentException, AccessDeniedException, ConflictException;
    Profile updateProfile(Authority authority, String accountId, Profile profile) throws IllegalArgumentException, AccessDeniedException, NotFoundException;
    void deleteProfile(Authority authority, String accountId) throws IllegalArgumentException, AccessDeniedException, NotFoundException;
}
