class Controller {
  #endpoints;

  constructor(endpoints) {
    if (endpoints == null || !validateEndpoints(endpoints)) {
      throw new Error();
    }
    this.#endpoints = endpoints;
  }

  async handle(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error();
    }
    try {
      if (this.#endpoints[request.path] == null) {
        return {
          status: 404
        };
      }
      const endpoint = (() => {
        for (const method in this.#endpoints[request.path]) {
          if (method.toLowerCase() === request.method.toLowerCase()) {
            return this.#endpoints[request.path][method];
          }
        }
        return undefined;
      })();
      if (endpoint == null) {
        return {
          status: 405
        };
      }
      return await endpoint(request);
    }
    catch {
      return {
        status: 500
      };
    }
  }
}

const validateRequest = (request) => {
  if (request == null) {
    return true;
  }
  if (typeof request !== 'object') {
    return false;
  }
  if (typeof request.path !== 'string') {
    return false;
  }
  if (typeof request.method !== 'string') {
    return false;
  }
  if (request.headers != null) {
    if (typeof request.headers !== 'object') {
      return false;
    }
    for (const headerName in request.headers) {
      if (typeof request.headers[headerName] !== 'string') {
        return false;
      }
    }
  }
  if (request.query != null) {
    if (typeof request.query !== 'object') {
      return false;
    }
    for (const queryName in request.query) {
      if (typeof request.query[queryName] !== 'string') {
        return false;
      }
    }
  }
  if (request.body != null && (typeof request.body !== 'object' || typeof request.body.constructor !== 'function' || request.body.constructor.name !== 'Buffer')) {
    return false;
  }
  return true;
};

const validateEndpoints = (endpoints) => {
  if (endpoints == null) {
    return true;
  }
  if (typeof endpoints !== 'object') {
    return false;
  }
  for (const path in endpoints) {
    if (typeof endpoints[path] !== 'object') {
      return false;
    }
    for (const method in endpoints[path]) {
      if (typeof endpoints[path][method] !== 'function') {
        return false;
      }
    }
  }
  return true;
};

export {
  Controller
};
