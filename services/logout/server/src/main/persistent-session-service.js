import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { IllegalArgumentError, AccessDeniedError, NotFoundError, ConflictError } from './errors.js';

class PersistentSessionService {
  async create(authority, persistentSession) {
    return await makeRequest('create', authority, [ persistentSession ]);
  }

  async readById(authority, id) {
    return await makeRequest('readById', authority, [ id ]);
  }

  async readByRefreshToken(authority, refreshToken) {
    return await makeRequest('readByRefreshToken', authority, [ refreshToken ]);
  }

  async deleteByUserAccountId(authority, userAccountId) {
    return await makeRequest('deleteByUserAccountId', authority, [ userAccountId ]);
  }

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
