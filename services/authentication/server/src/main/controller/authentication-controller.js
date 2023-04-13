import { AccessDeniedError, IllegalArgumentError, NotFoundError, ConflictError } from '../service/model/errors.js';
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
    if (request.headers?.['content-type'] !== 'application/json') {
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
        'content-type': 'application/json'
      },
      body: Buffer.from(JSON.stringify(output))
    };
  }

  async login(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to AuthenticationController.login()');
    }
    const authority = parseAuthority(request);
    if (request.headers?.['content-type'] !== 'application/json') {
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
        'content-type': 'application/json'
      },
      body: Buffer.from(JSON.stringify(output))
    };
  }

  async logout(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to AuthenticationController.logout()');
    }
    const authority = parseAuthority(request);
    if (request.headers?.['content-type'] !== 'application/json') {
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
    for (const headerName in request.headers) { // TODO: Support multiple values per key
      if (typeof request.headers[headerName] !== 'string') {
        return false;
      }
    }
  }
  if (request.query != null) {
    if (typeof request.query !== 'object') {
      return false;
    }
    for (const queryName in request.query) { // TODO: Support multiple values per key
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

const parseAuthority = (request) => {
  if (request.headers == null) {
    return null;
  }
  if (request.headers['authority-id'] == null && request.headers['authority-roles'] == null && request.headers['authority-auth-time'] == null) {
    return null;
  }
  const authority = { };
  if (request.headers['authority-id'] != null) {
    authority.id = request.headers['authority-id'];
  }
  if (request.headers['authority-roles'] != null) {
    authority.roles = Number(request.headers['authority-roles']);
  }
  if (request.headers['authority-auth-time'] != null) {
    authority.authTime = Number(request.headers['authority-auth-time']);
  }
  return authority;
};

const mapErrorToStatusCode = (e) => {
  if (e instanceof IllegalArgumentError) {
    return 400;
  }
  if (e instanceof AccessDeniedError) {
    return 401;
  }
  if (e instanceof NotFoundError) {
    return 404;
  }
  if (e instanceof ConflictError) {
    return 409;
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
