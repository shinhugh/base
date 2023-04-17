class PersistentSessionRepository {
  async readById(id) { }

  async readByRefreshToken(refreshToken) { }

  async create(persistentSession) { }

  async deleteByAccountId(accountId) { }

  async deleteByRefreshToken(refreshToken) { }

  async deleteByLessThanExpirationTime(expirationTime) { }
}

export {
  PersistentSessionRepository
};
