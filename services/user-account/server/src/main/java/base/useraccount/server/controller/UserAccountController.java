package base.useraccount.server.controller;

import base.useraccount.server.model.Authority;
import base.useraccount.server.model.IllegalArgumentException;
import base.useraccount.server.model.UserAccount;
import base.useraccount.server.service.DatabaseInfoManager;
import base.useraccount.server.service.DatabaseInfoService;
import base.useraccount.server.service.UserAccountManager;
import base.useraccount.server.service.UserAccountService;

import java.util.Map;

public class UserAccountController {
    private final DatabaseInfoService databaseInfoService = new DatabaseInfoManager();
    private final UserAccountService userAccountService = new UserAccountManager(databaseInfoService.getDatabaseInfo());

    public Response handle(Request request) {
        try {
            switch (request.function) {
                case "create": {
                    UserAccount userAccount = parseUserAccountFromMap((Map<String, Object>) request.getArguments()[0]);
                    String id = userAccountService.create(request.getAuthority(), userAccount);
                    return new Response(null, id);
                }
                case "readById": {
                    String id = (String) request.getArguments()[0];
                    UserAccount userAccount = userAccountService.readById(request.getAuthority(), id);
                    return new Response(null, userAccount);
                }
                case "readByName": {
                    String name = (String) request.getArguments()[0];
                    UserAccount userAccount = userAccountService.readByName(request.getAuthority(), name);
                    return new Response(null, userAccount);
                }
                case "updateById": {
                    String id = (String) request.getArguments()[0];
                    UserAccount userAccount = parseUserAccountFromMap((Map<String, Object>) request.getArguments()[1]);
                    userAccountService.updateById(request.getAuthority(), id, userAccount);
                    return new Response(null, null);
                }
                case "deleteById": {
                    String id = (String) request.getArguments()[0];
                    userAccountService.deleteById(request.getAuthority(), id);
                    return new Response(null, null);
                }
                default: {
                    throw new IllegalArgumentException();
                }
            }
        }
        catch (ClassCastException ex) {
            return new Response("IllegalArgumentError", null);
        }
        catch (Exception ex) {
            String errorName = ex.getClass().getSimpleName();
            errorName = errorName.substring(0, Math.max(errorName.lastIndexOf("Exception"), 0)) + "Error";
            return new Response(errorName, null);
        }
    }

    private UserAccount parseUserAccountFromMap(Map<String, Object> map) {
        if (map == null) {
            return null;
        }
        try {
            String name = (String) map.get("name");
            String passwordHash = (String) map.get("passwordHash");
            String passwordSalt = (String) map.get("passwordSalt");
            short roles = (short) (int) map.get("roles");
            return new UserAccount(null, name, passwordHash, passwordSalt, roles);
        }
        catch (ClassCastException ex) {
            throw new IllegalArgumentException();
        }
    }

    public static class Request {
        private String function;
        private Authority authority;
        private Object[] arguments;

        public String getFunction() {
            return function;
        }

        public void setFunction(String function) {
            this.function = function;
        }

        public Authority getAuthority() {
            return authority;
        }

        public void setAuthority(Authority authority) {
            this.authority = authority;
        }

        public Object[] getArguments() {
            return arguments;
        }

        public void setArguments(Object[] arguments) {
            this.arguments = arguments;
        }
    }

    public static class Response {
        private String result;
        private Object payload;

        public Response(String result, Object payload) {
            this.result = result;
            this.payload = payload;
        }

        public String getResult() {
            return result;
        }

        public void setResult(String result) {
            this.result = result;
        }

        public Object getPayload() {
            return payload;
        }

        public void setPayload(Object payload) {
            this.payload = payload;
        }
    }
}
