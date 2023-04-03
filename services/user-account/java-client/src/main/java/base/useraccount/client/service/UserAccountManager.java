package base.useraccount.client.service;

import base.useraccount.client.model.*;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.LogType;

import java.lang.IllegalArgumentException;
import java.lang.reflect.Type;

public class UserAccountManager implements UserAccountService {
    private static final String FUNCTION_NAME = "base_userAccountService";
    private final Gson gson = new Gson();

    @Override
    public String create(Authority authority, UserAccount userAccount) {
        Object[] args = new Object[1];
        args[0] = userAccount;
        return (String) makeRequest("create", authority, args, String.class);
    }

    @Override
    public UserAccount readById(Authority authority, String id) {
        Object[] args = new Object[1];
        args[0] = id;
        return (UserAccount) makeRequest("readById", authority, args, UserAccount.class);
    }

    @Override
    public UserAccount readByName(Authority authority, String name) {
        Object[] args = new Object[1];
        args[0] = name;
        return (UserAccount) makeRequest("readByName", authority, args, UserAccount.class);
    }

    @Override
    public void updateById(Authority authority, String id, UserAccount userAccount) {
        Object[] args = new Object[2];
        args[0] = id;
        args[1] = userAccount;
        makeRequest("updateById", authority, args, String.class);
    }

    @Override
    public void deleteById(Authority authority, String id) {
        Object[] args = new Object[1];
        args[0] = id;
        makeRequest("deleteById", authority, args, null);
    }

    private Object makeRequest(String funcName, Authority authority, Object[] args, Type payloadType) {
        try (LambdaClient client = LambdaClient.builder().build()) {
            InvokeRequestPayload request = new InvokeRequestPayload(funcName, authority, args);
            InvokeRequest requestWrapper = InvokeRequest.builder()
                    .functionName(FUNCTION_NAME)
                    .logType(LogType.NONE)
                    .payload(SdkBytes.fromUtf8String(gson.toJson(request)))
                    .build();
            InvokeResponse responseWrapper = client.invoke(requestWrapper);
            InvokeResponsePayload response = gson.fromJson(responseWrapper.payload().asUtf8String(), TypeToken.getParameterized(InvokeResponsePayload.class, payloadType == null ? Object.class : payloadType).getType());
            if (response.getResult() == null) {
                return payloadType == null ? null : response.getPayload();
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
                    return payloadType == null ? null : response.getPayload();
            }
        }
    }

    private static class InvokeRequestPayload {
        private String function;
        private Authority authority;
        private Object[] arguments;

        public InvokeRequestPayload(String function, Authority authority, Object[] arguments) {
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

    private static class InvokeResponsePayload {
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
