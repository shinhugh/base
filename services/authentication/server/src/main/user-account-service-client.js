class UserAccountServiceClient {
  async readByName(authority, name) {
    // TODO: Implement
    return generateMockUserAccount();
  }
}

const generateMockUserAccount = () => { // TODO: Remove
  return {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'qwer',
    passwordHash: 'bbf55461cbb04963ee7347e5e014f76defa26a8af960be40e644f4f204ddc7a3',
    passwordSalt: '00000000000000000000000000000000',
    roles: 6
  };
};

export {
  UserAccountServiceClient
};
