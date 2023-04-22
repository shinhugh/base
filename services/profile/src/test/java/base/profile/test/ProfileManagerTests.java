package base.profile.test;

import base.profile.service.ProfileManager;
import base.profile.service.model.Authority;
import base.profile.service.model.Profile;
import base.profile.service.model.Role;
import base.profile.test.spy.AccountServiceClientSpy;
import base.profile.test.spy.ProfileRepositorySpy;

public class ProfileManagerTests {
    private static final String ACCOUNT_ID = "00000000-0000-0000-0000-000000000000";
    private static final String PROFILE_NAME = "Qwer";
    private static final ProfileRepositorySpy profileRepositorySpy = new ProfileRepositorySpy();
    private static final AccountServiceClientSpy accountServiceClientSpy = new AccountServiceClientSpy();
    private static final ProfileManager profileManager = new ProfileManager(profileRepositorySpy, accountServiceClientSpy);
    public static final Test[] tests = new Test[] {
            new Test("Read profiles", new ReadProfilesTest()),
            new Test("Create profile", new CreateProfileTest()),
            new Test("Update profile", new UpdateProfileTest()),
            new Test("Delete profile", new DeleteProfileTest())
    };

    private static class ReadProfilesTest implements Test.Runnable {
        @Override
        public void run() {
            profileRepositorySpy.resetSpy();
            profileRepositorySpy.setReadByAccountIdAndNameReturnValue(new base.profile.repository.model.Profile[] { new base.profile.repository.model.Profile(ACCOUNT_ID, PROFILE_NAME) });
            Authority authority = null;
            Profile[] output;
            try {
                output = profileManager.readProfiles(authority, ACCOUNT_ID, PROFILE_NAME);
            }
            catch (Exception e) {
                throw new RuntimeException("Unexpected exception: ProfileManager.readProfiles(): " + e.getMessage());
            }
            if (profileRepositorySpy.getReadByAccountIdAndNameInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.readByAccountIdAndName(): Invocation count");
            }
            if (!ACCOUNT_ID.equals(profileRepositorySpy.getReadByAccountIdAndNameAccountIdArgument())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.readByAccountIdAndName(): accountId argument");
            }
            if (!PROFILE_NAME.equals(profileRepositorySpy.getReadByAccountIdAndNameNameArgument())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.readByAccountIdAndName(): name argument");
            }
            if (output.length != 1 || output[0] == null || !ACCOUNT_ID.equals(output[0].getAccountId()) || !PROFILE_NAME.equals(output[0].getName())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileManager.readProfiles(): Return value");
            }
        }
    }

    private static class CreateProfileTest implements Test.Runnable {
        @Override
        public void run() {
            profileRepositorySpy.resetSpy();
            accountServiceClientSpy.resetSpy();
            profileRepositorySpy.setCreateReturnValue(new base.profile.repository.model.Profile(ACCOUNT_ID, PROFILE_NAME));
            accountServiceClientSpy.setCheckForAccountExistenceReturnValue(true);
            Authority authority = new Authority(ACCOUNT_ID, Role.USER, 0);
            Profile profile = new Profile(ACCOUNT_ID, PROFILE_NAME);
            Profile output;
            try {
                output = profileManager.createProfile(authority, profile);
            }
            catch (Exception e) {
                throw new RuntimeException("Unexpected exception: ProfileManager.createProfile(): " + e.getMessage());
            }
            if (profileRepositorySpy.getCreateInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.create(): Invocation count");
            }
            if (profileRepositorySpy.getCreateProfileArgument() == null || !ACCOUNT_ID.equals(profileRepositorySpy.getCreateProfileArgument().getAccountId()) || !PROFILE_NAME.equals(profileRepositorySpy.getCreateProfileArgument().getName())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.create(): profile argument");
            }
            if (accountServiceClientSpy.getCheckForAccountExistenceInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: AccountServiceClient.checkForAccountExistence(): Invocation count");
            }
            if (accountServiceClientSpy.getCheckForAccountExistenceAuthorityArgument() == null || !ACCOUNT_ID.equals(accountServiceClientSpy.getCheckForAccountExistenceAuthorityArgument().getId()) || accountServiceClientSpy.getCheckForAccountExistenceAuthorityArgument().getRoles() != Role.USER || accountServiceClientSpy.getCheckForAccountExistenceAuthorityArgument().getAuthTime() != 0) {
                throw new RuntimeException("Actual value does not match expected value: AccountServiceClient.checkForAccountExistence(): authority argument");
            }
            if (!ACCOUNT_ID.equals(accountServiceClientSpy.getCheckForAccountExistenceIdArgument())) {
                throw new RuntimeException("Actual value does not match expected value: AccountServiceClient.checkForAccountExistence(): id argument");
            }
            if (output == null || !ACCOUNT_ID.equals(output.getAccountId()) || !PROFILE_NAME.equals(output.getName())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileManager.createProfile(): Return value");
            }
        }
    }

    private static class UpdateProfileTest implements Test.Runnable {
        @Override
        public void run() {
            String changedName = "changed";
            profileRepositorySpy.resetSpy();
            profileRepositorySpy.setReadByAccountIdReturnValue(new base.profile.repository.model.Profile[] { new base.profile.repository.model.Profile(ACCOUNT_ID, PROFILE_NAME) });
            profileRepositorySpy.setUpdateByAccountIdReturnValue(new base.profile.repository.model.Profile(ACCOUNT_ID, changedName));
            Authority authority = new Authority(ACCOUNT_ID, Role.USER, 0);
            Profile profile = new Profile(null, changedName);
            Profile output;
            try {
                output = profileManager.updateProfile(authority, ACCOUNT_ID, profile);
            }
            catch (Exception e) {
                throw new RuntimeException("Unexpected exception: ProfileManager.updateProfile(): " + e.getMessage());
            }
            if (profileRepositorySpy.getReadByAccountIdInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.readByAccountId(): Invocation count");
            }
            if (!ACCOUNT_ID.equals(profileRepositorySpy.getReadByAccountIdAccountIdArgument())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.readByAccountId(): accountId argument");
            }
            if (profileRepositorySpy.getUpdateByAccountIdInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.updateByAccountId(): Invocation count");
            }
            if (!ACCOUNT_ID.equals(profileRepositorySpy.getUpdateByAccountIdAccountIdArgument())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.updateByAccountId(): accountId argument");
            }
            if (profileRepositorySpy.getUpdateByAccountIdProfileArgument() == null || profileRepositorySpy.getUpdateByAccountIdProfileArgument().getAccountId() != null || !changedName.equals(profileRepositorySpy.getUpdateByAccountIdProfileArgument().getName())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.updateByAccountId(): profile argument");
            }
            if (output == null || !ACCOUNT_ID.equals(output.getAccountId()) || !changedName.equals(output.getName())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileManager.updateProfile(): Return value");
            }
        }
    }

    private static class DeleteProfileTest implements Test.Runnable {
        @Override
        public void run() {
            profileRepositorySpy.resetSpy();
            profileRepositorySpy.setReadByAccountIdReturnValue(new base.profile.repository.model.Profile[] { new base.profile.repository.model.Profile(ACCOUNT_ID, PROFILE_NAME) });
            profileRepositorySpy.setDeleteByAccountIdReturnValue(1);
            Authority authority = new Authority(ACCOUNT_ID, Role.USER, 0);
            try {
                profileManager.deleteProfile(authority, ACCOUNT_ID);
            }
            catch (Exception e) {
                throw new RuntimeException("Unexpected exception: ProfileManager.deleteProfile(): " + e.getMessage());
            }
            if (profileRepositorySpy.getReadByAccountIdInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.readByAccountId(): Invocation count");
            }
            if (!ACCOUNT_ID.equals(profileRepositorySpy.getReadByAccountIdAccountIdArgument())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.readByAccountId(): accountId argument");
            }
            if (profileRepositorySpy.getDeleteByAccountIdInvokeCount() != 1) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.deleteByAccountId(): Invocation count");
            }
            if (!ACCOUNT_ID.equals(profileRepositorySpy.getDeleteByAccountIdAccountIdArgument())) {
                throw new RuntimeException("Actual value does not match expected value: ProfileRepository.deleteByAccountId(): accountId argument");
            }
        }
    }
}
