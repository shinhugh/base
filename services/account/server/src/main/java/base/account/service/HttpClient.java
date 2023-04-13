package base.account.service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

public interface HttpClient {
    Response sendRequest(Request request);

    class Request {
        private String host;
        private int port;
        private String path;
        private Method method;
        private Map<String, List<String>> headers;
        private Map<String, List<String>> query;
        private InputStream body;

        public Request(String host, int port, String path, Method method, Map<String, List<String>> headers, Map<String, List<String>> query, InputStream body) {
            this.host = host;
            this.port = port;
            this.path = path;
            this.method = method;
            this.headers = headers;
            this.query = query;
            this.body = body;
        }

        public String getHost() {
            return host;
        }

        public void setHost(String host) {
            this.host = host;
        }

        public int getPort() {
            return port;
        }

        public void setPort(int port) {
            this.port = port;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public Method getMethod() {
            return method;
        }

        public void setMethod(Method method) {
            this.method = method;
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

    class Response {
        private short status;
        private Map<String, List<String>> headers;
        private InputStream body;

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

    enum Method {
        GET,
        POST,
        PUT,
        DELETE
    }
}
