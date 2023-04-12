import { get } from 'http';
import { validate as validateUuid } from 'uuid';
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

  async read(authority, name) {
    if (!validateAuthority(authority)) {
      throw new Error('Invalid authority provided to AccountServiceClient.read()');
    }
    if (name != null && typeof name !== 'string') {
      throw new IllegalArgumentError();
    }
    const requestHeaders = (() => {
      if (authority == null || (authority.id == null && authority.roles == null && authority.authTime == null)) {
        return undefined;
      }
      const output = { };
      if (authority.id != null) {
        output['authority-id'] = authority.id;
      }
      if (authority.roles != null) {
        output['authority-roles'] = authority.roles;
      }
      if (authority.authTime != null) {
        output['authority-auth-time'] = authority.authTime;
      }
      return output;
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
        throw new Error('Connection to Account service failed');
      }
    })();
    switch (response.status) {
      case 200: {
        try {
          return JSON.parse(response.body.toString());
        }
        catch {
          throw new Error('Unexpected response body format received from Account service');
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
        throw new Error('Unexpected status code received from Account service');
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

const portMaxValue = 65535;
const rolesMaxValue = 255;
const timeMaxValue = 4294967295;

export {
  AccountServiceClient
};
