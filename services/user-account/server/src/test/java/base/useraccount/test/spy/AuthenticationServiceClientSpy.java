package base.useraccount.test.spy;

import base.useraccount.model.Authority;
import base.useraccount.service.AuthenticationServiceClient;

public class AuthenticationServiceClientSpy implements AuthenticationServiceClient {
    private int logoutInvokeCount;
    private Authority logoutAuthorityArgument;
    private String logoutUserAccountIdArgument;

    @Override
    public void logout(Authority authority, String userAccountId) {
        logoutInvokeCount++;
        logoutAuthorityArgument = authority;
        logoutUserAccountIdArgument = userAccountId;
    }

    public void resetSpy() {
        logoutInvokeCount = 0;
        logoutAuthorityArgument = null;
        logoutUserAccountIdArgument = null;
    }

    public int getLogoutInvokeCount() {
        return logoutInvokeCount;
    }

    public Authority getLogoutAuthorityArgument() {
        return logoutAuthorityArgument;
    }

    public String getLogoutUserAccountIdArgument() {
        return logoutUserAccountIdArgument;
    }
}
