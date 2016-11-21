# async-await-utils

[![npm downloads][downloads-image]][downloads-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage Status][coverage-image]][coverage-url]

A series of utilities to make programming with async/await easier.

* **HOF**: Higher Order Function
* [**param** = **default**]: param is optional, and may have a default

# API

* `async sleep(duration)`: Pauses execution for the given `duration`

```
async function() {
	await sleep(1000);
	console.log('1 second has passed');
}
```

* `async execute(asyncFn, [...args])`: Runs the given asynchronous function, catching and logging any errors before rethrowing. This is useful if you want to make sure an async function's errors don't get swallowed if you forget to `catch`.

```
async function main(name) {
	console.log(`hello ${name}');
	throw new Error('boom');
}

execute(main, 'world'); // logs "hello world" then will log the "boom" error even if you don't catch
```

* `throttled(asyncFn, [batchSize = 100])`: [**HOF**] Returns a throttled `asyncFn` that is only allowed to run `batchSize` times in parallel before it waits for the queue to catch up before proceeding. Useful if you're running async I/O functions in large numbers and don't want to overload I/O.

```
function scrape() {
	return new Promise((ok, fail) => {
		request('https://www.google.com', (err, res) => {
			if (err) return fail(err);
			ok(res.body);
		});
	}
}

async function main() {
	const throttled = throttle(scrape, 10);

	for (let i = 0; i < 1000, i+= 1) {
		throttled(); // this will run in batches of 10, instead of trying to run 1000 at one shot
	}
}
```

* `timed(asyncFn, timeout, [task = 'promise resolution'])`: [**HOF**] Returns a timed `asyncFn` that will time out after the given "timeout" with an error messages corresponding to the optional `task` parameter.

```
async function longTask() {
	// something that takes 10 seconds
}

async function main() {
	const timedFn = timed(longTask, 1000, 'long task');

	await timedFn(); // will throw an error after 1 second with the message 'long task timed out'
}
```

* `retry(asyncFn, [attempts = 1], [task = 'promise resolution']): TBD

* `retryWithTimeout({ RETRIES, TIMEOUT })`: TBD

* `reuseInFlight(asyncFn, [createKey = (...args) => JSON.stringify(args)]): TBD

[downloads-image]: https://img.shields.io/npm/dm/async-await-utils.svg?style=flat-square
[downloads-url]: https://www.npmjs.com/package/async-await-utils
[travis-image]: https://travis-ci.org/masotime/async-await-utils.svg?branch=master
[travis-url]: https://travis-ci.org/masotime/async-await-utils
[daviddm-image]: https://david-dm.org/masotime/async-await-utils.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/masotime/async-await-utils
[coverage-image]: https://coveralls.io/repos/github/masotime/async-await-utils/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/masotime/async-await-utils?branch=master