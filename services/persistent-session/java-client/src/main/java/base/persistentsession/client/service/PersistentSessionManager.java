package base.persistentsession.client.service;

import base.persistentsession.client.model.*;
import base.persistentsession.client.model.IllegalArgumentException;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.LogType;

public class PersistentSessionManager implements PersistentSessionService {
    private static final String FUNCTION_NAME = "base_persistentSessionService";
    private final Gson gson = new Gson();

    @Override
    public String create(Authority authority, PersistentSession persistentSession) {
        Object[] args = new Object[1];
        args[0] = persistentSession;
        return makeRequest("create", authority, args);
    }

    @Override
    public PersistentSession readById(Authority authority, String id) {
        Object[] args = new Object[1];
        args[0] = id;
        return makeRequest("readById", authority, args);
    }

    @Override
    public PersistentSession readByRefreshToken(Authority authority, String refreshToken) {
        Object[] args = new Object[1];
        args[0] = refreshToken;
        return makeRequest("readByRefreshToken", authority, args);
    }

    @Override
    public void deleteByUserAccountId(Authority authority, String userAccountId) {
        Object[] args = new Object[1];
        args[0] = userAccountId;
        makeRequest("deleteByUserAccountId", authority, args);
    }

    @Override
    public void deleteByRefreshToken(Authority authority, String refreshToken) {
        Object[] args = new Object[1];
        args[0] = refreshToken;
        makeRequest("deleteByRefreshToken", authority, args);
    }

    private <T> T makeRequest(String funcName, Authority authority, Object[] args) {
        try (LambdaClient client = LambdaClient.builder().build()) {
            InvokeRequestPayload request = new InvokeRequestPayload(funcName, authority, args);
            InvokeRequest requestWrapper = InvokeRequest.builder()
                    .functionName(FUNCTION_NAME)
                    .logType(LogType.NONE)
                    .payload(SdkBytes.fromUtf8String(gson.toJson(request)))
                    .build();
            InvokeResponse responseWrapper = client.invoke(requestWrapper);
            InvokeResponsePayload response = gson.fromJson(responseWrapper.payload().asUtf8String(), InvokeResponsePayload.class);
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
                    return gson.fromJson(response.getPayload(), (new TypeToken<T>() { }).getType());
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
        private String payload;

        public Result getResult() {
            return result;
        }

        public void setResult(Result result) {
            this.result = result;
        }

        public String getPayload() {
            return payload;
        }

        public void setPayload(String payload) {
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
