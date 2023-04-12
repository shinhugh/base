import { validate as validateUuid } from 'uuid';
import { AccessDeniedError, IllegalArgumentError, NotFoundError, ConflictError } from '../model/errors.js';
import { AuthenticationService } from '../service/authentication-service.js';

class AuthenticationController {
  #authenticationService;

  constructor(authenticationService) {
    if (!(authenticationService instanceof AuthenticationService)) {
      throw new Error('AuthenticationController constructor failed');
    }
    this.#authenticationService = authenticationService;
  }

  async identify(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to AuthenticationController.identify()');
    }
    try {
      // TODO: Order of errors is wrong
      if (request.headers?.['content-type'] !== 'application/json') {
        return {
          status: 400
        }
      }
      let token;
      try {
        token = JSON.parse(request.body.toString());
      }
      catch (e) {
        if (e instanceof SyntaxError) {
          return {
            status: 400
          };
        }
        throw e;
      }
      const authority = parseAuthority(request);
      return await invokeAndInterceptDomainError(async () => {
        return {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: Buffer.from(JSON.stringify(await this.#authenticationService.identify(authority, token)))
        };
      });
    }
    catch (e) {
      console.error('Unexpected error: ' + e.message);
      return {
        status: 500
      };
    }
  }

  async login(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to AuthenticationController.login()');
    }
    try {
      // TODO: Order of errors is wrong
      if (request.headers?.['content-type'] !== 'application/json') {
        return {
          status: 400
        }
      }
      let loginInfo;
      try {
        loginInfo = JSON.parse(request.body.toString());
      }
      catch (e) {
        if (e instanceof SyntaxError) {
          return {
            status: 400
          };
        }
        throw e;
      }
      const authority = parseAuthority(request);
      return await invokeAndInterceptDomainError(async () => {
        return {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: Buffer.from(JSON.stringify(await this.#authenticationService.login(authority, loginInfo)))
        }
      });
    }
    catch (e) {
      console.error('Unexpected error: ' + e.message);
      return {
        status: 500
      };
    }
  }

  async logout(request) {
    if (request == null || !validateRequest(request)) {
      throw new Error('Invalid request provided to AuthenticationController.logout()');
    }
    try {
      // TODO: Order of errors is wrong
      if (request.headers?.['content-type'] !== 'application/json') {
        return {
          status: 400
        }
      }
      let logoutInfo;
      try {
        logoutInfo = JSON.parse(request.body.toString());
      }
      catch (e) {
        if (e instanceof SyntaxError) {
          return {
            status: 400
          };
        }
        throw e;
      }
      const authority = parseAuthority(request);
      return await invokeAndInterceptDomainError(async () => {
        await this.#authenticationService.logout(authority, logoutInfo);
        return {
          status: 200
        }
      });
    }
    catch (e) {
      console.error('Unexpected error: ' + e.message);
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

const invokeAndInterceptDomainError = async (routine) => {
  try {
    return await routine();
  }
  catch (e) {
    if (e instanceof IllegalArgumentError) {
      return {
        status: 400
      }
    }
    if (e instanceof AccessDeniedError) {
      return {
        status: 401
      }
    }
    if (e instanceof NotFoundError) {
      return {
        status: 404
      }
    }
    if (e instanceof ConflictError) {
      return {
        status: 409
      }
    }
    throw e;
  }
};

const rolesMaxValue = 255;
const timeMaxValue = 4294967295;

export {
  AuthenticationController
};
