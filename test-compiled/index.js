// tests only the compiled output in a backward compatible manner
var test = require('tape');

var rootExports = require('..');
var simpleExports = require('../simple');
var hofExports = require('../hof');

var hofExpected = ['guarded', 'resilient', 'reuseInFlight', 'throttled', 'timed'];
var simpleExpected = ['execute', 'sleep'];

function validateApis(assert, apiObj, apiExpected, exportName) {
  var apiCount = apiExpected.length;
  var i, apiName;

  for (i = 0; i < apiCount; i += 1) {
    apiName = apiExpected[i];
    assert.ok(apiObj[apiName], `${apiName} is part of the ${exportName} export`);
  }
}

test('the root exports', assert => {
  assert.ok(rootExports.simple, '"simple" is a root export');
  assert.ok(rootExports.hof, '"hof" is a root export');

  // the root exports must themselves have the sub exports
  validateApis(assert, rootExports.simple, simpleExpected, 'root.simple');
  validateApis(assert, rootExports.hof, hofExpected, 'root.hof');

  assert.end();
});

test('the sub exports', assert => {
  // the root exports must themselves have the sub exports
  validateApis(assert, simpleExports, simpleExpected, 'simple');
  validateApis(assert, hofExports, hofExpected, 'hof');

  assert.end();
});

var randomlyFailing = () => new Promise((resolve, reject) => Math.random() > 0.5 ? reject() : resolve());
var randomDuration = () => new Promise(resolve => setTimeout(resolve, Math.random() * 200));
var fastFunction = () => new Promise(resolve => setTimeout(resolve, 100));

test('the resilient README example', assert => {
  var failsLess = rootExports.hof.resilient(randomlyFailing, { attempts: 5 });

  var often = 0;
  var less = 0;

  var fragilePromises = Array(100).fill().map(() => randomlyFailing().catch(() => { often += 1 }));
  var resilientPromises = Array(100).fill().map(() => failsLess().catch(() => less += 1));

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
  var timeLimited = rootExports.hof.timed(randomDuration, { timeout: 100 });

  var unboundDuration = 0;
  var boundDuration = 0;

  // this test is extremely flaky so we do it step by step
  Promise.resolve()
    .then(() => {
       var start = Date.now();
       return Promise
         .all(Array(100).fill().map(randomDuration))
         .then(() => { unboundDuration = Date.now() - start; });
    }).then(() => {
      var start = Date.now();
       return Promise
         .all(Array(10).fill().map(() => timeLimited().catch(() => {}))) // surrender
         .then(() => { boundDuration = Date.now() - start; });
    }).then(() => {
      console.log({ unboundDuration, boundDuration });
      assert.ok(unboundDuration > 150, 'control promises has at least one promise falling above 75th percentile');
      assert.ok(boundDuration <= 130, 'timed promises are within 65th percentile'); // assuming an error of less than 10%
      assert.end();
    });
});

test('the throttled README example', assert => {
  var slowedDown = rootExports.hof.throttled(fastFunction, { batchSize: 2 });

  var unboundDuration = 0;
  var boundDuration = 0;
  var now = Date.now();

  var unboundPromises = Array(10).fill().map(fastFunction);
  var boundPromises = Array(10).fill().map(slowedDown);

  var unboundTimer = Promise.all(unboundPromises).then(() => unboundDuration = Date.now() - now);
  var boundTimer = Promise.all(boundPromises).then(() => boundDuration = Date.now() - now);

  // instead of 100ms, this will take 200ms (batches of 2 promises max at a time)
  Promise.all([unboundTimer, boundTimer])
    .then(() => {
      // assuming at least one out of 100 is in 75% percentile...
      console.log({ unboundDuration, boundDuration });
      assert.ok(unboundDuration <= 115, '10 control promises run in parallel within 15% of 100ms');
      assert.ok(boundDuration >= 500, '10 throttled promises take at least 10/2 = 5 batches of 100ms to complete');
      assert.end();
    });});