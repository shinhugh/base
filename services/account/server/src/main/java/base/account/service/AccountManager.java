package base.account.service;

import base.account.model.IllegalArgumentException;
import base.account.model.*;
import base.account.repository.AccountRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Security;
import java.util.Map;
import java.util.UUID;

public class AccountManager implements AccountService {
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
    private final long sessionAgeForModificationMaxValue;
    private final AccountRepository accountRepository;
    private final AuthenticationServiceClient authenticationServiceClient;
    private final MessageDigest digest;

    public AccountManager(AccountRepository accountRepository, AuthenticationServiceClient authenticationServiceClient, Map<String, String> config) {
        if (accountRepository == null) {
            throw new RuntimeException();
        }
        if (authenticationServiceClient == null) {
            throw new RuntimeException();
        }
        if (config == null || !validateConfig(config)) {
            throw new RuntimeException();
        }
        this.accountRepository = accountRepository;
        this.authenticationServiceClient = authenticationServiceClient;
        sessionAgeForModificationMaxValue = Long.parseLong(config.get("sessionAgeForModificationMaxValue"));
        try {
            digest = MessageDigest.getInstance(config.get("passwordHashAlgorithm"));
        } catch (NoSuchAlgorithmException ex) {
            throw new RuntimeException();
        }
    }

    @Override
    public Account read(Authority authority, String id, String name) {
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
        Account[] matches = accountRepository.readByIdAndName(id, name);
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        Account match = matches[0];
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
    public Account create(Authority authority, Account account) {
        if (!validateAuthority(authority)) {
            throw new RuntimeException();
        }
        if (account == null || !validateAccount(account)) {
            throw new IllegalArgumentException();
        }
        String passwordSalt = generateRandomString(PASSWORD_SALT_ALLOWED_CHARS, PASSWORD_SALT_LENGTH);
        String passwordHash = hashPassword(account.getPassword(), passwordSalt);
        Account entry = new Account(null, account.getName(), null, passwordHash, passwordSalt, account.getRoles());
        entry = accountRepository.create(entry);
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
            entry.setPasswordHash(null);
            entry.setPasswordSalt(null);
        }
        return entry;
    }

    @Override
    public Account update(Authority authority, String id, String name, Account account) {
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
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM) && authority.getAuthTime() + sessionAgeForModificationMaxValue < (System.currentTimeMillis() / 1000)) {
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
        Account[] matches = accountRepository.readByIdAndName(id, name);
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        Account match = matches[0];
        if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        if (account == null || !validateAccount(account)) {
            throw new IllegalArgumentException();
        }
        String passwordSalt = generateRandomString(PASSWORD_SALT_ALLOWED_CHARS, PASSWORD_SALT_LENGTH);
        String passwordHash = hashPassword(account.getPassword(), passwordSalt);
        Account entry = new Account(null, account.getName(), null, passwordHash, passwordSalt, account.getRoles());
        entry = accountRepository.updateByIdAndName(id, name, entry);
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
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM) && authority.getAuthTime() + sessionAgeForModificationMaxValue < (System.currentTimeMillis() / 1000)) {
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
        Account[] matches = accountRepository.readByIdAndName(id, name);
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        Account match = matches[0];
        if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        accountRepository.deleteByIdAndName(id, name);
        authenticationServiceClient.logout(authority, match.getId());
    }

    private String hashPassword(String password, String salt) {
        digest.reset();
        byte[] bytes = digest.digest((password + salt).getBytes(StandardCharsets.UTF_8));
        return hexString(bytes);
    }

    private static boolean validateConfig(Map<String, String> config) {
        if (config == null) {
            return true;
        }
        if (!config.containsKey("sessionAgeForModificationMaxValue")) {
            return false;
        }
        long sessionAgeForModificationMaxValue;
        try {
            sessionAgeForModificationMaxValue = Long.parseLong(config.get("sessionAgeForModificationMaxValue"));
        }
        catch (NumberFormatException ex) {
            return false;
        }
        if (sessionAgeForModificationMaxValue < 0) {
            return false;
        }
        if (!config.containsKey("passwordHashAlgorithm")) {
            return false;
        }
        return Security.getAlgorithms("MessageDigest").contains(config.get("passwordHashAlgorithm"));
    }

    private static boolean validateUuid(String id) {
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

    private static boolean validateAccount(Account account) {
        if (account == null) {
            return true;
        }
        if (account.getName() == null || !validateName(account.getName())) {
            return false;
        }
        if (account.getPassword() == null || !validatePassword(account.getPassword())) {
            return false;
        }
        return account.getRoles() >= 0 && account.getRoles() <= ROLES_MAX_VALUE;
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

    private static boolean validatePassword(String password) {
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

    private static boolean verifyAuthorityContainsAtLeastOneRole(Authority authority, short roles) {
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
