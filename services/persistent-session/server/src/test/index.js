import { tests } from './persistent-session-service-tests.js';

for (const test of tests) {
  const header = '[' + test.name + '] ';
  console.log(header + 'Entering test');
  try {
    await test.run();
  }
  catch (e) {
    console.error(header + e.message);
  }
  console.log(header + 'Exiting test');
}
