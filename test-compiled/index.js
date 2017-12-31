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
const randomDuration = () => new Promise(resolve => setTimeout(resolve, Math.random() * 200));
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

test('the timed README example', assert => {
  const timeLimited = hof.timed(randomDuration, { timeout: 100 });

  let unboundDuration = 0;
  let boundDuration = 0;
  const now = Date.now();

  const unboundPromises = Array(100).fill().map(randomDuration);
  const boundPromises = Array(100).fill().map(() => timeLimited().catch(() => {}));

  const unboundTimer = Promise.all(unboundPromises).then(() => unboundDuration = Date.now() - now);
  const boundTimer = Promise.all(boundPromises).then(() => boundDuration = Date.now() - now);

  Promise.all([unboundTimer, boundTimer])
    .then(() => {
      // assuming at least one out of 100 is in 75% percentile...
      console.log({ unboundDuration, boundDuration });
      assert.ok(unboundDuration > 150, 'control promises has at least one promise failing at 75% percentile');
      assert.ok(boundDuration <= 115, 'timed promises are within 15% of timeout'); // assuming an error of less than 10%
      assert.end();
    });
});

test('the throttled README example', assert => {
  const slowedDown = hof.throttled(fastFunction, { batchSize: 2 });

  let unboundDuration = 0;
  let boundDuration = 0;
  const now = Date.now();

  const unboundPromises = Array(10).fill().map(fastFunction);
  const boundPromises = Array(10).fill().map(slowedDown);

  const unboundTimer = Promise.all(unboundPromises).then(() => unboundDuration = Date.now() - now);
  const boundTimer = Promise.all(boundPromises).then(() => boundDuration = Date.now() - now);

	// instead of 100ms, this will take 200ms (batches of 2 promises max at a time)
  Promise.all([unboundTimer, boundTimer])
    .then(() => {
      // assuming at least one out of 100 is in 75% percentile...
      console.log({ unboundDuration, boundDuration });
      assert.ok(unboundDuration <= 115, '10 control promises run in parallel within 15% of 100ms');
      assert.ok(boundDuration >= 500, '10 throttled promises take at least 10/2 = 5 batches of 100ms to complete');
      assert.end();
    });});