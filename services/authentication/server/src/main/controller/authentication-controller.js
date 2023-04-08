import { Controller } from './controller.js';
import { AccessDeniedError, IllegalArgumentError, NotFoundError, ConflictError } from '../model/errors.js';
import { AuthenticationService } from '../service/authentication-service.js';

class AuthenticationController {
  #controller = new Controller({
    '/identify': {
      get: async (request) => {
        // TODO: Verify that content-type is correct
        // TODO: Keep error order in mind
        const authority = parseAuthority(request);
        const token = JSON.parse(request.body.toString()); // TODO: Handle parse error
        return await invokeAndInterceptDomainError(async () => {
          return {
            status: 200,
            body: Buffer.from(JSON.stringify(await this.#authenticationService.identify(authority, token)))
          };
        });
      }
    },
    '/login': {
      post: async (request) => {
        // TODO: Verify that content-type is correct
        // TODO: Keep error order in mind
        const authority = parseAuthority(request);
        const loginInfo = JSON.parse(request.body.toString()); // TODO: Handle parse error
        return await invokeAndInterceptDomainError(async () => {
          return {
            status: 200,
            body: Buffer.from(JSON.stringify(await this.#authenticationService.login(authority, loginInfo)))
          }
        });
      }
    },
    '/logout': {
      post: async (request) => {
        // TODO: Verify that content-type is correct
        // TODO: Keep error order in mind
        const authority = parseAuthority(request);
        const logoutInfo = JSON.parse(request.body.toString()); // TODO: Handle parse error
        return await invokeAndInterceptDomainError(async () => {
          return {
            status: 200,
            body: Buffer.from(JSON.stringify(await this.#authenticationService.logout(authority, logoutInfo)))
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
    console.debug(e); // DEBUG
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
