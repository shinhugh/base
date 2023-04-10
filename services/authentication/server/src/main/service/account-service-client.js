class AccountServiceClient {
  #config;

  constructor(config) {
    if (config == null || !validateConfig(config)) {
      throw new Error();
    }
    this.#config = {
      host: config.host,
      port: config.port
    };
  }

  async read(authority, name) {
    return generateMockAccount(); // TODO: Remove
    // TODO: Implement
  }
}

const validateConfig = (config) => {
  if (config == null) {
    return true;
  }
  if (typeof config !== 'object') {
    return false;
  }
  if (typeof config.host !== 'string') {
    return false;
  }
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > portMaxValue) {
    return false;
  }
  return true;
};

const generateMockAccount = () => { // TODO: Remove
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
  AccountServiceClient
};
