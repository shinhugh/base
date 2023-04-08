class UserAccountServiceClient {
  #endpointConfig;

  constructor(endpointConfig) {
    if (endpointConfig == null || !validateEndpointConfig(endpointConfig)) {
      throw new Error();
    }
    this.#endpointConfig = {
      host: endpointConfig.host,
      port: endpointConfig.port
    };
  }

  async read(authority, name) {
    return generateMockUserAccount(); // TODO: Remove
    // TODO: Implement
  }
}

const validateEndpointConfig = (endpointConfig) => {
  if (endpointConfig == null) {
    return true;
  }
  if (typeof endpointConfig !== 'object') {
    return false;
  }
  if (typeof endpointConfig.host !== 'string') {
    return false;
  }
  if (!Number.isInteger(endpointConfig.port) || endpointConfig.port < 0 || endpointConfig.port > portMaxValue) {
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
