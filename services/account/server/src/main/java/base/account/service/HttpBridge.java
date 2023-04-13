package base.account.service;

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
    public Response sendRequest(Request request) {
        StringBuilder queryString = new StringBuilder();
        for (Map.Entry<String, List<String>> entry : request.getQuery().entrySet()) {
            for (String value : entry.getValue()) {
                if (queryString.length() == 0) {
                    queryString.append('?');
                }
                else {
                    queryString.append('&');
                }
                queryString.append(entry.getKey());
                queryString.append('=');
                queryString.append(value);
            }
        }
        String urlString = String.format(URL_FORMAT, request.getHost(), request.getPort(), request.getPath(), queryString);
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
                throw wrapException(e, String.format("Failed to create connection object for HTTP endpoint: %s", urlString));
            }
            try {
                connection.setRequestMethod(request.getMethod().toString());
            }
            catch (Exception e) {
                throw wrapException(e, String.format("Failed to set request method: %s", request.getMethod().toString()));
            }
            if (request.getHeaders() != null) {
                for (Map.Entry<String, List<String>> entry : request.getHeaders().entrySet()) {
                    if (!entry.getValue().isEmpty()) {
                        StringBuilder headerValues = new StringBuilder();
                        for (String headerValue : entry.getValue()) {
                            if (headerValues.length() != 0) {
                                headerValues.append(',');
                            }
                            headerValues.append(headerValue);
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
            short status;
            try {
                status = (short) connection.getResponseCode();
            }
            catch (Exception e) {
                throw wrapException(e, "Failed to extract status code from response");
            }
            InputStream responseBodyStream;
            if (status != 400) { // TODO: For which status codes am I allowed to invoke getInputStream()?
                try {
                    responseBodyStream = connection.getInputStream();
                }
                catch (Exception e) {
                    throw wrapException(e, "Failed to create response body stream");
                }
            }
            else {
                try {
                    responseBodyStream = connection.getErrorStream();
                }
                catch (Exception e) {
                    throw wrapException(e, "Failed to create response body stream");
                }
            }
            Map<String, List<String>> responseHeaders = Map.of(); // TODO: Use connection.getHeaderFields()
            return new Response(status, responseHeaders, responseBodyStream);
        }
        finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
