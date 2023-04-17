import { AccountServiceClient } from './account-service-client.js';
import { wrapError } from '../common.js';
import { HttpClient } from './http-client.js';
import { AccessDeniedError, IllegalArgumentError, NotFoundError } from './model/errors.js';

class AccountServiceBridge extends AccountServiceClient {
  #httpClient;
  #config;

  constructor(httpClient, config) {
    super();
    if (!(httpClient instanceof HttpClient)) {
      throw new Error('Invalid httpClient provided to AccountServiceBridge constructor');
    }
    if (config == null || !validateConfig(config)) {
      throw new Error('Invalid config provided to AccountServiceBridge constructor');
    }
    this.#httpClient = httpClient;
    this.#config = {
      host: config.host,
      port: config.port
    };
  }

  async readByName(authority, name) {
    if (!validateAuthorityTypeOnly(authority)) {
      throw new IllegalArgumentError();
    }
    if (name != null && typeof name !== 'string') {
      throw new IllegalArgumentError();
    }
    const request = {
      host: this.#config.host,
      port: this.#config.port,
      path: '/account',
      method: 'get',
      queryParameters: {
        name: [ name ]
      }
    };
    const requestHeaders = (() => {
      if (authority == null) {
        return undefined;
      }
      const requestHeaders = { };
      if (authority.id != null) {
        requestHeaders['authority-id'] = [ authority.id ];
      }
      if (authority.roles != null) {
        requestHeaders['authority-roles'] = [ authority.roles.toString() ];
      }
      if (authority.authTime != null) {
        requestHeaders['authority-auth-time'] = [ authority.authTime.toString() ];
      }
      return Object.keys(requestHeaders).length == 0 ? undefined : requestHeaders;
    })();
    if (requestHeaders != null) {
      request.headers = requestHeaders;
    }
    let response;
    try {
      response = await this.#httpClient.sendRequest(request);
    }
    catch (e) {
      throw wrapError(e, 'Failed to send request to account service');
    }
    switch (response.status) {
      case 200: {
        try {
          return JSON.parse(response.body.toString());
        }
        catch (e) {
          throw wrapError(e, 'Malformed response received from account service');
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
        throw new Error('Unrecognized status code received from account service');
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

const validateAuthorityTypeOnly = (authority) => {
  if (authority == null) {
    return true;
  }
  if (typeof authority !== 'object') {
    return false;
  }
  if (authority.id != null && typeof authority.id !== 'string') {
    return false;
  }
  if (authority.roles != null && !Number.isInteger(authority.roles)) {
    return false;
  }
  if (authority.authTime != null && !Number.isInteger(authority.authTime)) {
    return false;
  }
  return true;
};

const portMaxValue = 65535;

export {
  AccountServiceBridge
};
