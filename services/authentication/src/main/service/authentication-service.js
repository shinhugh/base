class AuthenticationService {
  async identify(authority, token) { }

  async login(authority, loginInfo) { }

  async logout(authority, logoutInfo) { }

  async readAccount(authority, id, name) { }

  async createAccount(authority, account) { }

  async updateAccount(authority, id, name, account) { }

  async deleteAccount(authority, id, name) { }

  async purgeExpiredSessions() { }

  async purgeDanglingSessions() { }
}

export {
  AuthenticationService
};
