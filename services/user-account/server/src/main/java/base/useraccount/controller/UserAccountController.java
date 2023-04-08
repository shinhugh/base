package base.useraccount.controller;

import base.useraccount.service.UserAccountService;

public class UserAccountController {
    private final UserAccountService userAccountService;

    public UserAccountController(UserAccountService userAccountService) {
        if (userAccountService == null) {
            throw new RuntimeException();
        }
        this.userAccountService = userAccountService;
    }

    public void handle() { // TODO
        // TODO
    }
}
