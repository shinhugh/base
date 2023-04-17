import { tests } from './authentication-manager-tests.js';

for (const test of tests) {
  const header = '[' + test.name + '] ';
  try {
    await test.run();
    console.log(header + 'SUCCESS');
  }
  catch (e) {
    console.log(header + e.message);
    console.log(header + 'FAILURE');
  }
}
