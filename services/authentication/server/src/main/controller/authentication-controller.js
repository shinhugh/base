import { Controller } from './controller.js';
import { AccessDeniedError, IllegalArgumentError, NotFoundError, ConflictError } from '../model/errors.js';
import { AuthenticationService } from '../service/authentication-service.js';

class AuthenticationController {
  #controller = new Controller({
    '/identify': {
      get: async (request) => {
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
        catch {
          return {
            status: 400
          };
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
    },
    '/login': {
      post: async (request) => {
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
        catch {
          return {
            status: 400
          };
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
    },
    '/logout': {
      post: async (request) => {
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
        catch {
          return {
            status: 400
          };
        }
        const authority = parseAuthority(request);
        return await invokeAndInterceptDomainError(async () => {
          await this.#authenticationService.logout(authority, logoutInfo);
          return {
            status: 200
          }
        });
      }
    }
  });
  #authenticationService;

  constructor(authenticationService) {
    if (!(authenticationService instanceof AuthenticationService)) {
      throw new Error();
    }
    this.#authenticationService = authenticationService;
  }

  async handle(request) {
    return await this.#controller.handle(request);
  }
}

const parseAuthority = (request) => {
  const authority = {
    id: request.headers?.['authority-id'],
    roles: request.headers?.['authority-roles'],
    authTime: request.headers?.['authority-auth-time']
  };
  if (authority.roles != null) {
    authority.roles = Number(authority.roles);
  }
  if (authority.authTime != null) {
    authority.authTime = Number(authority.authTime);
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

export {
  AuthenticationController
};
