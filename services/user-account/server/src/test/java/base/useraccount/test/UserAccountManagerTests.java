package base.useraccount.test;

import base.useraccount.model.Authority;
import base.useraccount.model.Role;
import base.useraccount.model.UserAccount;
import base.useraccount.service.UserAccountManager;
import base.useraccount.service.UserAccountService;
import base.useraccount.test.spy.AuthenticationServiceClientSpy;
import base.useraccount.test.spy.UserAccountRepositorySpy;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;

public class UserAccountManagerTests {
    private static final Map<String, String> PASSWORD_HASH_CONFIG = Map.of("algorithm", "SHA-256");
    private static final byte[] HEX_CHARS = "0123456789abcdef".getBytes(StandardCharsets.US_ASCII);
    private static final UserAccount MOCK_USERACCOUNT = new UserAccount("00000000-0000-0000-0000-000000000000", "qwer", null, "bbf55461cbb04963ee7347e5e014f76defa26a8af960be40e644f4f204ddc7a3", "00000000000000000000000000000000", (short) 6);
    private static final String USERACCOUNT_PASSWORD = "Qwer!234";
    private static final Authority AUTHORITY = new Authority(null, Role.SYSTEM, 0);
    private static final UserAccountRepositorySpy userAccountRepositorySpy = new UserAccountRepositorySpy();
    private static final AuthenticationServiceClientSpy authenticationServiceClientSpy = new AuthenticationServiceClientSpy();
    private static final UserAccountService userAccountManager = new UserAccountManager(userAccountRepositorySpy, authenticationServiceClientSpy, PASSWORD_HASH_CONFIG);

    public static final Test[] tests = new Test[] {
            new Test("Read", new ReadTest()),
            new Test("Create", new CreateTest()),
            new Test("Update", new UpdateTest()),
            new Test("Delete", new DeleteTest()),
    };

    private static class ReadTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountRepositorySpy.resetSpy();
            userAccountRepositorySpy.setReadByIdAndNameReturnValue(new UserAccount[] { MOCK_USERACCOUNT });
            UserAccount output = userAccountManager.read(AUTHORITY, MOCK_USERACCOUNT.getId(), MOCK_USERACCOUNT.getName());
            if (userAccountRepositorySpy.getReadByIdAndNameInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.readByIdAndName(): Invocation count");
            }
            if (!verifyEqualityBetweenStrings(userAccountRepositorySpy.getReadByIdAndNameIdArgument(), MOCK_USERACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.readByIdAndName(): id argument");
            }
            if (!verifyEqualityBetweenStrings(userAccountRepositorySpy.getReadByIdAndNameNameArgument(), MOCK_USERACCOUNT.getName())) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.readByIdAndName(): name argument");
            }
            if (!verifyEqualityBetweenUserAccounts(output, MOCK_USERACCOUNT)) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountManager.read(): Return value");
            }
        }
    }

    private static class CreateTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountRepositorySpy.resetSpy();
            userAccountRepositorySpy.setCreateReturnValue(MOCK_USERACCOUNT);
            UserAccount inputUserAccount = new UserAccount(null, MOCK_USERACCOUNT.getName(), USERACCOUNT_PASSWORD, null, null, MOCK_USERACCOUNT.getRoles());
            UserAccount output = userAccountManager.create(AUTHORITY, inputUserAccount);
            if (userAccountRepositorySpy.getCreateInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.create(): Invocation count");
            }
            String generatedPasswordSalt = userAccountRepositorySpy.getCreateUserAccountArgument().getPasswordSalt();
            String expectedPasswordHash = hashPassword(PASSWORD_HASH_CONFIG.get("algorithm"), USERACCOUNT_PASSWORD, generatedPasswordSalt);
            UserAccount expectedUserAccountRepositoryCreateUserAccountArgument = new UserAccount(null, MOCK_USERACCOUNT.getName(), null, expectedPasswordHash, generatedPasswordSalt, MOCK_USERACCOUNT.getRoles());
            if (!verifyEqualityBetweenUserAccounts(userAccountRepositorySpy.getCreateUserAccountArgument(), expectedUserAccountRepositoryCreateUserAccountArgument)) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.create(): userAccount argument");
            }
            if (!verifyEqualityBetweenUserAccounts(output, MOCK_USERACCOUNT)) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountManager.create(): Return value");
            }
        }
    }

    private static class UpdateTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountRepositorySpy.resetSpy();
            authenticationServiceClientSpy.resetSpy();
            userAccountRepositorySpy.setReadByIdAndNameReturnValue(new UserAccount[] { MOCK_USERACCOUNT });
            userAccountRepositorySpy.setUpdateByIdAndNameReturnValue(MOCK_USERACCOUNT);
            String userAccountName = "changed";
            UserAccount inputUserAccount = new UserAccount(null, userAccountName, USERACCOUNT_PASSWORD, null, null, MOCK_USERACCOUNT.getRoles());
            UserAccount output = userAccountManager.update(AUTHORITY, MOCK_USERACCOUNT.getId(), MOCK_USERACCOUNT.getName(), inputUserAccount);
            if (userAccountRepositorySpy.getUpdateByIdAndNameInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.updateByIdAndName(): Invocation count");
            }
            if (!verifyEqualityBetweenStrings(userAccountRepositorySpy.getUpdateByIdAndNameIdArgument(), MOCK_USERACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.updateByIdAndName(): id argument");
            }
            if (!verifyEqualityBetweenStrings(userAccountRepositorySpy.getUpdateByIdAndNameNameArgument(), MOCK_USERACCOUNT.getName())) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.updateByIdAndName(): name argument");
            }
            String generatedPasswordSalt = userAccountRepositorySpy.getUpdateByIdAndNameUserAccountArgument().getPasswordSalt();
            String expectedPasswordHash = hashPassword(PASSWORD_HASH_CONFIG.get("algorithm"), USERACCOUNT_PASSWORD, generatedPasswordSalt);
            UserAccount expectedUserAccountRepositoryUpdateByIdAndNameUserAccountArgument = new UserAccount(null, userAccountName, null, expectedPasswordHash, generatedPasswordSalt, MOCK_USERACCOUNT.getRoles());
            if (!verifyEqualityBetweenUserAccounts(userAccountRepositorySpy.getUpdateByIdAndNameUserAccountArgument(), expectedUserAccountRepositoryUpdateByIdAndNameUserAccountArgument)) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.updateByIdAndName(): userAccount argument");
            }
            if (authenticationServiceClientSpy.getLogoutInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): Invocation count");
            }
            if (!verifyEqualityBetweenAuthorities(authenticationServiceClientSpy.getLogoutAuthorityArgument(), AUTHORITY)) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): authority argument");
            }
            if (!verifyEqualityBetweenStrings(authenticationServiceClientSpy.getLogoutUserAccountIdArgument(), MOCK_USERACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): userAccountId argument");
            }
            if (!verifyEqualityBetweenUserAccounts(output, MOCK_USERACCOUNT)) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountManager.update(): Return value");
            }
        }
    }

    private static class DeleteTest implements Test.Runnable {
        @Override
        public void run() {
            userAccountRepositorySpy.resetSpy();
            authenticationServiceClientSpy.resetSpy();
            userAccountRepositorySpy.setReadByIdAndNameReturnValue(new UserAccount[] { MOCK_USERACCOUNT });
            userAccountRepositorySpy.setDeleteByIdAndNameReturnValue(1);
            userAccountManager.delete(AUTHORITY, MOCK_USERACCOUNT.getId(), MOCK_USERACCOUNT.getName());
            if (userAccountRepositorySpy.getDeleteByIdAndNameInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.deleteByIdAndName(): Invocation count");
            }
            if (!verifyEqualityBetweenStrings(userAccountRepositorySpy.getDeleteByIdAndNameIdArgument(), MOCK_USERACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.deleteByIdAndName(): id argument");
            }
            if (!verifyEqualityBetweenStrings(userAccountRepositorySpy.getDeleteByIdAndNameNameArgument(), MOCK_USERACCOUNT.getName())) {
                throw new RuntimeException("Actual value does not match expected value: UserAccountRepository.deleteByIdAndName(): name argument");
            }
            if (authenticationServiceClientSpy.getLogoutInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): Invocation count");
            }
            if (!verifyEqualityBetweenAuthorities(authenticationServiceClientSpy.getLogoutAuthorityArgument(), AUTHORITY)) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): authority argument");
            }
            if (!verifyEqualityBetweenStrings(authenticationServiceClientSpy.getLogoutUserAccountIdArgument(), MOCK_USERACCOUNT.getId())) {
                throw new RuntimeException("Actual value does not match expected value: AuthenticationServiceClient.logout(): userAccountId argument");
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

    public static boolean verifyEqualityBetweenUserAccounts(UserAccount first, UserAccount second) {
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
            throw new RuntimeException();
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
