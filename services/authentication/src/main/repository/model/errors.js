class IllegalArgumentError extends Error {
  constructor() {
    super(IllegalArgumentErrorMessage);
    this.name = this.constructor.name;
  }
}

class ConflictError extends Error {
  constructor() {
    super(ConflictErrorMessage);
    this.name = this.constructor.name;
  }
}

const IllegalArgumentErrorMessage = 'Illegal argument';
const ConflictErrorMessage = 'Conflict';

export {
  IllegalArgumentError,
  ConflictError
};
