import { request as httpRequest } from 'http';
import { HttpClient } from './http-client.js';

class HttpBridge extends HttpClient {
  async sendRequest(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to HttpBridge.sendRequest()');
    }
    const queryString = (() => {
      let queryString = '';
      for (const queryParameterKey in request.queryParameters) {
        if (request.queryParameters[queryParameterKey] == null || request.queryParameters[queryParameterKey].length == 0) {
          if (queryString.length == 0) {
            queryString += '?';
          }
          else {
            queryString += '&';
          }
          queryString += queryParameterKey;
        }
        else {
          for (const queryParameterValue of request.queryParameters[queryParameterKey]) {
            if (queryString.length == 0) {
              queryString += '?';
            }
            else {
              queryString += '&';
            }
            queryString += queryParameterKey;
            if (queryParameterValue != null && queryParameterValue.length > 0) {
              queryString += '=';
              queryString += queryParameterValue;
            }
          }
        }
      }
      return queryString;
    })();
    const options = {
      hostname: request.host,
      port: request.port,
      path: request.path + queryString,
      method: request.method.toUpperCase()
    };
    const headers = (() => {
      const headers = { };
      for (const headerKey in request.headers) {
        if (request.headers[headerKey] == null || request.headers[headerKey].length == 0) {
          headers[headerKey] = '';
        }
        else if (request.headers[headerKey].length == 1) {
          headers[headerKey] = request.headers[headerKey][0] ?? '';
        }
        else {
          headers[headerKey] = [ ];
          for (const headerValue of request.headers[headerKey]) {
            headers[headerKey].push(headerValue ?? '');
          }
        }
      }
      return Object.keys(headers).length > 0 ? headers : undefined;
    })();
    if (headers != null) {
      options.headers = headers;
    }
    return await new Promise((resolve, reject) => {
      const req = httpRequest(options, res => {
        const headers = (() => {
          const headers = { };
          for (const headerKey in res.headers) {
            headers[headerKey] = [ ];
            const headerValues = res.headers[headerKey].split(',');
            for (const headerValue of headerValues) {
              headers[headerKey].push(headerValue.trim());
            }
          }
          return Object.keys(headers).length > 0 ? headers : undefined;
        })();
        const body = [ ];
        res.on('data', chunk => {
          body.push(chunk);
        });
        res.on('end', () => {
          const response = {
            status: res.statusCode
          };
          if (headers != null) {
            response.headers = headers;
          }
          if (body.length > 0) {
            response.body = Buffer.concat(body);
          }
          resolve(response);
        });
      });
      req.on('error', () => {
        reject(new Error('Failed to send request'));
      });
      if (request.body != null) {
        req.write(request.body);
      }
      req.end();
    });
  }
}

const validateRequest = (request) => {
  if (request == null) {
    return true;
  }
  if (typeof request.host !== 'string') {
    return false;
  }
  if (!Number.isInteger(request.port)) {
    return false;
  }
  if (typeof request.path !== 'string') {
    return false;
  }
  try {
    new URL('http://' + request.host + ':' + request.port + request.path);
  }
  catch {
    return false;
  }
  if (typeof request.method !== 'string') {
    return false;
  }
  if (request.headers != null) {
    if (typeof request.headers !== 'object') {
      return false;
    }
    for (const headerKey in request.headers) {
      if (request.headers[headerKey] != null) {
        if (!(request.headers[headerKey] instanceof Array)) {
          return false;
        }
        for (const headerValue of request.headers[headerKey]) {
          if (headerValue != null && typeof headerValue !== 'string') {
            return false;
          }
        }
      }
    }
  }
  if (request.queryParameters != null) {
    if (typeof request.queryParameters !== 'object') {
      return false;
    }
    for (const queryParameterKey in request.queryParameters) {
      if (request.queryParameters[queryParameterKey] != null) {
        if (!(request.queryParameters[queryParameterKey] instanceof Array)) {
          return false;
        }
        for (const queryParameterValue of request.queryParameters[queryParameterKey]) {
          if (queryParameterValue != null && typeof queryParameterValue !== 'string') {
            return false;
          }
        }
      }
    }
  }
  if (request.body != null && !(request.body instanceof Buffer)) {
    return false;
  }
  return true;
};

export {
  HttpBridge
};
