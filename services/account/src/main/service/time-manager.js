import { TimeService } from './time-service.js';

class TimeManager extends TimeService {
  currentTimeSeconds() {
    return Math.floor(Date.now() / 1000);
  }
}

export {
  TimeManager
};
