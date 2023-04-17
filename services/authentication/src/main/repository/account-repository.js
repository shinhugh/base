class AccountRepository {
  async readByName(name) { }

  async readByIdAndName(id, name) { }

  async create(account) { }

  async updateByIdAndName(id, name, account) { }

  async deleteByIdAndName(id, name) { }
}

export {
  AccountRepository
};
