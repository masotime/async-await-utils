// tests only the compiled output in a backward compatible manner
const test = require('tape');

const { simple, hof } = require('async-await-utils');
const simpleExports = require('async-await-utils/simple');
const hofExports = require('async-await-utils/hof');

const hofExpected = ['guarded', 'resilient', 'reuseInFlight', 'throttled', 'timed'];
const simpleExpected = ['execute', 'sleep'];

function validateApis(assert, apiObj, apiExpected, exportName) {
  const apiCount = apiExpected.length;
  let i, apiName;

  for (i = 0; i < apiCount; i += 1) {
    apiName = apiExpected[i];
    assert.ok(apiObj[apiName], `${apiName} is part of the ${exportName} export`);
  }
}

test('the root exports', assert => {
  assert.ok(simple, '"simple" is a root export');
  assert.ok(hof, '"hof" is a root export');

  // the root exports must themselves have the sub exports
  validateApis(assert, simple, simpleExpected, 'root.simple');
  validateApis(assert, hof, hofExpected, 'root.hof');

  assert.end();
});

test('the sub exports', assert => {
  // the root exports must themselves have the sub exports
  validateApis(assert, simpleExports, simpleExpected, 'simple');
  validateApis(assert, hofExports, hofExpected, 'hof');

  assert.end();
});

const randomlyFailing = () => new Promise((resolve, reject) => Math.random() > 0.5 ? reject() : resolve());
const randomDuration = () => new Promise(resolve => setTimeout(resolve, Math.random() * 20));
const fastFunction = () => new Promise(resolve => setTimeout(resolve, 100));

test('the resilient README example', assert => {
  const failsLess = hof.resilient(randomlyFailing, { attempts: 5 });

  let often = 0;
  let less = 0;

  const fragilePromises = Array(100).fill().map(() => randomlyFailing().catch(() => { often += 1 }));
  const resilientPromises = Array(100).fill().map(() => failsLess().catch(() => less += 1));

  Promise
    .all(fragilePromises.concat(resilientPromises))
    .then(() => {
      // conservatively, at least 2^2 times less
      // theoretically, it should be 2^4 times less
      assert.ok(less * 4 < often, 'resilient reduces failure rate as expected');
      assert.end();
    });
});

test.skip('the timed README example', assert => {
  const timeLimited = hof.timed(randomDuration, { timeout: 10 });
  timeLimited(); // this promise will take no longer than 1 second to execute
});

test.skip('the throttled README example', assert => {
  const slowedDown = hof.throttled(fastFunction, { batchSize: 2 });
  Promise.all([slowedDown(), slowedDown(), slowedDown(), slowedDown()]); // instead of 100ms, this will take 200ms (batches of 2 promises max at a time)
});