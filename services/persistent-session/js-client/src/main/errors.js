class IllegalArgumentError extends Error {
  constructor() {
    super(illegalArgumentErrorMessage);
    this.name = this.constructor.name;
  }
}

class AccessDeniedError extends Error {
  constructor() {
    super(accessDeniedErrorMessage);
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

const illegalArgumentErrorMessage = 'Illegal argument';
const accessDeniedErrorMessage = 'Access denied';
const notFoundErrorMessage = 'Not found';
const conflictErrorMessage = 'Conflict';

export {
  IllegalArgumentError,
  AccessDeniedError,
  NotFoundError,
  ConflictError
};
