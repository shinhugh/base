import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// TODO: Remove comments

export class PersistentSessionServiceClient {
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // persistentSession: object
  // persistentSession.userAccountId: string
  // persistentSession.roles: number (unsigned 8-bit integer)
  // persistentSession.refreshToken: string
  // persistentSession.creationTime: number (unsigned 32-bit integer)
  // persistentSession.expirationTime: number (unsigned 32-bit integer)
  async create(authority, persistentSession) {
    return await makeRequest('create', authority, [ persistentSession ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // id: string
  async readById(authority, id) {
    return await makeRequest('readById', authority, [ id ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // refreshToken: string
  async readByRefreshToken(authority, refreshToken) {
    return await makeRequest('readByRefreshToken', authority, [ refreshToken ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // userAccountId: string
  async deleteByUserAccountId(authority, userAccountId) {
    return await makeRequest('deleteByUserAccountId', authority, [ userAccountId ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // refreshToken: string
  async deleteByRefreshToken(authority, refreshToken) {
    return await makeRequest('deleteByRefreshToken', authority, [ refreshToken ]);
  }
}

export class IllegalArgumentError extends Error {
  constructor() {
    super(illegalArgumentErrorMessage);
    this.name = this.constructor.name;
  }
}

export class AccessDeniedError extends Error {
  constructor() {
    super(accessDeniedErrorMessage);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends Error {
  constructor() {
    super(notFoundErrorMessage);
    this.name = this.constructor.name;
  }
}

export class ConflictError extends Error {
  constructor() {
    super(conflictErrorMessage);
    this.name = this.constructor.name;
  }
}

const makeRequest = async (funcName, authority, args) => {
  const client = new LambdaClient();
  const responseWrapper = await client.send(new InvokeCommand({
    FunctionName: 'base_persistentSessionService',
    LogType: 'None',
    Payload: JSON.stringify({
      function: funcName,
      authority: authority,
      arguments: args
    })
  }));
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
export const Role = Object.freeze({
  System: Math.pow(2, 0),
  User: Math.pow(2, 1),
  Admin: Math.pow(2, 2)
});
