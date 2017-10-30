# async-await-utils

[![npm downloads][downloads-image]][downloads-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage Status][coverage-image]][coverage-url]

A series of utilities to make programming with async/await easier. The utilities are split into 2 categories - HOF and Simple.

HOF or Higher Order Functions take an existing (async, promise returning) function, and returns a new function with adjusted characteristics. For example, given some async function `fetch` that makes an API call, `resilient(fetch)` will return a new function that tries 3 times (in the event any attempt fails) before giving up and throwing the original error(s).

# API

## Higher Order Functions (hof)

```
  import * as HOF from 'async-await-utils/hof';
  // HOF.<api> will be available
```

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

KIV - but essentially `debounces` repeated calls to a function against any promise that is already running

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

## Simple Functions (simple)

```
  import * as Simple from 'async-await-utils/hof';
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