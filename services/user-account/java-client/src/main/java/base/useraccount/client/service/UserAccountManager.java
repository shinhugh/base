package base.useraccount.client.service;

import base.useraccount.client.model.IllegalArgumentException;
import base.useraccount.client.model.*;
import com.google.gson.Gson;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.LogType;

import java.util.Map;

public class UserAccountManager implements UserAccountService {
    private static final String FUNCTION_NAME = "base_userAccountService";
    private final Gson gson = new Gson();

    @Override
    public String create(Authority authority, UserAccount userAccount) {
        Object[] args = new Object[1];
        args[0] = userAccount;
        return (String) makeRequest("create", authority, args);
    }

    @Override
    public UserAccount readById(Authority authority, String id) {
        Object[] args = new Object[1];
        args[0] = id;
        return parseUserAccountFromMap((Map<String, Object>) makeRequest("readById", authority, args));
    }

    @Override
    public UserAccount readByName(Authority authority, String name) {
        Object[] args = new Object[1];
        args[0] = name;
        return parseUserAccountFromMap((Map<String, Object>) makeRequest("readByName", authority, args));
    }

    @Override
    public void updateById(Authority authority, String id, UserAccount userAccount) {
        Object[] args = new Object[2];
        args[0] = id;
        args[1] = userAccount;
        makeRequest("updateById", authority, args);
    }

    @Override
    public void deleteById(Authority authority, String id) {
        Object[] args = new Object[1];
        args[0] = id;
        makeRequest("deleteById", authority, args);
    }

    private Object makeRequest(String funcName, Authority authority, Object[] args) {
        try (LambdaClient client = LambdaClient.builder().build()) {
            Request request = new Request(funcName, authority, args);
            InvokeRequest requestWrapper = InvokeRequest.builder()
                    .functionName(FUNCTION_NAME)
                    .logType(LogType.NONE)
                    .payload(SdkBytes.fromUtf8String(gson.toJson(request)))
                    .build();
            InvokeResponse responseWrapper = client.invoke(requestWrapper);
            Response response = gson.fromJson(responseWrapper.payload().asUtf8String(), Response.class);
            if (response.getResult() == null) {
                return response.getPayload();
            }
            switch (response.getResult()) {
                case IllegalArgumentError:
                    throw new IllegalArgumentException();
                case AccessDeniedError:
                    throw new AccessDeniedException();
                case NotFoundError:
                    throw new NotFoundException();
                case ConflictError:
                    throw new ConflictException();
                default:
                    return response.getPayload();
            }
        }
    }

    private UserAccount parseUserAccountFromMap(Map<String, Object> map) {
        if (map == null) {
            return null;
        }
        String name = (String) map.get("name");
        String passwordHash = (String) map.get("passwordHash");
        String passwordSalt = (String) map.get("passwordSalt");
        short roles = (short) (double) map.get("roles");
        return new UserAccount(null, name, passwordHash, passwordSalt, roles);
    }

    private static class Request {
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

    private static class Response {
        private Result result;
        private Object payload;

        public Result getResult() {
            return result;
        }

        public void setResult(Result result) {
            this.result = result;
        }

        public Object getPayload() {
            return payload;
        }

        public void setPayload(Object payload) {
            this.payload = payload;
        }

        public enum Result {
            IllegalArgumentError,
            AccessDeniedError,
            NotFoundError,
            ConflictError
        }
    }
}
