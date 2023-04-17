import { validate as validateUuid } from 'uuid';
import express from 'express';
import { HttpBridge } from './http-bridge.js';

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
      const requestBody = Buffer.from(JSON.stringify(idToken));
      const identifyRequest = {
        host: identifyEndpoint.host,
        port: identifyEndpoint.port,
        path: identifyEndpoint.path,
        method: identifyEndpoint.method,
        headers: {
          'authority-roles': [ '1' ],
          'content-type': [ 'application/json' ],
          'content-length': [ requestBody.length.toString() ]
        },
        body: requestBody
      };
      let identifyResponse;
      try {
        identifyResponse = await httpClient.sendRequest(identifyRequest);
      }
      catch {
        console.error('Failed to send request to authentication service for identification');
        res.status(500).end();
        return;
      }
      if (identifyResponse == null || !validateResponse(identifyResponse) || identifyResponse.status != 200) {
        console.error('Invalid response received from identification call');
        res.status(500).end();
        return;
      }
      if (identifyResponse.headers == null || identifyResponse.headers['content-type'] == null || identifyResponse.headers['content-type'].length != 1 || !identifyResponse.headers['content-type'][0].includes('application/json')) {
        console.error('Invalid response received from identification call');
        res.status(500).end();
        return;
      }
      if (identifyResponse.body == null) {
        console.error('Invalid response received from identification call');
        res.status(500).end();
        return;
      }
      try {
        authority = JSON.parse(identifyResponse.body.toString());
      }
      catch {
        console.error('Failed to parse body in identification call response');
        res.status(500).end();
        return;
      }
      if (!validateAuthority(authority)) {
        console.error('Invalid authority received from identification call');
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
    queryParameters: { }
  };
  for (const headerKey in req.headers) {
    if (request.headers[headerKey] == null) {
      request.headers[headerKey] = [ ];
    }
    const headerValues = req.headers[headerKey].split(',');
    for (const headerValue of headerValues) {
      request.headers[headerKey].push(headerValue.trim());
    }
  }
  if (authority?.id != null) {
    request.headers['authority-id'] = [ authority.id ];
  }
  else {
    delete request.headers['authority-id'];
  }
  if (authority?.roles != null) {
    request.headers['authority-roles'] = [ authority.roles.toString() ];
  }
  else {
    delete request.headers['authority-roles'];
  }
  if (authority?.authTime != null) {
    request.headers['authority-auth-time'] = [ authority.authTime.toString() ];
  }
  else {
    delete request.headers['authority-auth-time'];
  }
  delete request.headers.authorization;
  if (request.headers.host != null) {
    request.headers.host = [ request.host + ':' + request.port ];
  }
  for (const queryParameterKey in req.query) {
    if (request.queryParameters[queryParameterKey] == null) {
      request.queryParameters[queryParameterKey] = [ ];
    }
    if (typeof req.query[queryParameterKey] === 'string') {
      request.queryParameters[queryParameterKey].push(req.query[queryParameterKey]);
    }
    else {
      for (const queryParameterValue of req.query[queryParameterKey]) {
        request.queryParameters[queryParameterKey].push(queryParameterValue);
      }
    }
  }
  if (Object.keys(request.headers).length == 0) {
    delete request.headers;
  }
  if (Object.keys(request.queryParameters).length == 0) {
    delete request.queryParameters;
  }
  if (req.body != null && req.headers['content-length'] != null) {
    request.body = req.body;
  }
  let response;
  try {
    response = await httpClient.sendRequest(request);
  }
  catch {
    console.error('Failed to send request to destination service');
    res.status(500).end();
    return;
  }
  if (response == null || !validateResponse(response)) {
    console.error('Invalid response received from destination service');
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
  port: 8081,
  path: '/identify',
  method: 'get'
};

// Use environment variables for production; hard-coded for testing only
const endpoints = {
  '/api/login': {
    'post': {
      host: 'localhost',
      port: 8081,
      path: '/login',
      method: 'post'
    }
  },
  '/api/logout': {
    'post': {
      host: 'localhost',
      port: 8081,
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
const rolesMaxValue = 255;
const timeMaxValue = 4294967295;
const app = express();
const httpClient = new HttpBridge();

app.use(express.raw({
  type: () => { return true; }
}));
app.disable('x-powered-by');
app.all('*', handleRequest);
app.listen(80); // Use environment variables for production; hard-coded for testing only
