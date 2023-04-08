class UserAccountServiceClient {
  #endpointInfo;

  constructor(endpointInfo) {
    if (endpointInfo == null || !validateEndpointInfo(endpointInfo)) {
      throw new Error();
    }
    this.#endpointInfo = {
      host: endpointInfo.host,
      port: endpointInfo.port
    };
  }

  async readByName(authority, name) {
    return generateMockUserAccount(); // TODO: Remove
    // TODO: Implement
  }
}

const validateEndpointInfo = (endpointInfo) => {
  if (endpointInfo == null) {
    return true;
  }
  if (typeof endpointInfo !== 'object') {
    return false;
  }
  if (typeof endpointInfo.host !== 'string') {
    return false;
  }
  if (!Number.isInteger(endpointInfo.port) || endpointInfo.port < 0 || endpointInfo.port > portMaxValue) {
    return false;
  }
  return true;
};

const generateMockUserAccount = () => { // TODO: Remove
  return {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'qwer',
    passwordHash: 'bbf55461cbb04963ee7347e5e014f76defa26a8af960be40e644f4f204ddc7a3',
    passwordSalt: '00000000000000000000000000000000',
    roles: 6
  };
};

const portMaxValue = 65535;

export {
  UserAccountServiceClient
};
