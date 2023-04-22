import express from 'express';

class Server {
  #app;
  #endpoints;
  #internalErrorCallback;
  #notFoundCallback;
  #methodNotAllowedCallback;
  #port;

  constructor(config) {
    this.#configure(config);
    this.#app = express();
    this.#app.use(express.raw({
      type: () => { return true; }
    }));
    this.#app.disable('x-powered-by');
    this.#app.all('/*', async (req, res) => {
      await handleRequest(req, res, this.#endpoints, this.#internalErrorCallback, this.#notFoundCallback, this.#methodNotAllowedCallback);
    });
  }

  start() {
    this.#app.listen(this.#port);
  }

  #configure(config) {
    if (config == null) {
      throw new Error('Invalid config provided to Server constructor');
    }
    if (typeof config !== 'object') {
      throw new Error('Invalid config provided to Server constructor');
    }
    this.#endpoints = { };
    if (config.endpoints != null) {
      if (typeof config.endpoints !== 'object') {
        throw new Error('Invalid config provided to Server constructor');
      }
      for (const path in config.endpoints) {
        if (config.endpoints[path] != null) {
          this.#endpoints[path] = { };
          if (typeof config.endpoints[path] !== 'object') {
            throw new Error('Invalid config provided to Server constructor');
          }
          for (const method in config.endpoints[path]) {
            if (config.endpoints[path][method] != null) {
              if (typeof config.endpoints[path][method] !== 'function') {
                throw new Error('Invalid config provided to Server constructor');
              }
              this.#endpoints[path][method] = config.endpoints[path][method];
            }
          }
          if (Object.keys(this.#endpoints[path]).length == 0) {
            delete this.#endpoints[path];
          }
        }
      }
    }
    if (typeof config.internalErrorCallback !== 'function') {
      throw new Error('Invalid config provided to Server constructor');
    }
    this.#internalErrorCallback = config.internalErrorCallback;
    if (typeof config.notFoundCallback !== 'function') {
      throw new Error('Invalid config provided to Server constructor');
    }
    this.#notFoundCallback = config.notFoundCallback;
    if (typeof config.methodNotAllowedCallback !== 'function') {
      throw new Error('Invalid config provided to Server constructor');
    }
    this.#methodNotAllowedCallback = config.methodNotAllowedCallback;
    if (config.port == null) {
      this.#port = 80;
    }
    else {
      if (!Number.isInteger(config.port) || config.port < 0 || config.port > portMaxValue) {
        throw new Error('Invalid config provided to Server constructor');
      }
      this.#port = config.port;
    }
  }
}

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
        if (!(response.headers[headerKey] instanceof Array)) {
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
  if (response.body != null && !(response.body instanceof Buffer)) {
    return false;
  }
  return true;
};

const handleRequest = async (req, res, endpoints, internalErrorCallback, notFoundCallback, methodNotAllowedCallback) => {
  const request = { };
  translateRequest(req, request);
  const response = await (async () => {
    if (endpoints[request.path] == null) {
      return await notFoundCallback(request);
    }
    const endpoint = (() => {
      for (const method in endpoints[request.path]) {
        if (method.toLowerCase() === request.method.toLowerCase()) {
          return endpoints[request.path][method];
        }
      }
      return undefined;
    })();
    if (endpoint == null) {
      return await methodNotAllowedCallback(request);
    }
    return await endpoint(request);
  })();
  if (response == null || !validateResponse(response)) {
    response = await internalErrorCallback(request);
  }
  translateResponse(response, res);
};

const translateRequest = (req, request) => {
  request.path = req.path;
  request.method = req.method;
  request.headers = { };
  request.queryParameters = { };
  for (const headerKey in req.headers) {
    if (request.headers[headerKey] == null) {
      request.headers[headerKey] = [ ];
    }
    const headerValues = req.headers[headerKey].split(',');
    for (const headerValue of headerValues) {
      request.headers[headerKey].push(headerValue.trim());
    }
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
  if (req.body != null && req.body.length > 0) {
    request.body = req.body;
  }
};

const translateResponse = (response, res) => {
  if (response == null || !validateResponse(response)) {
    response = {
      status: 500
    };
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

const portMaxValue = 65535;
const statusMinValue = 100;
const statusMaxValue = 599;

export {
  Server
};
