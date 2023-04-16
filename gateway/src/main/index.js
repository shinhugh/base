import { request as httpRequest } from 'http';
import express from 'express';

const handleRequest = async (req, res) => {
  const endpoint = endpoints[req.path]?.[req.method.toLowerCase()];
  if (endpoint == null) {
    res.status(404).end();
    return;
  }
  let authority;
  if (req.headers != null && req.headers.authorization != null) {
    const authorizationHeaderValueSegments = req.headers.authorization.split(' ');
    if (authorizationHeaderValueSegments.length == 2 && authorizationHeaderValueSegments[0] === 'Bearer') {
      const idToken = authorizationHeaderValueSegments[1];
      const identifyRequest = {
        host: identifyEndpoint.host,
        port: identifyEndpoint.port,
        path: identifyEndpoint.path,
        method: identifyEndpoint.method,
        headers: {
          'authority-roles': '1'
        },
        body: Buffer.from(JSON.stringify({
          idToken: idToken
        }))
      };
      const identifyResponse = await sendRequest(identifyRequest);
      if (identifyResponse == null || !validateResponse(response) || identifyResponse.status != 200) {
        res.status(500).end();
        return;
      }
      if (identifyResponse.headers == null || identifyResponse.headers['content-type'] !== 'application/json' || identifyResponse.body == null) {
        res.status(500).end();
        return;
      }
      try {
        authority = JSON.parse(identifyResponse.body.toString());
      }
      catch {
        res.status(500).end();
        return;
      }
      if (!validateAuthority(authority)) {
        res.status(500).end();
        return;
      }
    }
  }
  const request = {
    host: endpoint.host,
    port: endpoint.port,
    path: endpoint.path,
    method: endpoint.method,
    headers: { },
    query: { }
  };
  if (authority != null) {
    if (authority.id != null) {
      request.headers['authority-id'] = [ authority.id ];
    }
    if (authority.roles != null) {
      request.headers['authority-roles'] = [ authority.roles.toString() ];
    }
    if (authority.authTime != null) {
      request.headers['authority-auth-time'] = [ authority.authTime.toString() ];
    }
  }
  for (const headerKey in req.headers) {
    if (request.headers[headerKey] == null) {
      request.headers[headerKey] = [ ];
    }
    const headerValues = req.headers[headerKey].split(',');
    for (const headerValue of headerValues) {
      request.headers[headerKey].push(headerValue.trim());
    }
  }
  for (const queryKey in req.query) {
    if (request.query[queryKey] == null) {
      request.query[queryKey] = [ ];
    }
    if (typeof req.query[queryKey] === 'string') {
      request.query[queryKey].push(req.query[queryKey]);
    }
    else {
      for (const queryValue of req.query[queryKey]) {
        request.query[queryKey].push(queryValue);
      }
    }
  }
  if (Object.keys(request.headers).length == 0) {
    delete request.headers;
  }
  if (Object.keys(request.query).length == 0) {
    delete request.query;
  }
  if (req.body != null && req.headers['content-length'] != null) {
    request.body = req.body;
  }
  const response = await sendRequest(request);
  if (response == null || !validateResponse(response)) {
    res.status(500).end();
    return;
  }
  res.status(response.status);
  for (const headerKey in response.headers) {
    if (response.headers[headerKey] == null || response.headers[headerKey].length == 0) {
      res.set(headerKey, '');
    }
    else {
      if (response.headers[headerKey].length == 1) {
        const headerValue = response.headers[headerKey][0];
        res.set(headerKey, headerValue == null ? '' : headerValue);
      }
      else {
        const headerValues = [ ];
        for (const headerValue of response.headers[headerKey]) {
          headerValues.push(headerValue == null ? '' : headerValue);
        }
        res.set(headerKey, headerValues);
      }
    }
  }
  if (response.body == null) {
    res.end();
  }
  else {
    res.send(response.body);
  }
};

// {
//   host,
//   port,
//   path,
//   method,
//   headers,
//   query,
//   body
// }
const sendRequest = async (request) => {
  let queryString = '';
  for (const queryKey in request.query) {
    for (const queryValue of request.query[queryKey]) {
      if (queryString.length == 0) {
        queryString += '?';
      }
      else {
        queryString += '&';
      }
      queryString += queryKey;
      if (queryValue.length > 0) {
        queryString += '=';
        queryString += queryValue;
      }
    }
  }
  const requestHeaders = { };
  for (const headerKey in request.headers) {
    if (request.headers[headerKey].length == 1) {
      requestHeaders[headerKey] = request.headers[headerKey][0];
    }
    else {
      requestHeaders[headerKey] = request.headers[headerKey];
    }
  }
  const options = {
    hostname: request.host,
    port: request.port,
    path: request.path + queryString,
    method: request.method,
    headers: requestHeaders
  };
  return await new Promise((resolve, reject) => {
    const req = httpRequest(options, res => {
      const headers = { };
      for (const headerKey in res.headers) {
        if (headers[headerKey] == null) {
          headers[headerKey] = [ ];
        }
        if (typeof res.headers[headerKey] === 'string') {
          headers[headerKey].push(res.headers[headerKey]);
        }
        else {
          for (const headerValue of res.headers[headerKey]) {
            headers[headerKey].push(headerValue);
          }
        }
      }
      let body = [ ];
      res.on('data', chunk => {
        body.push(chunk);
      });
      res.on('end', () => {
        const result = {
          status: res.statusCode
        };
        if (Object.keys(headers).length > 0) {
          result.headers = headers;
        }
        if (body.length > 0) {
          result.body = Buffer.concat(body);
        }
        resolve(result);
      });
    });
    req.on('error', (e) => { // TODO: Error info? Remove e
      console.log(e); // DEBUG
      reject();
    });
    if (request.body != null) {
      req.write(request.body);
    }
    req.end();
  });
};

const validateAuthority = (authority) => {
  if (authority == null) {
    return true;
  }
  if (typeof authority !== 'object') {
    return false;
  }
  if (authority.id != null && (typeof authority.id !== 'string' || !validateUuid(authority.id))) {
    return false;
  }
  if (authority.roles != null && (!Number.isInteger(authority.roles) || authority.roles < 0 || authority.roles > rolesMaxValue)) {
    return false;
  }
  if (authority.authTime != null && (!Number.isInteger(authority.authTime) || authority.authTime < 0 || authority.authTime > timeMaxValue)) {
    return false;
  }
  return true;
};

const validateResponse = (response) => {
  if (response == null) {
    return true;
  }
  if (typeof response !== 'object') {
    return false;
  }
  if (!Number.isInteger(response.status) || response.status < statusMinValue || response.status > statusMaxValue) {
    return false;
  }
  if (response.headers != null) {
    if (typeof response.headers !== 'object') {
      return false;
    }
    for (const headerKey in response.headers) {
      if (response.headers[headerKey] != null) {
        if (typeof response.headers[headerKey] !== 'object' || typeof response.headers[headerKey].constructor !== 'function' || response.headers[headerKey].constructor.name !== 'Array') {
          return false;
        }
        for (const headerValue of response.headers[headerKey]) {
          if (headerValue != null && typeof headerValue !== 'string') {
            return false;
          }
        }
      }
    }
  }
  if (response.body != null && (typeof response.body !== 'object' || typeof response.body.constructor !== 'function' || response.body.constructor.name !== 'Buffer')) {
    return false;
  }
  return true;
};

const identifyEndpoint = {
  host: 'localhost',
  port: 8000,
  path: '/identify',
  method: 'get'
};

const endpoints = {
  '/api/login': {
    'post': {
      host: 'localhost',
      port: 8000,
      path: '/login',
      method: 'post'
    }
  },
  '/api/logout': {
    'post': {
      host: 'localhost',
      port: 8000,
      path: '/logout',
      method: 'post'
    }
  },
  '/api/account': {
    'get': {
      host: 'localhost',
      port: 8080,
      path: '/account',
      method: 'get'
    },
    'post': {
      host: 'localhost',
      port: 8080,
      path: '/account',
      method: 'post'
    },
    'put': {
      host: 'localhost',
      port: 8080,
      path: '/account',
      method: 'put'
    },
    'delete': {
      host: 'localhost',
      port: 8080,
      path: '/account',
      method: 'delete'
    }
  }
};

const statusMinValue = 100;
const statusMaxValue = 599;
const app = express();

app.use(express.raw({
  type: () => { return true; }
}));
app.disable('x-powered-by');
app.all('*', handleRequest);
app.listen(8081); // TODO: Use port 80
