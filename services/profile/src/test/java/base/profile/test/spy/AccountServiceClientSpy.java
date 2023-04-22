package base.profile.test.spy;

import base.profile.service.AccountServiceClient;
import base.profile.service.model.Authority;

public class AccountServiceClientSpy implements AccountServiceClient {
    private boolean checkForAccountExistenceReturnValue;
    private int checkForAccountExistenceInvokeCount;
    private Authority checkForAccountExistenceAuthorityArgument;
    private String checkForAccountExistenceIdArgument;

    @Override
    public boolean checkForAccountExistence(Authority authority, String id) {
        checkForAccountExistenceInvokeCount++;
        checkForAccountExistenceAuthorityArgument = authority;
        checkForAccountExistenceIdArgument = id;
        return checkForAccountExistenceReturnValue;
    }

    public void resetSpy() {
        checkForAccountExistenceInvokeCount = 0;
        checkForAccountExistenceAuthorityArgument = null;
        checkForAccountExistenceIdArgument = null;
    }

    public void setCheckForAccountExistenceReturnValue(boolean checkForAccountExistenceReturnValue) {
        this.checkForAccountExistenceReturnValue = checkForAccountExistenceReturnValue;
    }

    public int getCheckForAccountExistenceInvokeCount() {
        return checkForAccountExistenceInvokeCount;
    }

    public Authority getCheckForAccountExistenceAuthorityArgument() {
        return checkForAccountExistenceAuthorityArgument;
    }

    public String getCheckForAccountExistenceIdArgument() {
        return checkForAccountExistenceIdArgument;
    }
}
