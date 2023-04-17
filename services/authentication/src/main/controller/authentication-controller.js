import { AccessDeniedError, IllegalArgumentError } from '../service/model/errors.js';
import { AuthenticationService } from '../service/authentication-service.js';

class AuthenticationController {
  #authenticationService;

  constructor(authenticationService) {
    if (!(authenticationService instanceof AuthenticationService)) {
      throw new Error('Invalid authenticationService provided to AuthenticationController constructor');
    }
    this.#authenticationService = authenticationService;
  }

  async identify(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to AuthenticationController.identify()');
    }
    const authority = parseAuthority(request);
    if (request.headers == null || request.headers['content-type'] == null || request.headers['content-type'].length != 1 || !request.headers['content-type'][0].includes('application/json')) {
      return {
        status: 400
      };
    }
    let token;
    try {
      token = JSON.parse(request.body.toString());
    }
    catch {
      return {
        status: 400
      };
    }
    let output;
    try {
      output = await this.#authenticationService.identify(authority, token);
    }
    catch (e) {
      return {
        status: mapErrorToStatusCode(e)
      };
    }
    return {
      status: 200,
      headers: {
        'content-type': [ 'application/json' ]
      },
      body: Buffer.from(JSON.stringify(output))
    };
  }

  async login(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to AuthenticationController.login()');
    }
    const authority = parseAuthority(request);
    if (request.headers == null || request.headers['content-type'] == null || request.headers['content-type'].length != 1 || !request.headers['content-type'][0].includes('application/json')) {
      return {
        status: 400
      };
    }
    let loginInfo;
    try {
      loginInfo = JSON.parse(request.body.toString());
    }
    catch {
      return {
        status: 400
      };
    }
    let output;
    try {
      output = await this.#authenticationService.login(authority, loginInfo);
    }
    catch (e) {
      return {
        status: mapErrorToStatusCode(e)
      };
    }
    return {
      status: 200,
      headers: {
        'content-type': [ 'application/json' ]
      },
      body: Buffer.from(JSON.stringify(output))
    };
  }

  async logout(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to AuthenticationController.logout()');
    }
    const authority = parseAuthority(request);
    if (request.headers == null || request.headers['content-type'] == null || request.headers['content-type'].length != 1 || !request.headers['content-type'][0].includes('application/json')) {
      return {
        status: 400
      };
    }
    let logoutInfo;
    try {
      logoutInfo = JSON.parse(request.body.toString());
    }
    catch {
      return {
        status: 400
      };
    }
    try {
      await this.#authenticationService.logout(authority, logoutInfo);
    }
    catch (e) {
      return {
        status: mapErrorToStatusCode(e)
      };
    }
    return {
      status: 200
    };
  }
}

const validateRequest = (request) => {
  if (request == null) {
    return true;
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
    for (const headerKey in request.headers) {
      if (request.headers[headerKey] != null) {
        if (typeof request.headers[headerKey] !== 'object' || typeof request.headers[headerKey].constructor !== 'function' || request.headers[headerKey].constructor.name !== 'Array') {
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
        if (typeof request.queryParameters[queryParameterKey] !== 'object' || typeof request.queryParameters[queryParameterKey].constructor !== 'function' || request.queryParameters[queryParameterKey].constructor.name !== 'Array') {
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
  if (request.body != null) {
    if (typeof request.body !== 'object' || typeof request.body.constructor !== 'function' || request.body.constructor.name !== 'Buffer') {
      return false;
    }
  }
  return true;
};

const parseAuthority = (request) => {
  if (request.headers == null) {
    return null;
  }
  const authority = { };
  if (request.headers['authority-id'] != null && request.headers['authority-id'].length > 0) {
    authority.id = request.headers['authority-id'][0];
  }
  if (request.headers['authority-roles'] != null && request.headers['authority-roles'].length > 0) {
    authority.roles = Number(request.headers['authority-roles'][0]);
  }
  if (request.headers['authority-auth-time'] != null && request.headers['authority-auth-time'].length > 0) {
    authority.authTime = Number(request.headers['authority-auth-time'][0]);
  }
  return Object.keys(authority).length == 0 ? null : authority;
};

const mapErrorToStatusCode = (e) => {
  if (e instanceof IllegalArgumentError) {
    return 400;
  }
  if (e instanceof AccessDeniedError) {
    return 401;
  }
  console.error('Unexpected error:\n' + e);
  if (typeof e.inner === 'object') {
    console.error('Inner error:\n' + e.inner);
  }
  return 500;
};

export {
  AuthenticationController
};