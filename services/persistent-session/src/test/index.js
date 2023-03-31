import { serverTestModule } from './server-test.js';
import { clientTestModule } from './client-test.js';

const runTestModule = async (testModule) => {
  for (const test of testModule.tests) {
    const header = '[' + testModule.name + ' : ' + test.name + '] ';
    console.log(header + 'Entering test');
    try {
      await test.run();
      console.log(header + 'Result: Success');
    }
    catch (e) {
      console.error(header + '' + e.message);
      console.log(header + 'Result: Failure');
    }
    console.log(header + 'Exiting test');
  }
};

await runTestModule(serverTestModule);
await runTestModule(clientTestModule);
