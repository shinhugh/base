import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { IllegalArgumentError, AccessDeniedError, NotFoundError, ConflictError } from './errors.js';

// TODO: Remove comments

class PersistentSessionService {
  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // authority.authTime: number (unsigned 32-bit integer) (optional)
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
  // authority.authTime: number (unsigned 32-bit integer) (optional)
  // id: string
  async readById(authority, id) {
    return await makeRequest('readById', authority, [ id ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // authority.authTime: number (unsigned 32-bit integer) (optional)
  // refreshToken: string
  async readByRefreshToken(authority, refreshToken) {
    return await makeRequest('readByRefreshToken', authority, [ refreshToken ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // authority.authTime: number (unsigned 32-bit integer) (optional)
  // userAccountId: string
  async deleteByUserAccountId(authority, userAccountId) {
    return await makeRequest('deleteByUserAccountId', authority, [ userAccountId ]);
  }

  // authority: object (optional)
  // authority.id: string (optional)
  // authority.roles: number (unsigned 8-bit integer) (optional)
  // authority.authTime: number (unsigned 32-bit integer) (optional)
  // refreshToken: string
  async deleteByRefreshToken(authority, refreshToken) {
    return await makeRequest('deleteByRefreshToken', authority, [ refreshToken ]);
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
    FunctionName: 'base_persistentSessionService',
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

export {
  PersistentSessionService
};
