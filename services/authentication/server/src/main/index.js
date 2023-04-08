import express from 'express';
import { PersistentSessionRepository } from './repository/persistent-session-repository.js';
import { UserAccountServiceClient } from './service/user-account-service-client.js';
import { AuthenticationService } from './service/authentication-service.js';
import { AuthenticationController } from './controller/authentication-controller.js';

// Use environment variables for production; hard-coded for testing only
const config = {
  persistence: {
    host: 'localhost',
    port: 3306,
    database: 'base',
    username: 'root',
    password: ''
  },
  userAccountService: {
    host: 'localhost',
    port: 3001
  },
  encryption: {
    algorithm: 'HS256',
    secretKey: 'Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=',
    secretKeyEncoding: 'base64'
  },
  server: {
    port: 3000
  }
};

const persistentSessionRepository = new PersistentSessionRepository(config.persistence);
const userAccountServiceClient = new UserAccountServiceClient(config.userAccountService);
const authenticationService = new AuthenticationService(persistentSessionRepository, userAccountServiceClient, {
  algorithm: config.encryption.algorithm,
  secretKey: Buffer.from(config.encryption.secretKey, config.encryption.secretKeyEncoding)
});
const authenticationController = new AuthenticationController(authenticationService);
const app = express();

app.use(express.raw({
  type: () => { return true; }
}));
app.disable('x-powered-by');
app.all('/*', async (req, res) => {
  const request = {
    path: req.path,
    method: req.method,
    headers: req.headers,
    query: req.query
  };
  if (req.headers['content-length'] != null) {
    request.body = req.body;
  }
  const response = await authenticationController.handle(request);
  res.status(response.status);
  for (const headerName in response.headers) {
    res.set(headerName, response.headers[headerName]);
  }
  if (response.body == null) {
    res.end();
  }
  else {
    res.send(response.body);
  }
});
app.listen(config.server.port, () => {
  console.log('Listening on port ' + config.server.port);
});
