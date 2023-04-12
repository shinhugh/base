package base.account.service;

import base.account.repository.AccountRepository;
import base.account.service.model.IllegalArgumentException;
import base.account.service.model.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
    private final long modificationEnabledSessionAgeMaxValue;
    private final AccountRepository accountRepository;
    private final AuthenticationServiceClient authenticationServiceClient;
    private final MessageDigest digest;

    public AccountManager(AccountRepository accountRepository, AuthenticationServiceClient authenticationServiceClient, Map<String, String> config) {
        if (accountRepository == null) {
            throw new RuntimeException("Invalid accountRepository provided to AccountManager constructor");
        }
        if (authenticationServiceClient == null) {
            throw new RuntimeException("Invalid authenticationServiceClient provided to AccountManager constructor");
        }
        if (config == null || !validateConfig(config)) {
            throw new RuntimeException("Invalid config provided to AccountManager constructor");
        }
        this.accountRepository = accountRepository;
        this.authenticationServiceClient = authenticationServiceClient;
        modificationEnabledSessionAgeMaxValue = Long.parseLong(config.get("modificationEnabledSessionAgeMaxValue"));
        try {
            digest = MessageDigest.getInstance(config.get("passwordHashAlgorithm"));
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to attain password hash function");
        }
    }

    @Override
    public Account read(Authority authority, String id, String name) throws IllegalArgumentException, AccessDeniedException, NotFoundException {
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
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        base.account.repository.model.Account[] matches;
        try {
            matches = accountRepository.readByIdAndName(id, name);
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to read from account store");
        }
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        base.account.repository.model.Account match = matches[0];
        if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        Account output = createServiceAccountFromRepositoryAccount(match);
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
            output.setPasswordHash(null);
            output.setPasswordSalt(null);
        }
        return output;
    }

    @Override
    public Account create(Authority authority, Account account) throws IllegalArgumentException, ConflictException {
        if (!validateAuthority(authority)) {
            throw new IllegalArgumentException();
        }
        if (account == null || !validateAccount(account)) {
            throw new IllegalArgumentException();
        }
        String passwordSalt = generateRandomString(PASSWORD_SALT_ALLOWED_CHARS, PASSWORD_SALT_LENGTH);
        String passwordHash = hashPassword(account.getPassword(), passwordSalt);
        base.account.repository.model.Account entry = new base.account.repository.model.Account(null, account.getName(), passwordHash, passwordSalt, account.getRoles());
        try {
            entry = accountRepository.create(entry);
        }
        catch (base.account.repository.model.ConflictException e) {
            throw new ConflictException();
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to write to account store");
        }
        Account output = createServiceAccountFromRepositoryAccount(entry);
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
            output.setPasswordHash(null);
            output.setPasswordSalt(null);
        }
        return output;
    }

    @Override
    public Account update(Authority authority, String id, String name, Account account) throws IllegalArgumentException, AccessDeniedException, NotFoundException, ConflictException {
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
        if (account == null || !validateAccount(account)) {
            throw new IllegalArgumentException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.USER | Role.ADMIN))) {
            throw new AccessDeniedException();
        }
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM) && modificationEnabledSessionAgeMaxValue > 0 && authority.getAuthTime() + modificationEnabledSessionAgeMaxValue < (System.currentTimeMillis() / 1000)) {
            throw new AccessDeniedException();
        }
        base.account.repository.model.Account[] matches;
        try {
            matches = accountRepository.readByIdAndName(id, name);
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to read from account store");
        }
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        base.account.repository.model.Account match = matches[0];
        if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        String passwordSalt = generateRandomString(PASSWORD_SALT_ALLOWED_CHARS, PASSWORD_SALT_LENGTH);
        String passwordHash = hashPassword(account.getPassword(), passwordSalt);
        base.account.repository.model.Account entry = new base.account.repository.model.Account(null, account.getName(), passwordHash, passwordSalt, account.getRoles());
        try {
            entry = accountRepository.updateByIdAndName(id, name, entry);
        }
        catch (base.account.repository.model.ConflictException e) {
            throw new ConflictException();
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to write to account store");
        }
        try {
            authenticationServiceClient.logout(authority, match.getId());
        }
        // TODO: Handle specific exceptions
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to invoke authentication service");
        }
        Account output = createServiceAccountFromRepositoryAccount(entry);
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM)) {
            output.setPasswordHash(null);
            output.setPasswordSalt(null);
        }
        return output;
    }

    @Override
    public void delete(Authority authority, String id, String name) throws IllegalArgumentException, AccessDeniedException, NotFoundException {
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
        boolean onlyAuthorizedAsUser = !verifyAuthorityContainsAtLeastOneRole(authority, (short) (Role.SYSTEM | Role.ADMIN));
        if (onlyAuthorizedAsUser && authority.getId() == null) {
            throw new AccessDeniedException();
        }
        if (!verifyAuthorityContainsAtLeastOneRole(authority, Role.SYSTEM) && modificationEnabledSessionAgeMaxValue > 0 && authority.getAuthTime() + modificationEnabledSessionAgeMaxValue < (System.currentTimeMillis() / 1000)) {
            throw new AccessDeniedException();
        }
        base.account.repository.model.Account[] matches;
        try {
            matches = accountRepository.readByIdAndName(id, name);
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to read from account store");
        }
        if (matches.length == 0) {
            if (onlyAuthorizedAsUser) {
                throw new AccessDeniedException();
            }
            throw new NotFoundException();
        }
        base.account.repository.model.Account match = matches[0];
        if (onlyAuthorizedAsUser && !match.getId().equals(authority.getId())) {
            throw new AccessDeniedException();
        }
        try {
            accountRepository.deleteByIdAndName(id, name);
        }
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to write to account store");
        }
        try {
            authenticationServiceClient.logout(authority, match.getId());
        }
        // TODO: Handle specific exceptions
        catch (Exception e) {
            throw new RuntimeException("Unexpected exception: Failed to invoke authentication service");
        }
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
        long modificationEnabledSessionAgeMaxValue;
        try {
            modificationEnabledSessionAgeMaxValue = Long.parseLong(config.get("modificationEnabledSessionAgeMaxValue"));
        }
        catch (Exception e) {
            return false;
        }
        if (modificationEnabledSessionAgeMaxValue < 0 || modificationEnabledSessionAgeMaxValue > TIME_MAX_VALUE) {
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
        if (roles == 0) {
            return true;
        }
        if (authority == null) {
            return false;
        }
        return (authority.getRoles() & roles) != 0;
    }

    private static Account createServiceAccountFromRepositoryAccount(base.account.repository.model.Account account) {
        return new Account(account.getId(), account.getName(), null, account.getPasswordHash(), account.getPasswordSalt(), account.getRoles());
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
