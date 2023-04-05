package base.useraccount.server.controller;

import base.useraccount.server.model.Authority;
import base.useraccount.server.model.IllegalArgumentException;
import base.useraccount.server.model.UserAccount;
import base.useraccount.server.service.DatabaseInfoManager;
import base.useraccount.server.service.DatabaseInfoService;
import base.useraccount.server.service.UserAccountManager;
import base.useraccount.server.service.UserAccountService;

import java.util.ArrayList;
import java.util.Map;

public class UserAccountController {
    private final DatabaseInfoService databaseInfoService = new DatabaseInfoManager();
    private final UserAccountService userAccountService = new UserAccountManager(databaseInfoService.getDatabaseInfo());

    public Response handle(Object typelessRequest) {
        try {
            Request request = parseRequestFromObject(typelessRequest);
            Object[] arguments = request.getArguments() == null ? new Object[0] : request.getArguments();
            switch (request.function) {
                case "create": {
                    UserAccount inputUserAccount = parseUserAccountFromObject(arguments.length > 0 ? arguments[0] : null);
                    UserAccount output = userAccountService.create(request.getAuthority(), inputUserAccount);
                    return new Response(null, output);
                }
                case "readById": {
                    String inputId = parseStringFromObject(arguments.length > 0 ? arguments[0] : null);
                    UserAccount output = userAccountService.readById(request.getAuthority(), inputId);
                    return new Response(null, output);
                }
                case "readByName": {
                    String inputName = parseStringFromObject(arguments.length > 0 ? arguments[0] : null);
                    UserAccount output = userAccountService.readByName(request.getAuthority(), inputName);
                    return new Response(null, output);
                }
                case "updateById": {
                    String inputId = parseStringFromObject(arguments.length > 0 ? arguments[0] : null);
                    UserAccount inputUserAccount = parseUserAccountFromObject(arguments.length > 1 ? arguments[1] : null);
                    UserAccount output = userAccountService.updateById(request.getAuthority(), inputId, inputUserAccount);
                    return new Response(null, output);
                }
                case "deleteById": {
                    String inputId = parseStringFromObject(arguments.length > 0 ? arguments[0] : null);
                    userAccountService.deleteById(request.getAuthority(), inputId);
                    return new Response(null, null);
                }
                default: {
                    throw new IllegalArgumentException();
                }
            }
        }
        catch (ClassCastException ex) {
            System.out.println("Error thrown: IllegalArgumentError");
            return new Response("IllegalArgumentError", null);
        }
        catch (Exception ex) {
            String errorName = ex.getClass().getSimpleName();
            errorName = errorName.substring(0, Math.max(errorName.lastIndexOf("Exception"), 0)) + "Error";
            System.out.println("Error thrown: " + errorName);
            return new Response(errorName, null);
        }
    }

    private short parseShortFromObject(Object object) {
        if (object == null) {
            return 0;
        }
        if (object instanceof Integer) {
            return (short) (int) object;
        }
        if (object instanceof Double) {
            return (short) (double) object;
        }
        throw new ClassCastException();
    }

    private long parseLongFromObject(Object object) {
        if (object == null) {
            return 0;
        }
        if (object instanceof Long) {
            return (long) object;
        }
        if (object instanceof Integer) {
            return (long) (int) object;
        }
        if (object instanceof Double) {
            return (long) (double) object;
        }
        throw new ClassCastException();
    }

    private String parseStringFromObject(Object object) {
        if (object == null) {
            return null;
        }
        if (object instanceof String) {
            return (String) object;
        }
        throw new ClassCastException();
    }

    private Request parseRequestFromObject(Object object) {
        if (object == null) {
            return null;
        }
        try {
            Map<String, Object> map = (Map<String, Object>) object;
            String function = (String) map.get("function");
            Authority authority = parseAuthorityFromObject(map.get("authority"));
            Object[] arguments = ((ArrayList<Object>) map.get("arguments")).toArray();
            return new Request(function, authority, arguments);
        }
        catch (ClassCastException ex) {
            throw new ClassCastException();
        }
    }

    private Authority parseAuthorityFromObject(Object object) {
        if (object == null) {
            return null;
        }
        try {
            Map<String, Object> map = (Map<String, Object>) object;
            String id = (String) map.get("id");
            short roles = parseShortFromObject(map.get("roles"));
            long authTime = parseLongFromObject(map.get("authTime"));
            return new Authority(id, roles, authTime);
        }
        catch (ClassCastException ex) {
            throw new ClassCastException();
        }
    }

    private UserAccount parseUserAccountFromObject(Object object) {
        if (object == null) {
            return null;
        }
        try {
            Map<String, Object> map = (Map<String, Object>) object;
            String id = (String) map.get("id");
            String name = (String) map.get("name");
            String password = (String) map.get("password");
            String passwordHash = (String) map.get("passwordHash");
            String passwordSalt = (String) map.get("passwordSalt");
            short roles = parseShortFromObject(map.get("roles"));
            return new UserAccount(id, name, password, passwordHash, passwordSalt, roles);
        }
        catch (ClassCastException ex) {
            throw new ClassCastException();
        }
    }

    public static class Request {
        private String function;
        private Authority authority;
        private Object[] arguments;

        public Request(String function, Authority authority, Object[] arguments) {
            this.function = function;
            this.authority = authority;
            this.arguments = arguments;
        }

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
