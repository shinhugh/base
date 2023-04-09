package base.useraccount.controller;

import base.useraccount.model.IllegalArgumentException;
import base.useraccount.model.*;
import base.useraccount.service.UserAccountService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

public class UserAccountController {
    private final UserAccountService userAccountService;
    private final Gson gson;

    public UserAccountController(UserAccountService userAccountService) {
        if (userAccountService == null) {
            throw new RuntimeException();
        }
        this.userAccountService = userAccountService;
        gson = new GsonBuilder().create();
    }

    public Response read(Request request) {
        if (request == null) {
            throw new RuntimeException();
        }
        try {
            Authority authority = parseAuthority(request);
            String id = null;
            String name = null;
            if (request.query != null) {
                id = request.query.get("id");
                name = request.query.get("name");
            }
            UserAccount output;
            try {
                output = userAccountService.read(authority, id, name);
            }
            catch (AccessDeniedException ex) {
                return new Response((short) 401, null, null);
            }
            catch (IllegalArgumentException ex) {
                return new Response((short) 400, null, null);
            }
            catch (NotFoundException ex) {
                return new Response((short) 404, null, null);
            }
            Map<String, String> responseHeaders = Map.of("content-type", "application/json");
            return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
        }
        catch (Exception ex) {
            return new Response((short) 500, null, null);
        }
    }

    public Response create(Request request) {
        if (request == null) {
            throw new RuntimeException();
        }
        try {
            // TODO: Order of exceptions is wrong
            if (request.getHeaders() == null || !"application/json".equals(request.getHeaders().get("content-type"))) {
                return new Response((short) 400, null, null);
            }
            UserAccount userAccount;
            try {
                userAccount = gson.fromJson(new InputStreamReader(request.getBody(), StandardCharsets.UTF_8), UserAccount.class);
            }
            catch (JsonSyntaxException ex) {
                return new Response((short) 400, null, null);
            }
            Authority authority = parseAuthority(request);
            UserAccount output;
            try {
                output = userAccountService.create(authority, userAccount);
            }
            catch (IllegalArgumentException ex) {
                return new Response((short) 400, null, null);
            }
            catch (ConflictException ex) {
                return new Response((short) 409, null, null);
            }
            Map<String, String> responseHeaders = Map.of("content-type", "application/json");
            return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
        }
        catch (Exception ex) {
            return new Response((short) 500, null, null);
        }
    }

    public Response update(Request request) {
        if (request == null) {
            throw new RuntimeException();
        }
        try {
            // TODO: Order of exceptions is wrong
            if (request.getHeaders() == null || !"application/json".equals(request.getHeaders().get("content-type"))) {
                return new Response((short) 400, null, null);
            }
            UserAccount userAccount;
            try {
                userAccount = gson.fromJson(new InputStreamReader(request.getBody(), StandardCharsets.UTF_8), UserAccount.class);
            }
            catch (JsonSyntaxException ex) {
                return new Response((short) 400, null, null);
            }
            Authority authority = parseAuthority(request);
            String id = null;
            String name = null;
            if (request.query != null) {
                id = request.query.get("id");
                name = request.query.get("name");
            }
            UserAccount output;
            try {
                output = userAccountService.update(authority, id, name, userAccount);
            }
            catch (AccessDeniedException ex) {
                return new Response((short) 401, null, null);
            }
            catch (IllegalArgumentException ex) {
                return new Response((short) 400, null, null);
            }
            catch (NotFoundException ex) {
                return new Response((short) 404, null, null);
            }
            catch (ConflictException ex) {
                return new Response((short) 409, null, null);
            }
            Map<String, String> responseHeaders = Map.of("content-type", "application/json");
            return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
        }
        catch (Exception ex) {
            return new Response((short) 500, null, null);
        }
    }

    public Response delete(Request request) {
        if (request == null) {
            throw new RuntimeException();
        }
        try {
            Authority authority = parseAuthority(request);
            String id = null;
            String name = null;
            if (request.query != null) {
                id = request.query.get("id");
                name = request.query.get("name");
            }
            try {
                userAccountService.delete(authority, id, name);
            }
            catch (AccessDeniedException ex) {
                return new Response((short) 401, null, null);
            }
            catch (IllegalArgumentException ex) {
                return new Response((short) 400, null, null);
            }
            catch (NotFoundException ex) {
                return new Response((short) 404, null, null);
            }
            return new Response((short) 200, null, null);
        }
        catch (Exception ex) {
            return new Response((short) 500, null, null);
        }
    }

    private static Authority parseAuthority(Request request) {
        Authority authority = new Authority();
        if (request.getHeaders() == null) {
            return authority;
        }
        try {
            String id = request.getHeaders().get("authority-id");
            UUID.fromString(id);
            authority.setId(id);
        }
        catch (IllegalArgumentException ignored) { }
        try {
            authority.setRoles(Short.parseShort(request.getHeaders().get("authority-roles")));
        }
        catch (NumberFormatException ignored) { }
        try {
            authority.setAuthTime(Long.parseLong(request.getHeaders().get("authority-auth-time")));
        }
        catch (NumberFormatException ignored) { }
        return authority;
    }

    public static class Request {
        private String path;
        private String method;
        private Map<String, String> headers;
        private Map<String, String> query;
        private InputStream body;

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }

        public Map<String, String> getHeaders() {
            return headers;
        }

        public void setHeaders(Map<String, String> headers) {
            this.headers = headers;
        }

        public Map<String, String> getQuery() {
            return query;
        }

        public void setQuery(Map<String, String> query) {
            this.query = query;
        }

        public InputStream getBody() {
            return body;
        }

        public void setBody(InputStream body) {
            this.body = body;
        }
    }

    public static class Response {
        private short status;
        private Map<String, String> headers;
        private InputStream body;

        public Response() { }

        public Response(short status, Map<String, String> headers, InputStream body) {
            this.status = status;
            this.headers = headers;
            this.body = body;
        }

        public short getStatus() {
            return status;
        }

        public void setStatus(short status) {
            this.status = status;
        }

        public Map<String, String> getHeaders() {
            return headers;
        }

        public void setHeaders(Map<String, String> headers) {
            this.headers = headers;
        }

        public InputStream getBody() {
            return body;
        }

        public void setBody(InputStream body) {
            this.body = body;
        }
    }
}
