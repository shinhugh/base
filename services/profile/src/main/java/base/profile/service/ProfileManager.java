package base.profile.service;

import base.profile.repository.ProfileRepository;
import base.profile.service.model.IllegalArgumentException;
import base.profile.service.model.*;

import java.util.Map;
import java.util.UUID;

import static base.profile.Common.wrapException;

public class ProfileManager implements ProfileService {
    private static final short ROLES_MAX_VALUE = 255;
    private static final long TIME_MAX_VALUE = 4294967295L;
    private static final String NAME_ALLOWED_CHARS = "-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    private static final int NAME_MIN_LENGTH = 2;
    private static final int NAME_MAX_LENGTH = 16;
    private final ProfileRepository profileRepository;

    public ProfileManager(ProfileRepository profileRepository, Map<String, String> config) { // TODO: config currently unnecessary
        if (profileRepository == null) {
            throw new RuntimeException("Invalid profileRepository provided to ProfileManager constructor");
        }
        if (config == null || !validateConfig(config)) {
            throw new RuntimeException("Invalid config provided to ProfileManager constructor");
        }
        this.profileRepository = profileRepository;
    }

    @Override
    public Profile[] readProfiles(Authority authority, String id, String name) throws IllegalArgumentException, AccessDeniedException, NotFoundException {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (!validateUuid(id)) {
            throw new IllegalArgumentException();
        }
        if (!validateName(name)) {
            throw new IllegalArgumentException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        base.profile.repository.model.Profile[] matches;
        try {
            matches = profileRepository.readByIdAndName(id, name);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to read from profile store");
        }
        Profile[] output = new Profile[matches.length];
        for (int i = 0; i < matches.length; i++) {
            output[i] = new Profile(matches[i].getId(), matches[i].getName());
        }
        return output;
    }

    @Override
    public Profile createProfile(Authority authority, Profile profile) throws IllegalArgumentException, ConflictException {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (profile == null || !validateProfile(profile)) {
            throw new IllegalArgumentException();
        }
        base.profile.repository.model.Profile entry = new base.profile.repository.model.Profile(null, profile.getName());
        try {
            entry = profileRepository.create(entry);
        }
        catch (base.profile.repository.model.ConflictException e) {
            throw new ConflictException();
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to write to profile store");
        }
        return new Profile(entry.getId(), entry.getName());
    }

    @Override
    public Profile updateProfile(Authority authority, String id, String name, Profile profile) throws IllegalArgumentException, AccessDeniedException, NotFoundException, ConflictException {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (!validateUuid(id)) {
            throw new IllegalArgumentException();
        }
        if (!validateName(name)) {
            throw new IllegalArgumentException();
        }
        if (profile == null || !validateProfile(profile)) {
            throw new IllegalArgumentException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (!authorizedAsSystemOrAdmin && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        base.profile.repository.model.Profile[] matches;
        try {
            matches = profileRepository.readByIdAndName(id, name);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to read from profile store");
        }
        if (matches.length == 0) {
            throw new NotFoundException();
        }
        base.profile.repository.model.Profile match = matches[0];
        if (!authorizedAsSystemOrAdmin && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        base.profile.repository.model.Profile entry = new base.profile.repository.model.Profile(null, profile.getName());
        try {
            entry = profileRepository.updateByIdAndName(id, name, entry);
        }
        catch (base.profile.repository.model.ConflictException e) {
            throw new ConflictException();
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to write to profile store");
        }
        return new Profile(entry.getId(), entry.getName());
    }

    @Override
    public void deleteProfile(Authority authority, String id, String name) throws IllegalArgumentException, AccessDeniedException, NotFoundException {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (id == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (!validateUuid(id)) {
            throw new IllegalArgumentException();
        }
        if (!validateName(name)) {
            throw new IllegalArgumentException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (!authorizedAsSystemOrAdmin && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        base.profile.repository.model.Profile[] matches;
        try {
            matches = profileRepository.readByIdAndName(id, name);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to read from profile store");
        }
        if (matches.length == 0) {
            throw new NotFoundException();
        }
        base.profile.repository.model.Profile match = matches[0];
        if (!authorizedAsSystemOrAdmin && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        try {
            profileRepository.deleteByIdAndName(id, name);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to write to profile store");
        }
    }

    private static boolean validateConfig(Map<String, String> config) {
        if (config == null) {
            return true;
        }
        // TODO: Implement
        return true;
    }

    private static boolean validateUuid(String id) {
        if (id == null) {
            return true;
        }
        try {
            UUID.fromString(id);
        }
        catch (Exception e) {
            return false;
        }
        return true;
    }

    private static boolean validateAuthority(Authority authority) {
        if (authority == null) {
            return true;
        }
        if (authority.getId() != null && !validateUuid(authority.getId())) {
            return false;
        }
        if (authority.getRoles() < 0 || authority.getRoles() > ROLES_MAX_VALUE) {
            return false;
        }
        return authority.getAuthTime() >= 0 && authority.getAuthTime() <= TIME_MAX_VALUE;
    }

    private static boolean validateName(String name) {
        if (name == null) {
            return true;
        }
        if (name.length() < NAME_MIN_LENGTH || name.length() > NAME_MAX_LENGTH) {
            return false;
        }
        for (char letter : name.toCharArray()) {
            if (NAME_ALLOWED_CHARS.indexOf(letter) < 0) {
                return false;
            }
        }
        return true;
    }

    private static boolean validateProfile(Profile profile) {
        if (profile == null) {
            return true;
        }
        return profile.getName() != null && validateName(profile.getName());
    }

    private static boolean verifyAuthorityContainsAtLeastOneRole(Authority authority, short roles) {
        if (roles == 0) {
            return true;
        }
        if (authority == null) {
            return false;
        }
        return (authority.getRoles() & roles) != 0;
    }
}
