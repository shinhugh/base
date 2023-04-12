class RepositoryIllegalArgumentError extends Error {
  constructor() {
    super(repositoryIllegalArgumentErrorMessage);
    this.name = this.constructor.name;
  }
}

class RepositoryConflictError extends Error {
  constructor() {
    super(repositoryConflictErrorMessage);
    this.name = this.constructor.name;
  }
}

const repositoryIllegalArgumentErrorMessage = 'Illegal argument';
const repositoryConflictErrorMessage = 'Conflict';

export {
  RepositoryIllegalArgumentError,
  RepositoryConflictError
};
