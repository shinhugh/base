import express from 'express';

class Server {
  #app;
  #endpoints;
  #port;

  constructor(endpoints, port) {
    if (endpoints == null || !validateEndpoints(endpoints)) {
      throw new Error('Invalid endpoints provided to Server constructor');
    }
    if (!Number.isInteger(port) || port < 0 || port > portMaxValue) {
      throw new Error('Invalid port provided to Server constructor');
    }
    this.#app = express();
    this.#app.use(express.raw({
      type: () => { return true; }
    }));
    this.#app.disable('x-powered-by');
    this.#app.all('/*', async (req, res) => {
      await handleRequest(req, res, this.#endpoints);
    });
    this.#endpoints = { };
    for (const path in endpoints) {
      this.#endpoints[path] = { };
      for (const method in endpoints[path]) {
        this.#endpoints[path][method] = endpoints[path][method];
      }
    }
    this.#port = port;
  }

  start() {
    this.#app.listen(this.#port);
  }
}

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

const handleRequest = async (req, res, endpoints) => {
  const request = {
    path: req.path,
    method: req.method,
    headers: req.headers,
    query: req.query
  };
  if (req.headers['content-length'] != null) {
    request.body = req.body;
  }
  const response = await (async () => {
    if (endpoints[request.path] == null) {
      return {
        status: 404
      };
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
      return {
        status: 405
      };
    }
    return await endpoint(request);
  })();
  res.status(response.status);
  for (const headerName in response.headers) {
    res.set(headerName, response.headers[headerName]);
  }
  if (response.body == null) {
    res.end();
  }
  else {
    res.send(response.body);
  }
};

const portMaxValue = 65535;

export {
  Server
};
