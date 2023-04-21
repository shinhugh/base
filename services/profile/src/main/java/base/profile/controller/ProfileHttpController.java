package base.profile.controller;

import base.profile.service.ProfileService;
import base.profile.service.model.IllegalArgumentException;
import base.profile.service.model.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class ProfileHttpController {
    private final ProfileService profileService;
    private final Gson gson;

    public ProfileHttpController(ProfileService profileService) {
        if (profileService == null) {
            throw new RuntimeException("Invalid profileService provided to ProfileHttpController constructor");
        }
        this.profileService = profileService;
        gson = new GsonBuilder().create();
    }

    public Response readProfile(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to ProfileHttpController.read()");
        }
        Authority authority;
        try {
            authority = parseAuthority(request);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        String accountId = null;
        String name = null;
        if (request.getQueryParameters() != null) {
            if (request.getQueryParameters().get("id") != null && !request.getQueryParameters().get("id").isEmpty()) {
                accountId = request.getQueryParameters().get("id").get(0);
            }
            if (request.getQueryParameters().get("name") != null && !request.getQueryParameters().get("name").isEmpty()) {
                name = request.getQueryParameters().get("name").get(0);
            }
        }
        Profile[] output;
        try {
            output = profileService.readProfiles(authority, accountId, name);
        }
        catch (Exception e) {
            return new Response(mapExceptionToStatusCode(e), null, null);
        }
        Map<String, List<String>> responseHeaders = Map.of("content-type", List.of("application/json"));
        return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
    }

    public Response createProfile(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to ProfileHttpController.create()");
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
        Profile profile;
        try {
            profile = gson.fromJson(new InputStreamReader(request.getBody(), StandardCharsets.UTF_8), Profile.class);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        Profile output;
        try {
            output = profileService.createProfile(authority, profile);
        }
        catch (Exception e) {
            return new Response(mapExceptionToStatusCode(e), null, null);
        }
        Map<String, List<String>> responseHeaders = Map.of("content-type", List.of("application/json"));
        return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
    }

    public Response updateProfile(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to ProfileHttpController.update()");
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
        Profile profile;
        try {
            profile = gson.fromJson(new InputStreamReader(request.getBody(), StandardCharsets.UTF_8), Profile.class);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        String accountId = null;
        if (request.getQueryParameters() != null) {
            if (request.getQueryParameters().get("id") != null && !request.getQueryParameters().get("id").isEmpty()) {
                accountId = request.getQueryParameters().get("id").get(0);
            }
        }
        Profile output;
        try {
            output = profileService.updateProfile(authority, accountId, profile);
        }
        catch (Exception e) {
            return new Response(mapExceptionToStatusCode(e), null, null);
        }
        Map<String, List<String>> responseHeaders = Map.of("content-type", List.of("application/json"));
        return new Response((short) 200, responseHeaders, new ByteArrayInputStream(gson.toJson(output).getBytes(StandardCharsets.UTF_8)));
    }

    public Response deleteProfile(Request request) {
        if (request == null) {
            throw new RuntimeException("Invalid request provided to ProfileHttpController.delete()");
        }
        Authority authority;
        try {
            authority = parseAuthority(request);
        }
        catch (Exception e) {
            return new Response((short) 400, null, null);
        }
        String accountId = null;
        if (request.getQueryParameters() != null) {
            if (request.getQueryParameters().get("id") != null && !request.getQueryParameters().get("id").isEmpty()) {
                accountId = request.getQueryParameters().get("id").get(0);
            }
        }
        try {
            profileService.deleteProfile(authority, accountId);
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
        private Map<String, List<String>> queryParameters;
        private InputStream body;

        public Request(Map<String, List<String>> headers, Map<String, List<String>> queryParameters, InputStream body) {
            this.headers = headers;
            this.queryParameters = queryParameters;
            this.body = body;
        }

        public Map<String, List<String>> getHeaders() {
            return headers;
        }

        public void setHeaders(Map<String, List<String>> headers) {
            this.headers = headers;
        }

        public Map<String, List<String>> getQueryParameters() {
            return queryParameters;
        }

        public void setQueryParameters(Map<String, List<String>> queryParameters) {
            this.queryParameters = queryParameters;
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
