package base.account.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Map;

import static base.account.Common.wrapException;

public class HttpBridge implements HttpClient {
    private static final String URL_FORMAT = "http://%s:%d%s%s";

    @Override
    public Response sendRequest(Request request) { // TODO: Should this method declare exceptions?
        StringBuilder queryString = new StringBuilder();
        if (request.getQuery() != null) {
            for (Map.Entry<String, List<String>> entry : request.getQuery().entrySet()) {
                if (entry.getKey() != null && entry.getKey().length() > 0) {
                    if (entry.getValue() == null || entry.getValue().isEmpty()) {
                        if (queryString.length() == 0) {
                            queryString.append('?');
                        }
                        else {
                            queryString.append('&');
                        }
                        queryString.append(entry.getKey());
                    }
                    else {
                        for (String value : entry.getValue()) {
                            if (queryString.length() == 0) {
                                queryString.append('?');
                            }
                            else {
                                queryString.append('&');
                            }
                            queryString.append(entry.getKey());
                            if (value != null && value.length() > 0) {
                                queryString.append('=');
                                queryString.append(value);
                            }
                        }
                    }
                }
            }
        }
        String requestHost;
        if (request.getHost() == null || request.getHost().length() == 0) {
            requestHost = "localhost";
        }
        else {
            requestHost = request.getHost();
        }
        String requestPath;
        if (request.getPath() == null || request.getPath().length() == 0) {
            requestPath = "/";
        }
        else {
            requestPath = request.getPath();
        }
        String urlString = String.format(URL_FORMAT, requestHost, request.getPort(), requestPath, queryString);
        URL url;
        try {
            url = new URL(urlString);
        }
        catch (Exception e) {
            throw wrapException(e, String.format("Failed to create URL: %s", urlString));
        }
        HttpURLConnection connection = null;
        try {
            try {
                connection = (HttpURLConnection) url.openConnection();
            }
            catch (Exception e) {
                throw wrapException(e, "Failed to create connection object");
            }
            try {
                connection.setRequestMethod(request.getMethod().toString());
            }
            catch (Exception e) {
                throw wrapException(e, String.format("Failed to set request method: %s", request.getMethod().toString()));
            }
            if (request.getHeaders() != null) {
                for (Map.Entry<String, List<String>> entry : request.getHeaders().entrySet()) {
                    if (entry.getKey() != null && entry.getKey().length() > 0) {
                        StringBuilder headerValues = new StringBuilder();
                        if (entry.getValue() != null) {
                            for (String headerValue : entry.getValue()) {
                                if (headerValue != null && headerValue.length() > 0) {
                                    if (headerValues.length() != 0) {
                                        headerValues.append(',');
                                    }
                                    headerValues.append(headerValue);
                                }
                            }
                        }
                        connection.setRequestProperty(entry.getKey(), headerValues.toString());
                    }
                }
            }
            connection.setUseCaches(false);
            connection.setDoOutput(true);
            if (request.getBody() != null) {
                OutputStream requestBodyStream;
                try {
                    requestBodyStream = connection.getOutputStream();
                }
                catch (Exception e) {
                    throw wrapException(e, "Failed to create request body stream");
                }
                try {
                    request.getBody().transferTo(requestBodyStream);
                }
                catch (Exception e) {
                    throw wrapException(e, "Failed to write to request body stream");
                }
            }
            try {
                connection.connect();
            }
            catch (Exception e) {
                throw wrapException(e, String.format("Failed to connect to HTTP endpoint: %s", urlString));
            }
            short status;
            try {
                status = (short) connection.getResponseCode();
            }
            catch (Exception e) {
                throw wrapException(e, "Failed to extract status code from response");
            }
            Map<String, List<String>> responseHeaders = null;
            if (connection.getHeaderFields() != null && !connection.getHeaderFields().isEmpty()) {
                responseHeaders = connection.getHeaderFields();
            }
            InputStream responseBodySourceStream;
            if (status < 400) {
                try {
                    responseBodySourceStream = connection.getInputStream();
                }
                catch (Exception e) {
                    throw wrapException(e, "Failed to create response body stream");
                }
            }
            else {
                try {
                    responseBodySourceStream = connection.getErrorStream();
                }
                catch (Exception e) {
                    throw wrapException(e, "Failed to create response body stream");
                }
            }
            ByteArrayOutputStream responseBodyDestinationStream = new ByteArrayOutputStream();
            try {
                responseBodySourceStream.transferTo(responseBodyDestinationStream);
            }
            catch (Exception e) {
                throw wrapException(e, "Failed to read from response body stream");
            }
            InputStream responseBodyStream = null;
            if (responseBodyDestinationStream.size() > 0) {
                responseBodyStream = new ByteArrayInputStream(responseBodyDestinationStream.toByteArray());
            }
            return new Response(status, responseHeaders, responseBodyStream);
        }
        finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
