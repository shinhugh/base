import { PersistentSessionServiceServer, PersistentSession, Role } from './service.js';

const service = new PersistentSessionServiceServer({
  host: 'localhost',
  port: 3306,
  database: 'base',
  username: 'root',
  password: ''
});
