import { get } from 'http';
import { AccessDeniedError, IllegalArgumentError, NotFoundError } from './model/errors.js';

class AccountServiceClient {
  #config;

  constructor(config) {
    if (config == null || !validateConfig(config)) {
      throw new Error('Invalid config provided to AccountServiceClient constructor');
    }
    this.#config = {
      host: config.host,
      port: config.port
    };
  }

  async readByName(authority, name) {
    if (name != null && typeof name !== 'string') {
      throw new IllegalArgumentError();
    }
    const requestHeaders = (() => {
      if (authority == null || typeof authority !== 'object') {
        return undefined;
      }
      const output = { };
      if (typeof authority.id == 'string') {
        output['authority-id'] = authority.id;
      }
      if (typeof authority.roles == 'string') {
        output['authority-roles'] = authority.roles;
      }
      if (typeof authority.authTime == 'string') {
        output['authority-auth-time'] = authority.authTime;
      }
      return Object.keys(authority).length == 0 ? undefined : output;
    })();
    const requestOptions = {
      hostname: this.#config.host,
      port: this.#config.port,
      path: "/account?name=" + name
    };
    if (requestHeaders != null) {
      requestOptions.headers = requestHeaders;
    }
    const response = await (async () => {
      try {
        return await new Promise((resolve, reject) => {
          get(requestOptions, res => {
            let body = [];
            res.on('data', chunk => {
              body.push(chunk);
            });
            res.on('end', () => {
              if (body.length == 0) {
                resolve({
                  status: res.statusCode,
                  headers: res.headers
                })
              }
              else {
                resolve({
                  status: res.statusCode,
                  headers: res.headers,
                  body: Buffer.concat(body)
                });
              }
            });
          })
          .on('error', () => {
            reject();
          });
        });
      }
      catch {
        throw new Error('Unexpected error: Failed to connect to account service endpoint');
      }
    })();
    switch (response.status) {
      case 200: {
        try {
          return JSON.parse(response.body.toString());
        }
        catch {
          throw new Error('Unexpected error: Malformed response received from account service');
        }
      }
      case 400: {
        throw new IllegalArgumentError();
      }
      case 401: {
        throw new AccessDeniedError();
      }
      case 404: {
        throw new NotFoundError();
      }
      default: {
        throw new Error('Unexpected error: Unrecognized status code received from account service');
      }
    }
  }
}

const validateConfig = (config) => {
  if (config == null) {
    return true;
  }
  if (typeof config !== 'object') {
    return false;
  }
  if (typeof config.host !== 'string') {
    return false;
  }
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > portMaxValue) {
    return false;
  }
  return true;
};

const portMaxValue = 65535;

export {
  AccountServiceClient
};
