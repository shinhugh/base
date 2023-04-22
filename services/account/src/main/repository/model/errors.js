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

const illegalArgumentErrorMessage = 'Illegal argument';
const notFoundErrorMessage = 'Not found';
const conflictErrorMessage = 'Conflict';

export {
  IllegalArgumentError,
  NotFoundError,
  ConflictError
};
