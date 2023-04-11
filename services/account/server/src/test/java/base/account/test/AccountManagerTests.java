package base.account.test;

import base.account.model.Account;
import base.account.model.Authority;
import base.account.model.Role;
import base.account.service.AccountManager;
import base.account.service.AccountService;
import base.account.test.spy.AccountRepositorySpy;
import base.account.test.spy.AuthenticationServiceClientSpy;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;

public class AccountManagerTests {
    private static final Map<String, String> ACCOUNT_MANAGER_CONFIG = Map.of("sessionAgeForModificationMaxValue", "900", "passwordHashAlgorithm", "SHA-256");
    private static final byte[] HEX_CHARS = "0123456789abcdef".getBytes(StandardCharsets.US_ASCII);
    private static final Account MOCK_ACCOUNT = new Account("00000000-0000-0000-0000-000000000000", "qwer", null, "bbf55461cbb04963ee7347e5e014f76defa26a8af960be40e644f4f204ddc7a3", "00000000000000000000000000000000", (short) 6);
    private static final String ACCOUNT_PASSWORD = "Qwer!234";
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final AccountRepositorySpy accountRepositorySpy = new AccountRepositorySpy();
    private static final AuthenticationServiceClientSpy authenticationServiceClientSpy = new AuthenticationServiceClientSpy();
    private static final AccountService accountManager = new AccountManager(accountRepositorySpy, authenticationServiceClientSpy, ACCOUNT_MANAGER_CONFIG);

    public static final Test[] tests = new Test[] {
            new Test("Read", new ReadTest()),
            new Test("Create", new CreateTest()),
            new Test("Update", new UpdateTest()),
            new Test("Delete", new DeleteTest()),
    };

    private static class ReadTest implements Test.Runnable {
        @Override
        public void run() {
            accountRepositorySpy.resetSpy();
            accountRepositorySpy.setReadByIdAndNameReturnValue(new Account[] {MOCK_ACCOUNT});
            Account output = accountManager.read(AUTHORITY, MOCK_ACCOUNT.getId(), MOCK_ACCOUNT.getName());
            if (accountRepositorySpy.getReadByIdAndNameInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.readByIdAndName(): Invocation count");
            }
            if (!verifyEqualityBetweenStrings(accountRepositorySpy.getReadByIdAndNameIdArgument(), MOCK_ACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.readByIdAndName(): id argument");
            }
            if (!verifyEqualityBetweenStrings(accountRepositorySpy.getReadByIdAndNameNameArgument(), MOCK_ACCOUNT.getName())) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.readByIdAndName(): name argument");
            }
            if (!verifyEqualityBetweenAccounts(output, MOCK_ACCOUNT)) {
                throw new RuntimeException("Actual value does not match expected value: AccountManager.read(): Return value");
            }
        }
    }

    private static class CreateTest implements Test.Runnable {
        @Override
        public void run() {
            accountRepositorySpy.resetSpy();
            accountRepositorySpy.setCreateReturnValue(MOCK_ACCOUNT);
            Account inputAccount = new Account(null, MOCK_ACCOUNT.getName(), ACCOUNT_PASSWORD, null, null, MOCK_ACCOUNT.getRoles());
            Account output = accountManager.create(AUTHORITY, inputAccount);
            if (accountRepositorySpy.getCreateInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.create(): Invocation count");
            }
            String generatedPasswordSalt = accountRepositorySpy.getCreateAccountArgument().getPasswordSalt();
            String expectedPasswordHash = hashPassword(ACCOUNT_MANAGER_CONFIG.get("passwordHashAlgorithm"), ACCOUNT_PASSWORD, generatedPasswordSalt);
            Account expectedAccountRepositoryCreateAccountArgument = new Account(null, MOCK_ACCOUNT.getName(), null, expectedPasswordHash, generatedPasswordSalt, MOCK_ACCOUNT.getRoles());
            if (!verifyEqualityBetweenAccounts(accountRepositorySpy.getCreateAccountArgument(), expectedAccountRepositoryCreateAccountArgument)) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.create(): account argument");
            }
            if (!verifyEqualityBetweenAccounts(output, MOCK_ACCOUNT)) {
                throw new RuntimeException("Actual value does not match expected value: AccountManager.create(): Return value");
            }
        }
    }

    private static class UpdateTest implements Test.Runnable {
        @Override
        public void run() {
            accountRepositorySpy.resetSpy();
            authenticationServiceClientSpy.resetSpy();
            accountRepositorySpy.setReadByIdAndNameReturnValue(new Account[] {MOCK_ACCOUNT});
            accountRepositorySpy.setUpdateByIdAndNameReturnValue(MOCK_ACCOUNT);
            String accountName = "changed";
            Account inputAccount = new Account(null, accountName, ACCOUNT_PASSWORD, null, null, MOCK_ACCOUNT.getRoles());
            Account output = accountManager.update(AUTHORITY, MOCK_ACCOUNT.getId(), MOCK_ACCOUNT.getName(), inputAccount);
            if (accountRepositorySpy.getUpdateByIdAndNameInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.updateByIdAndName(): Invocation count");
            }
            if (!verifyEqualityBetweenStrings(accountRepositorySpy.getUpdateByIdAndNameIdArgument(), MOCK_ACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.updateByIdAndName(): id argument");
            }
            if (!verifyEqualityBetweenStrings(accountRepositorySpy.getUpdateByIdAndNameNameArgument(), MOCK_ACCOUNT.getName())) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.updateByIdAndName(): name argument");
            }
            String generatedPasswordSalt = accountRepositorySpy.getUpdateByIdAndNameAccountArgument().getPasswordSalt();
            String expectedPasswordHash = hashPassword(ACCOUNT_MANAGER_CONFIG.get("passwordHashAlgorithm"), ACCOUNT_PASSWORD, generatedPasswordSalt);
            Account expectedAccountRepositoryUpdateByIdAndNameAccountArgument = new Account(null, accountName, null, expectedPasswordHash, generatedPasswordSalt, MOCK_ACCOUNT.getRoles());
            if (!verifyEqualityBetweenAccounts(accountRepositorySpy.getUpdateByIdAndNameAccountArgument(), expectedAccountRepositoryUpdateByIdAndNameAccountArgument)) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.updateByIdAndName(): account argument");
            }
            if (authenticationServiceClientSpy.getLogoutInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): Invocation count");
            }
            if (!verifyEqualityBetweenAuthorities(authenticationServiceClientSpy.getLogoutAuthorityArgument(), AUTHORITY)) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): authority argument");
            }
            if (!verifyEqualityBetweenStrings(authenticationServiceClientSpy.getLogoutAccountIdArgument(), MOCK_ACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): accountId argument");
            }
            if (!verifyEqualityBetweenAccounts(output, MOCK_ACCOUNT)) {
                throw new RuntimeException("Actual value does not match expected value: AccountManager.update(): Return value");
            }
        }
    }

    private static class DeleteTest implements Test.Runnable {
        @Override
        public void run() {
            accountRepositorySpy.resetSpy();
            authenticationServiceClientSpy.resetSpy();
            accountRepositorySpy.setReadByIdAndNameReturnValue(new Account[] {MOCK_ACCOUNT});
            accountRepositorySpy.setDeleteByIdAndNameReturnValue(1);
            accountManager.delete(AUTHORITY, MOCK_ACCOUNT.getId(), MOCK_ACCOUNT.getName());
            if (accountRepositorySpy.getDeleteByIdAndNameInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.deleteByIdAndName(): Invocation count");
            }
            if (!verifyEqualityBetweenStrings(accountRepositorySpy.getDeleteByIdAndNameIdArgument(), MOCK_ACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.deleteByIdAndName(): id argument");
            }
            if (!verifyEqualityBetweenStrings(accountRepositorySpy.getDeleteByIdAndNameNameArgument(), MOCK_ACCOUNT.getName())) {
                throw new RuntimeException("Actual value does not match expected value: AccountRepository.deleteByIdAndName(): name argument");
            }
            if (authenticationServiceClientSpy.getLogoutInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): Invocation count");
            }
            if (!verifyEqualityBetweenAuthorities(authenticationServiceClientSpy.getLogoutAuthorityArgument(), AUTHORITY)) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): authority argument");
            }
            if (!verifyEqualityBetweenStrings(authenticationServiceClientSpy.getLogoutAccountIdArgument(), MOCK_ACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): accountId argument");
            }
        }
    }

    public static boolean verifyEqualityBetweenAuthorities(Authority first, Authority second) {
        if (first == null && second == null) {
            return true;
        }
        if (first == null || second == null) {
            return false;
        }
        if (!verifyEqualityBetweenStrings(first.getId(), second.getId())) {
            return false;
        }
        if (first.getRoles() != second.getRoles()) {
            return false;
        }
        return first.getAuthTime() == second.getAuthTime();
    }

    public static boolean verifyEqualityBetweenAccounts(Account first, Account second) {
        if (first == null && second == null) {
            return true;
        }
        if (first == null || second == null) {
            return false;
        }
        if (!verifyEqualityBetweenStrings(first.getId(), second.getId())) {
            return false;
        }
        if (!verifyEqualityBetweenStrings(first.getName(), second.getName())) {
            return false;
        }
        if (!verifyEqualityBetweenStrings(first.getPassword(), second.getPassword())) {
            return false;
        }
        if (!verifyEqualityBetweenStrings(first.getPasswordHash(), second.getPasswordHash())) {
            return false;
        }
        if (!verifyEqualityBetweenStrings(first.getPasswordSalt(), second.getPasswordSalt())) {
            return false;
        }
        return first.getRoles() == second.getRoles();
    }

    private static boolean verifyEqualityBetweenStrings(String first, String second) {
        if (first == null && second == null) {
            return true;
        }
        if (first == null || second == null) {
            return false;
        }
        return first.equals(second);
    }

    private static String hashPassword(String algorithm, String password, String salt) {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance(algorithm);
        }
        catch (NoSuchAlgorithmException ex) {
            throw new RuntimeException("Invalid algorithm provided for password hashing");
        }
        byte[] bytes = digest.digest((password + salt).getBytes(StandardCharsets.UTF_8));
        byte[] builder = new byte[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int b = Byte.toUnsignedInt(bytes[i]);
            builder[i * 2] = HEX_CHARS[b >>> 4];
            builder[i * 2 + 1] = HEX_CHARS[b & 0x0F];
        }
        return new String(builder, StandardCharsets.UTF_8);
    }
}
