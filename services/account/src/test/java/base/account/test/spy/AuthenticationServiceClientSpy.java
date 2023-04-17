package base.account.test.spy;

import base.account.service.AuthenticationServiceClient;
import base.account.service.model.Authority;

public class AuthenticationServiceClientSpy implements AuthenticationServiceClient {
    private int logoutInvokeCount;
    private Authority logoutAuthorityArgument;
    private String logoutAccountIdArgument;

    @Override
    public void logout(Authority authority, String accountId) {
        logoutInvokeCount++;
        logoutAuthorityArgument = authority;
        logoutAccountIdArgument = accountId;
    }

    public void resetSpy() {
        logoutInvokeCount = 0;
        logoutAuthorityArgument = null;
        logoutAccountIdArgument = null;
    }

    public int getLogoutInvokeCount() {
        return logoutInvokeCount;
    }

    public Authority getLogoutAuthorityArgument() {
        return logoutAuthorityArgument;
    }

    public String getLogoutAccountIdArgument() {
        return logoutAccountIdArgument;
    }
}
