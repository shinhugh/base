import { RandomService } from './random-service.js';

class RandomManager extends RandomService {
  generateRandomString(pool, length) {
    let output = '';
    for (let i = 0; i < length; i++) {
      output += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    return output;
  }
}

export {
  RandomManager
};
