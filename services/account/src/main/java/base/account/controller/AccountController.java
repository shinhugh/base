package base.account.controller;

import base.account.service.AccountService;
import base.account.service.model.IllegalArgumentException;
import base.account.service.model.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class AccountController {
    private final AccountService accountService;
    private final Gson gson;

    public AccountController(AccountService accountService) {
        if (accountService == null) {
            throw new RuntimeException("Invalid accountService provided to AccountController constructor");
        }
        this.accountService = accountService;
        gson = new GsonBuilder().create();
    }

    public Response read(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to AccountController.read()");
        }
        Authority authority;
        try {
            authority = parseAuthority(request);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        String id = null;
        String name = null;
        if (request.getQuery() != null) {
            if (request.getQuery().get("id") != null && !request.getQuery().get("id").isEmpty()) {
                id = request.getQuery().get("id").get(0);
            }
            if (request.getQuery().get("name") != null && !request.getQuery().get("name").isEmpty()) {
                name = request.getQuery().get("name").get(0);
            }
        }
        Account output;
        try {
            output = accountService.read(authority, id, name);
        }
        catch (Exception e) {
            return new Response(mapExceptionToStatusCode(e), null, null);
        }
        Map<String, List<String>> responseHeaders = Map.of("content-type", List.of("application/json"));
        return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
    }

    public Response create(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to AccountController.create()");
        }
        Authority authority;
        try {
            authority = parseAuthority(request);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        if (request.getHeaders() == null || request.getHeaders().get("content-type") == null || request.getHeaders().get("content-type").isEmpty() || !"application/json".equals(request.getHeaders().get("content-type").get(0))) {
            return new Response((short) 400, null, null);
        }
        if (request.getBody() == null) {
            return new Response((short) 400, null, null);
        }
        Account account;
        try {
            account = gson.fromJson(new InputStreamReader(request.getBody(), StandardCharsets.UTF_8), Account.class);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        Account output;
        try {
            output = accountService.create(authority, account);
        }
        catch (Exception e) {
            return new Response(mapExceptionToStatusCode(e), null, null);
        }
        Map<String, List<String>> responseHeaders = Map.of("content-type", List.of("application/json"));
        return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
    }

    public Response update(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to AccountController.update()");
        }
        Authority authority;
        try {
            authority = parseAuthority(request);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        if (request.getHeaders() == null || request.getHeaders().get("content-type") == null || request.getHeaders().get("content-type").isEmpty() || !"application/json".equals(request.getHeaders().get("content-type").get(0))) {
            return new Response((short) 400, null, null);
        }
        if (request.getBody() == null) {
            return new Response((short) 400, null, null);
        }
        Account account;
        try {
            account = gson.fromJson(new InputStreamReader(request.getBody(), StandardCharsets.UTF_8), Account.class);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        String id = null;
        String name = null;
        if (request.getQuery() != null) {
            if (request.getQuery().get("id") != null && !request.getQuery().get("id").isEmpty()) {
                id = request.getQuery().get("id").get(0);
            }
            if (request.getQuery().get("name") != null && !request.getQuery().get("name").isEmpty()) {
                name = request.getQuery().get("name").get(0);
            }
        }
        Account output;
        try {
            output = accountService.update(authority, id, name, account);
        }
        catch (Exception e) {
            return new Response(mapExceptionToStatusCode(e), null, null);
        }
        Map<String, List<String>> responseHeaders = Map.of("content-type", List.of("application/json"));
        return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
    }

    public Response delete(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to AccountController.delete()");
        }
        Authority authority;
        try {
            authority = parseAuthority(request);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        String id = null;
        String name = null;
        if (request.getQuery() != null) {
            if (request.getQuery().get("id") != null && !request.getQuery().get("id").isEmpty()) {
                id = request.getQuery().get("id").get(0);
            }
            if (request.getQuery().get("name") != null && !request.getQuery().get("name").isEmpty()) {
                name = request.getQuery().get("name").get(0);
            }
        }
        try {
            accountService.delete(authority, id, name);
        }
        catch (Exception e) {
            return new Response(mapExceptionToStatusCode(e), null, null);
        }
        return new Response((short) 200, null, null);
    }

    private static Authority parseAuthority(Request request) throws Exception {
        if (request.getHeaders() == null) {
            return null;
        }
        Authority authority = new Authority();
        boolean isFieldSet = false;
        if (request.getHeaders().get("authority-id") != null && !request.getHeaders().get("authority-id").isEmpty() && request.getHeaders().get("authority-id").get(0).length() > 0) {
            authority.setId(request.getHeaders().get("authority-id").get(0));
            isFieldSet = true;
        }
        if (request.getHeaders().get("authority-roles") != null && !request.getHeaders().get("authority-roles").isEmpty() && request.getHeaders().get("authority-roles").get(0).length() > 0) {
            try {
                authority.setRoles(Short.parseShort(request.getHeaders().get("authority-roles").get(0)));
            }
            catch (Exception e) {
                throw new Exception();
            }
            isFieldSet = true;
        }
        if (request.getHeaders().get("authority-auth-time") != null && !request.getHeaders().get("authority-auth-time").isEmpty() && request.getHeaders().get("authority-auth-time").get(0).length() > 0) {
            try {
                authority.setAuthTime(Long.parseLong(request.getHeaders().get("authority-auth-time").get(0)));
            }
            catch (Exception e) {
                throw new Exception();
            }
            isFieldSet = true;
        }
        return isFieldSet ? authority : null;
    }

    private static short mapExceptionToStatusCode(Exception e) {
        if (e.getClass() == IllegalArgumentException.class) {
            return 400;
        }
        if (e.getClass() == AccessDeniedException.class) {
            return 401;
        }
        if (e.getClass() == NotFoundException.class) {
            return 404;
        }
        if (e.getClass() == ConflictException.class) {
            return 409;
        }
        System.out.println("Unexpected exception:\n" + e);
        return 500;
    }

    public static class Request {
        private Map<String, List<String>> headers;
        private Map<String, List<String>> query;
        private InputStream body;

        public Request(Map<String, List<String>> headers, Map<String, List<String>> query, InputStream body) {
            this.headers = headers;
            this.query = query;
            this.body = body;
        }

        public Map<String, List<String>> getHeaders() {
            return headers;
        }

        public void setHeaders(Map<String, List<String>> headers) {
            this.headers = headers;
        }

        public Map<String, List<String>> getQuery() {
            return query;
        }

        public void setQuery(Map<String, List<String>> query) {
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
        private Map<String, List<String>> headers;
        private InputStream body;

        public Response() { }

        public Response(short status, Map<String, List<String>> headers, InputStream body) {
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

        public Map<String, List<String>> getHeaders() {
            return headers;
        }

        public void setHeaders(Map<String, List<String>> headers) {
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
