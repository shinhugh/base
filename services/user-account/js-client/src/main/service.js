import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

class UserAccountService {
  async create(authority, userAccount) {
    return await makeRequest('create', authority, [ userAccount ]);
  }

  async readById(authority, id) {
    return await makeRequest('readById', authority, [ id ]);
  }

  async readByName(authority, name) {
    return await makeRequest('readByName', authority, [ name ]);
  }

  async updateById(authority, id, userAccount) {
    return await makeRequest('updateById', authority, [ id, userAccount ]);
  }

  async deleteById(authority, id) {
    return await makeRequest('deleteById', authority, [ id ]);
  }
}

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

const makeRequest = async (funcName, authority, args) => {
  const client = new LambdaClient();
  const request = {
    function: funcName,
    authority: authority,
    arguments: args
  };
  const requestWrapper = new InvokeCommand({
    FunctionName: 'base_userAccountService',
    LogType: 'None',
    Payload: JSON.stringify(request)
  });
  const responseWrapper = await client.send(requestWrapper);
  const response = JSON.parse(Buffer.from(responseWrapper.Payload));
  switch (response.result) {
    case 'IllegalArgumentError':
      throw new IllegalArgumentError();
    case 'AccessDeniedError':
      throw new AccessDeniedError();
    case 'NotFoundError':
      throw new NotFoundError();
    case 'ConflictError':
      throw new ConflictError();
    default:
      return response.payload;
  }
};

const illegalArgumentErrorMessage = 'Illegal argument';
const accessDeniedErrorMessage = 'Access denied';
const notFoundErrorMessage = 'Not found';
const conflictErrorMessage = 'Conflict';
const Role = Object.freeze({
  System: Math.pow(2, 0),
  User: Math.pow(2, 1),
  Admin: Math.pow(2, 2)
});

export {
  UserAccountService,
  IllegalArgumentError,
  AccessDeniedError,
  NotFoundError,
  ConflictError,
  Role
};
