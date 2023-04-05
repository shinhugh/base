package base.persistentsession.client.service;

import base.persistentsession.client.model.IllegalArgumentException;
import base.persistentsession.client.model.*;
import com.google.gson.Gson;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.LogType;

import java.util.Map;

public class PersistentSessionManager implements PersistentSessionService {
    private static final String FUNCTION_NAME = "base_persistentSessionService";
    private final Gson gson = new Gson();

    @Override
    public PersistentSession create(Authority authority, PersistentSession persistentSession) {
        Object[] args = new Object[1];
        args[0] = persistentSession;
        return parsePersistentSessionFromObject(makeRequest("create", authority, args));
    }

    @Override
    public PersistentSession readById(Authority authority, String id) {
        Object[] args = new Object[1];
        args[0] = id;
        return parsePersistentSessionFromObject(makeRequest("readById", authority, args));
    }

    @Override
    public PersistentSession readByRefreshToken(Authority authority, String refreshToken) {
        Object[] args = new Object[1];
        args[0] = refreshToken;
        return parsePersistentSessionFromObject(makeRequest("readByRefreshToken", authority, args));
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

    private PersistentSession parsePersistentSessionFromObject(Object object) {
        if (object == null) {
            return null;
        }
        try {
            Map<String, Object> map = (Map<String, Object>) object;
            String id = (String) map.get("id");
            String userAccountId = (String) map.get("userAccountId");
            short roles = parseShortFromObject(map.get("roles"));
            String refreshToken = (String) map.get("refreshToken");
            long creationTime = parseLongFromObject(map.get("creationTime"));
            long expirationTime = parseLongFromObject(map.get("expirationTime"));
            return new PersistentSession(id, userAccountId, roles, refreshToken, creationTime, expirationTime);
        }
        catch (ClassCastException ex) {
            throw new ClassCastException();
        }
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
