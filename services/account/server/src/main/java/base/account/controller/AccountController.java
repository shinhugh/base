package base.account.controller;

import base.account.service.AccountService;
import base.account.service.model.IllegalArgumentException;
import base.account.service.model.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
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
        try {
            Authority authority;
            try {
                authority = parseAuthority(request);
            }
            catch (Exception e) {
                return new Response((short) 400, null, null);
            }
            String id = null;
            String name = null;
            if (request.query != null) {
                id = request.query.get("id");
                name = request.query.get("name");
            }
            Account output;
            try {
                output = accountService.read(authority, id, name);
            }
            catch (IllegalArgumentException e) {
                return new Response((short) 400, null, null);
            }
            catch (AccessDeniedException e) {
                return new Response((short) 401, null, null);
            }
            catch (NotFoundException e) {
                return new Response((short) 404, null, null);
            }
            Map<String, String> responseHeaders = Map.of("content-type", "application/json");
            return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
        }
        catch (Exception e) {
            System.out.println("Unexpected exception: " + e.getMessage());
            return new Response((short) 500, null, null);
        }
    }

    public Response create(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to AccountController.create()");
        }
        try {
            Authority authority;
            try {
                authority = parseAuthority(request);
            }
            catch (Exception e) {
                return new Response((short) 400, null, null);
            }
            if (request.getHeaders() == null || !"application/json".equals(request.getHeaders().get("content-type"))) {
                return new Response((short) 400, null, null);
            }
            Account account;
            try {
                account = gson.fromJson(new InputStreamReader(request.getBody(), StandardCharsets.UTF_8), Account.class);
            }
            catch (JsonSyntaxException e) {
                return new Response((short) 400, null, null);
            }
            Account output;
            try {
                output = accountService.create(authority, account);
            }
            catch (IllegalArgumentException e) {
                return new Response((short) 400, null, null);
            }
            catch (ConflictException e) {
                return new Response((short) 409, null, null);
            }
            Map<String, String> responseHeaders = Map.of("content-type", "application/json");
            return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
        }
        catch (Exception e) {
            System.out.println("Unexpected exception: " + e.getMessage());
            return new Response((short) 500, null, null);
        }
    }

    public Response update(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to AccountController.update()");
        }
        try {
            Authority authority;
            try {
                authority = parseAuthority(request);
            }
            catch (Exception e) {
                return new Response((short) 400, null, null);
            }
            if (request.getHeaders() == null || !"application/json".equals(request.getHeaders().get("content-type"))) {
                return new Response((short) 400, null, null);
            }
            Account account;
            try {
                account = gson.fromJson(new InputStreamReader(request.getBody(), StandardCharsets.UTF_8), Account.class);
            }
            catch (JsonSyntaxException e) {
                return new Response((short) 400, null, null);
            }
            String id = null;
            String name = null;
            if (request.query != null) {
                id = request.query.get("id");
                name = request.query.get("name");
            }
            Account output;
            try {
                output = accountService.update(authority, id, name, account);
            }
            catch (IllegalArgumentException e) {
                return new Response((short) 400, null, null);
            }
            catch (AccessDeniedException e) {
                return new Response((short) 401, null, null);
            }
            catch (NotFoundException e) {
                return new Response((short) 404, null, null);
            }
            catch (ConflictException e) {
                return new Response((short) 409, null, null);
            }
            Map<String, String> responseHeaders = Map.of("content-type", "application/json");
            return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
        }
        catch (Exception e) {
            System.out.println("Unexpected exception: " + e.getMessage());
            return new Response((short) 500, null, null);
        }
    }

    public Response delete(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to AccountController.delete()");
        }
        try {
            Authority authority;
            try {
                authority = parseAuthority(request);
            }
            catch (Exception e) {
                return new Response((short) 400, null, null);
            }
            String id = null;
            String name = null;
            if (request.query != null) {
                id = request.query.get("id");
                name = request.query.get("name");
            }
            try {
                accountService.delete(authority, id, name);
            }
            catch (IllegalArgumentException e) {
                return new Response((short) 400, null, null);
            }
            catch (AccessDeniedException e) {
                return new Response((short) 401, null, null);
            }
            catch (NotFoundException e) {
                return new Response((short) 404, null, null);
            }
            return new Response((short) 200, null, null);
        }
        catch (Exception e) {
            System.out.println("Unexpected exception: " + e.getMessage());
            return new Response((short) 500, null, null);
        }
    }

    private static Authority parseAuthority(Request request) throws Exception {
        if (request.getHeaders() == null) {
            return null;
        }
        if (!request.getHeaders().containsKey("authority-id") && !request.getHeaders().containsKey("authority-roles") && !request.getHeaders().containsKey("authority-auth-time")) {
            return null;
        }
        Authority authority = new Authority();
        authority.setId(request.getHeaders().get("authority-id"));
        if (request.getHeaders().containsKey("authority-roles")) {
            try {
                authority.setRoles(Short.parseShort(request.getHeaders().get("authority-roles")));
            }
            catch (NumberFormatException e) {
                throw new Exception();
            }
        }
        if (request.getHeaders().containsKey("authority-auth-time")) {
            try {
                authority.setAuthTime(Long.parseLong(request.getHeaders().get("authority-auth-time")));
            }
            catch (NumberFormatException e) {
                throw new Exception();
            }
        }
        return authority;
    }

    public static class Request {
        private Map<String, String> headers;
        private Map<String, String> query;
        private InputStream body;

        public Request(Map<String, String> headers, Map<String, String> query, InputStream body) {
            this.headers = headers;
            this.query = query;
            this.body = body;
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
