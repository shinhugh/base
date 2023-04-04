import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { IllegalArgumentError, AccessDeniedError, NotFoundError, ConflictError } from './errors.js';

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

export {
  UserAccountService
};
