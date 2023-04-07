import express from 'express';
import { PersistentSessionRepository } from './repository/persistent-session-repository.js';
import { UserAccountServiceClient } from './service/user-account-service-client.js';
import { AuthenticationService } from './service/authentication-service.js';
import { AuthenticationController } from './controller/authentication-controller.js';

const algorithm = 'HS256';
const secretKey = Buffer.from('Vg+rXZ6G/Mu2zkv2JUm+gG2yRe4lqOqD5VDIYPCFzng=', 'base64');
const persistentSessionRepository = new PersistentSessionRepository({
  host: 'localhost',
  port: 3306,
  database: 'base',
  username: 'root',
  password: ''
});
const userAccountServiceClient = new UserAccountServiceClient();
const authenticationService = new AuthenticationService(persistentSessionRepository, userAccountServiceClient, {
  algorithm: algorithm,
  secretKey: secretKey
});
const authenticationController = new AuthenticationController(authenticationService);
const port = 3000;
const app = express();
app.use(express.raw({
  type: () => { return true; }
}));

app.all('/*', async (req, res) => {
  const request = {
    path: req.path,
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.headers['content-length'] == null ? undefined : req.body
  };
  const response = await authenticationController.handle(request);
  if (response.body == null) {
    res.status(response.status).end();
  }
  else {
    res.status(response.status).send(response.body);
  }
});

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
