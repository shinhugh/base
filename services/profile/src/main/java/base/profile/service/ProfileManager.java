package base.profile.service;

import base.profile.repository.ProfileRepository;
import base.profile.service.model.IllegalArgumentException;
import base.profile.service.model.*;

import java.util.UUID;

import static base.profile.Common.wrapException;

public class ProfileManager implements ProfileService {
    private static final short ROLES_MAX_VALUE = 255;
    private static final long TIME_MAX_VALUE = 4294967295L;
    private static final String NAME_ALLOWED_CHARS = "-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    private static final int NAME_MIN_LENGTH = 2;
    private static final int NAME_MAX_LENGTH = 16;
    private final ProfileRepository profileRepository;
    private final AccountServiceClient accountServiceClient;

    public ProfileManager(ProfileRepository profileRepository, AccountServiceClient accountServiceClient) {
        if (profileRepository == null) {
            throw new RuntimeException("Invalid profileRepository provided to ProfileManager constructor");
        }
        if (accountServiceClient == null) {
            throw new RuntimeException("Invalid accountServiceClient provided to ProfileManager constructor");
        }
        this.profileRepository = profileRepository;
        this.accountServiceClient = accountServiceClient;
    }

    @Override
    public Profile[] readProfiles(Authority authority, String accountId, String name) throws IllegalArgumentException {
        accountId = accountId == null ? null : accountId.toLowerCase();
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (accountId == null && name == null) {
            throw new IllegalArgumentException();
        }
        if (!validateId(accountId)) {
            throw new IllegalArgumentException();
        }
        if (!validateName(name)) {
            throw new IllegalArgumentException();
        }
        base.profile.repository.model.Profile[] matches;
        try {
            matches = profileRepository.readByAccountIdAndName(accountId, name);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to read from profile store");
        }
        Profile[] output = new Profile[matches.length];
        for (int i = 0; i < matches.length; i++) {
            output[i] = new Profile(matches[i].getAccountId(), matches[i].getName());
        }
        return output;
    }

    @Override
    public Profile createProfile(Authority authority, Profile profile) throws IllegalArgumentException, AccessDeniedException, ConflictException {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (profile == null || !validateProfile(profile, true)) {
            throw new IllegalArgumentException();
        }
        boolean authorizedAsSystemOrUserOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN));
        if (!authorizedAsSystemOrUserOrAdmin) {
            throw new AccessDeniedException();
        }
        boolean authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (!authorizedAsSystemOrAdmin && !profile.getAccountId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        boolean accountExists;
        try {
            accountExists = accountServiceClient.checkForAccountExistence(authority, profile.getAccountId());
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to invoke account service");
        }
        if (!accountExists) {
            throw new IllegalArgumentException();
        }
        base.profile.repository.model.Profile entry = new base.profile.repository.model.Profile(profile.getAccountId(), profile.getName());
        try {
            entry = profileRepository.create(entry);
        }
        catch (base.profile.repository.model.ConflictException e) {
            throw new ConflictException();
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to write to profile store");
        }
        return new Profile(entry.getAccountId(), entry.getName());
    }

    @Override
    public Profile updateProfile(Authority authority, String accountId, Profile profile) throws IllegalArgumentException, AccessDeniedException, NotFoundException {
        accountId = accountId == null ? null : accountId.toLowerCase();
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (accountId == null || !validateId(accountId)) {
            throw new IllegalArgumentException();
        }
        if (profile == null || !validateProfile(profile, false)) {
            throw new IllegalArgumentException();
        }
        boolean authorizedAsSystemOrUserOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN));
        if (!authorizedAsSystemOrUserOrAdmin) {
            throw new AccessDeniedException();
        }
        base.profile.repository.model.Profile[] matches;
        try {
            matches = profileRepository.readByAccountId(accountId);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to read from profile store");
        }
        if (matches.length == 0) {
            throw new NotFoundException();
        }
        base.profile.repository.model.Profile match = matches[0];
        boolean authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (!authorizedAsSystemOrAdmin && !match.getAccountId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        base.profile.repository.model.Profile entry = new base.profile.repository.model.Profile(null, profile.getName());
        try {
            entry = profileRepository.updateByAccountId(accountId, entry);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to write to profile store");
        }
        return new Profile(entry.getAccountId(), entry.getName());
    }

    @Override
    public void deleteProfile(Authority authority, String accountId) throws IllegalArgumentException, AccessDeniedException, NotFoundException {
        accountId = accountId == null ? null : accountId.toLowerCase();
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (accountId == null || !validateId(accountId)) {
            throw new IllegalArgumentException();
        }
        boolean authorizedAsSystemOrUserOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN));
        if (!authorizedAsSystemOrUserOrAdmin) {
            throw new AccessDeniedException();
        }
        base.profile.repository.model.Profile[] matches;
        try {
            matches = profileRepository.readByAccountId(accountId);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to read from profile store");
        }
        if (matches.length == 0) {
            throw new NotFoundException();
        }
        base.profile.repository.model.Profile match = matches[0];
        boolean authorizedAsSystemOrAdmin = verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (!authorizedAsSystemOrAdmin && !match.getAccountId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        try {
            profileRepository.deleteByAccountId(accountId);
        }
        catch (Exception e) {
            throw wrapException(e, "Failed to write to profile store");
        }
    }

    private static boolean validateId(String id) {
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
        if (authority.getId() != null && !validateId(authority.getId())) {
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

    private static boolean validateProfile(Profile profile, boolean validateAccountId) {
        if (profile == null) {
            return true;
        }
        if (validateAccountId && (profile.getAccountId() == null || !validateId(profile.getAccountId()))) {
            return false;
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
