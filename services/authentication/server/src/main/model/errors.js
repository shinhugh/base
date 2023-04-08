class AccessDeniedError extends Error {
  constructor() {
    super(accessDeniedErrorMessage);
    this.name = this.constructor.name;
  }
}

class IllegalArgumentError extends Error {
  constructor() {
    super(illegalArgumentErrorMessage);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends Error {
  constructor() {
    super(notFoundErrorMessage);
    this.name = this.constructor.name;
  }
}

class ConflictError extends Error {
  constructor() {
    super(conflictErrorMessage);
    this.name = this.constructor.name;
  }
}

const accessDeniedErrorMessage = 'Access denied';
const illegalArgumentErrorMessage = 'Illegal argument';
const notFoundErrorMessage = 'Not found';
const conflictErrorMessage = 'Conflict';

export {
  AccessDeniedError,
  IllegalArgumentError,
  NotFoundError,
  ConflictError
};
