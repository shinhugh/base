import { IllegalArgumentError } from './errors.js';
import { AuthenticationService } from './authentication-service.js';

class AuthenticationController {
  #authenticationService;

  constructor(authenticationService) {
    if (!(authenticationService instanceof AuthenticationService)) {
      throw new IllegalArgumentError();
    }
    this.#authenticationService = authenticationService;
  }

  async handle(request) {
    if (request == null || !validateRequest(request)) {
      throw new IllegalArgumentError();
    }
    // TODO: Implement
  }
}

const validateRequest = (request) => {
  if (request == null) {
    return true;
  }
  // TODO: Implement
  return true;
};

export {
  AuthenticationController
};
