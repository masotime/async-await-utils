# async-await-utils

[![npm downloads][downloads-image]][downloads-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage Status][coverage-image]][coverage-url]

Asynchronous I/O has a tendency to suffer a variety of contraints and/or unpredictable failures. This module provides a set of utility functions that are designed to provide optimizations, controls, fallbacks and safeguards for such scenarios.

Quick Examples:

```
  import { resilient, timed, throttled } from 'async-await-utils/hof';

  const randomlyFailing = () => new Promise((resolve, reject) => Math.random() > 0.5 ? reject() : resolve());
  const randomDuration = () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
  const fastFunction = () => new Promise((resolve, reject) => setTimeout(resolve, 100));

  const failsLess = resilient(randomlyFailing, { attempts: 5 });
  const timeLimited = timed(randomDuration), { timeout: 1000 });
  const slowedDown = throttled(fastFunction, { batchSize: 2 });

  failsLess(); // resultant promise is significantly less likely to fail, since it retries 5 times
  timeLimited(); // this promise will take no longer than 1 second to execute
  Promise.all([slowedDown(), slowedDown(), slowedDown(), slowedDown()]); // instead of 100ms, this will take 200ms (batches of 2 promises max at a time)
```

# API

## Higher Order Functions

Usage: Either `import { hof } from 'async-await-utils'` then `hof.<fn>` OR `import { <fn> } from 'async-await-utils'`

⚠️  DO NOT APPLY ANY OF THE APIS TO A PROMISE DIRECTLY. APPLY THEM A PROMISE-GENERATING FUNCTION.

Higher Order Functions take an existing (async, promise returning) function, and returns a new function with adjusted characteristics. For example, given some async function `fetch` that makes an API call, `resilient(fetch)` will return a new function that tries 3 times (in the event any attempt fails) before giving up and throwing the original error(s).

Summary:

* guarded - adds failure interception with console logging of errors
* resilient - makes retry attempts
* reuseInFlight - debounce repeat calls to an in-flight Promise
* throttled - limit parallel execution of Promises
* timed - time limit promises

Misc:

* resilientTimed - convenience composition of resilient and timed.

### `guarded`

Guards the given asynchronous function with a try-catch, and logs out the error fully before re-throwing the error

```
  const failingFunction = () => throw new Error('fails');
  const guarded = HOF.guarded(failingFunction, <options>);

  failingFunction(); // will log the error out
```

`options` is an optional object that can contain the following parameters:

* `context` - default `null`, binds the given function against the context before executing it.

### `resilient`

Makes a function retry a given number of times (default 3) before giving up and re-throwing the failures.

```
  const unreliableFunction = threshold => if (Math.random() < threshold) throw new Error();
  const resilientFunction = HOF.resilient(unreliableFunction, <options>);

  resilientFunction(0.5); // Has a 6.25% chance of throwing, improved over the passed in 50%
 ```

`options` is an optional object that can contain the following parameters:

* `attempts` - default 3, the number of times to retry before giving up.
* `context` - default `null`, binds the given function against the context before executing it.
* `task` - default `promise resolution`, just a string that is attached to the Error thrown

### `reuseInFlight`

If a promise generating function is called with `...args`, and subsequently called _again_ with the same `...args` while the first Promise is still unresolved, then the first Promise is returned instead of creating a new Promise.

The default method used to determine if `...args` are the same is via JSON stringification, but this can be changed.

```
```

### `throttled`

Limits the maximum number of times (default 100) a promise can be executed simultaneously

```
  const sleep = duration => new Promise(ok => setTimeout(ok, duration));
  const loggingFunction = () => new Promise(resolve => setTimeout(() => resolve() && console.log('.'), 1000);
  const throttedFunction = throttled(rapidFunction, <options>);

	// prints 100 dots every second for 10 seconds, instead of all 1000 dots after a second
  for (let i=0; i < 1000; i+= 100) {
  	throttledFunction();
  }
```

`options` is an optional object that can contain the following parameters:

* `batchSize` - default 100, how many promises must fully resolve before allowing more promises to proceed

### `timed` (time-limited)

Places an upper bound as to how long a Promise can take to resolve. If the Promise takes longer than the specified duration (default 1000ms) then it automatically fails.

Special note: Do not time-limit throttled promises - throttle time-limited promises.

```
  const randomDuration = () => new Promise((ok, fail) => setTimeout(0, Math.random() * 2000));
  const oneSecondMax = timed(randomDuration, { timeout: 1000 });
  Array(5).fill().map(oneSecondMax)
```

## Simple Functions (simple)

```
  import * as Simple from 'async-await-utils';
  // Simple.<api> will be available
```

### `sleep`

Pauses execution for the given `duration` in ms

```
async function() {
	await sleep(1000);
	console.log('1 second has passed');
}
```

### `execute(asyncFn, [...args])`

Runs the given asynchronous function, catching and logging any errors before rethrowing. This is useful if you want to make sure an async function's errors don't get swallowed if you forget to `catch`.

```
async function main(name) {
	console.log(`hello ${name}');
	throw new Error('boom');
}

execute(main, 'world'); // logs "hello world" then will log the "boom" error even if you don't catch
```

[downloads-image]: https://img.shields.io/npm/dm/async-await-utils.svg?style=flat-square
[downloads-url]: https://www.npmjs.com/package/async-await-utils
[travis-image]: https://travis-ci.org/masotime/async-await-utils.svg?branch=master
[travis-url]: https://travis-ci.org/masotime/async-await-utils
[daviddm-image]: https://david-dm.org/masotime/async-await-utils.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/masotime/async-await-utils
[coverage-image]: https://coveralls.io/repos/github/masotime/async-await-utils/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/masotime/async-await-utils?branch=master