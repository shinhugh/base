class AuthenticationService {
  async identify(authority, token) { }

  async login(authority, loginInfo) { }

  async logout(authority, logoutInfo) { }

  async purgeExpiredSessions() { }

  async purgeDanglingSessions() { }
}

export {
  AuthenticationService
};
