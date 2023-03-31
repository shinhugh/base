import { PersistentSessionServiceClient, PersistentSession, Role } from './service.js';

const service = new PersistentSessionServiceClient({
  host: 'localhost',
  port: 5001
});
