package base.useraccount.service;

import base.useraccount.model.IllegalArgumentException;
import base.useraccount.model.*;
import base.useraccount.repository.UserAccountRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Security;
import java.util.Map;
import java.util.UUID;

public class UserAccountManager implements UserAccountService {
    private static final short ROLES_MAX_VALUE = 255;
    private static final long TIME_MAX_VALUE = 4294967295L;
    private static final String NAME_ALLOWED_CHARS = "-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    private static final int NAME_MIN_LENGTH = 4;
    private static final int NAME_MAX_LENGTH = 32;
    private static final String PASSWORD_ALLOWED_CHARS = " !\\\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
    private static final int PASSWORD_MIN_LENGTH = 8;
    private static final int PASSWORD_MAX_LENGTH = 32;
    private static final String PASSWORD_SALT_ALLOWED_CHARS = PASSWORD_ALLOWED_CHARS;
    private static final int PASSWORD_SALT_LENGTH = 32;
    private static final byte[] HEX_CHARS = "0123456789abcdef".getBytes(StandardCharsets.US_ASCII);
    private final UserAccountRepository userAccountRepository;
    private final AuthenticationServiceClient authenticationServiceClient;
    private final MessageDigest digest;

    public UserAccountManager(UserAccountRepository userAccountRepository, AuthenticationServiceClient authenticationServiceClient, Map<String, String> passwordHashConfig) {
        if (userAccountRepository == null) {
            throw new RuntimeException();
        }
        if (authenticationServiceClient == null) {
            throw new RuntimeException();
        }
        if (passwordHashConfig == null || !validatePasswordHashConfig(passwordHashConfig)) {
            throw new RuntimeException();
        }
        this.userAccountRepository = userAccountRepository;
        this.authenticationServiceClient = authenticationServiceClient;
        try {
            digest = MessageDigest.getInstance(passwordHashConfig.get("algorithm"));
        } catch (NoSuchAlgorithmException error) {
            throw new RuntimeException();
        }
    }

    @Override
    public UserAccount read(Authority authority, String id, String name) {
        if (!validateAuthority(authority)) {
            throw new RuntimeException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
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
        UserAccount[] matches = userAccountRepository.readByIdAndName(id, name);
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        UserAccount match = matches[0];
        if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
            match.setPasswordHash(null);
            match.setPasswordSalt(null);
        }
        return match;
    }

    @Override
    public UserAccount create(Authority authority, UserAccount userAccount) {
        if (!validateAuthority(authority)) {
            throw new RuntimeException();
        }
        if (userAccount == null || !validateUserAccount(userAccount)) {
            throw new IllegalArgumentException();
        }
        String passwordSalt = generateRandomString(PASSWORD_SALT_ALLOWED_CHARS, PASSWORD_SALT_LENGTH);
        String passwordHash = hashPassword(userAccount.getPassword(), passwordSalt);
        UserAccount entry = new UserAccount(null, userAccount.getName(), null, passwordHash, passwordSalt, userAccount.getRoles());
        entry = userAccountRepository.create(entry);
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
            entry.setPasswordHash(null);
            entry.setPasswordSalt(null);
        }
        return entry;
    }

    @Override
    public UserAccount update(Authority authority, String id, String name, UserAccount userAccount) {
        if (!validateAuthority(authority)) {
            throw new RuntimeException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
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
        UserAccount[] matches = userAccountRepository.readByIdAndName(id, name);
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        UserAccount match = matches[0];
        if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        if (userAccount == null || !validateUserAccount(userAccount)) {
            throw new IllegalArgumentException();
        }
        String passwordSalt = generateRandomString(PASSWORD_SALT_ALLOWED_CHARS, PASSWORD_SALT_LENGTH);
        String passwordHash = hashPassword(userAccount.getPassword(), passwordSalt);
        UserAccount entry = new UserAccount(null, userAccount.getName(), null, passwordHash, passwordSalt, userAccount.getRoles());
        entry = userAccountRepository.updateByIdAndName(id, name, entry);
        authenticationServiceClient.logout(authority, match.getId());
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
            entry.setPasswordHash(null);
            entry.setPasswordSalt(null);
        }
        return entry;
    }

    @Override
    public void delete(Authority authority, String id, String name) {
        if (!validateAuthority(authority)) {
            throw new RuntimeException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
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
        UserAccount[] matches = userAccountRepository.readByIdAndName(id, name);
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        UserAccount match = matches[0];
        if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        userAccountRepository.deleteByIdAndName(id, name);
        authenticationServiceClient.logout(authority, match.getId());
    }

    private boolean validatePasswordHashConfig(Map<String, String> passwordHashConfig) {
        if (passwordHashConfig == null) {
            return true;
        }
        if (!passwordHashConfig.containsKey("algorithm")) {
            return false;
        }
        return Security.getAlgorithms("MessageDigest").contains(passwordHashConfig.get("algorithm"));
    }

    private boolean validateUuid(String id) {
        if (id == null) {
            return true;
        }
        try {
            UUID.fromString(id);
        }
        catch (java.lang.IllegalArgumentException ex) {
            return false;
        }
        return true;
    }

    private boolean validateAuthority(Authority authority) {
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

    private boolean validateUserAccount(UserAccount userAccount) {
        if (userAccount == null) {
            return true;
        }
        if (userAccount.getName() == null || !validateName(userAccount.getName())) {
            return false;
        }
        if (userAccount.getPassword() == null || !validatePassword(userAccount.getPassword())) {
            return false;
        }
        return userAccount.getRoles() >= 0 && userAccount.getRoles() <= ROLES_MAX_VALUE;
    }

    private boolean validateName(String name) {
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

    private boolean validatePassword(String password) {
        if (password == null) {
            return true;
        }
        if (password.length() < PASSWORD_MIN_LENGTH || password.length() > PASSWORD_MAX_LENGTH) {
            return false;
        }
        for (char letter : password.toCharArray()) {
            if (PASSWORD_ALLOWED_CHARS.indexOf(letter) < 0) {
                return false;
            }
        }
        return true;
    }

    private boolean verifyAuthorityContainsAtLeastOneRole(Authority authority, short roles) {
        if (!validateAuthority(authority) || roles < 0 || roles > ROLES_MAX_VALUE) {
            throw new RuntimeException();
        }
        if (roles == 0) {
            return true;
        }
        if (authority == null) {
            return false;
        }
        return (authority.getRoles() & roles) != 0;
    }

    private String hashPassword(String password, String salt) {
        digest.reset();
        byte[] bytes = digest.digest((password + salt).getBytes(StandardCharsets.UTF_8));
        return hexString(bytes);
    }

    private static String generateRandomString(String pool, int length) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            result.append(pool.charAt((int) (Math.random() * pool.length())));
        }
        return result.toString();
    }

    private static String hexString(byte[] bytes) {
        byte[] builder = new byte[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int b = Byte.toUnsignedInt(bytes[i]);
            builder[i * 2] = HEX_CHARS[b >>> 4];
            builder[i * 2 + 1] = HEX_CHARS[b & 0x0F];
        }
        return new String(builder, StandardCharsets.UTF_8);
    }
}
