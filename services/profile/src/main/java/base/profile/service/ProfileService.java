package base.profile.service;

import base.profile.service.model.IllegalArgumentException;
import base.profile.service.model.*;

public interface ProfileService {
    Profile[] readProfiles(Authority authority, String id, String name) throws IllegalArgumentException, AccessDeniedException, NotFoundException;
    Profile createProfile(Authority authority, Profile profile) throws IllegalArgumentException, ConflictException;
    Profile updateProfile(Authority authority, String id, String name, Profile profile) throws IllegalArgumentException, AccessDeniedException, NotFoundException, ConflictException;
    void deleteProfile(Authority authority, String id, String name) throws IllegalArgumentException, AccessDeniedException, NotFoundException;
}
