// HOF: Higher order function
import Promise from 'bluebird';
import { MultiError } from 'verror';

export const sleep = async duration => new Promise(ok => setTimeout(ok, duration));

function logError(err) {
	console.error(err.stack || err);
	for (let key in err) {
		if (key !== 'stack') {
			console.error(`${key} = ${err[key]}`);
		}
	}
}

// executes a given async function, logs any errors that are thrown, then re-throws the exception
export async function execute(fn, ...args) {
	try {
		return await fn.apply(this, args);
	} catch (err) {
		logError(err);
		throw err;
	}
}

// [HOF]
//
// returns a guarded version of a given async function.
// Errors are logged during synchronous or asynchronous execution
export function guard(asyncFn) {
	const self = this;
	const guarded = async function(...args) {
		try {
			return asyncFn.apply(self, args).catch(err => {
				logError(err);
				throw err;
			});
		} catch (err) {
			logError(err);
			throw err;
		}
	};

	guarded.name = `Guarded(${asyncFn.name})`;

	return guarded;
}

// [HOF]
//
// throttles the number of promises a promise generating function can execute. This is useful
// when you are firing off a large number of promises without waiting for them to be complete.
//
// the decorator maintains a count of the number of executions, and if the count hits a defined
// batch size, it blocks all subsequent promises until the current batch of promises complete.
export function throttled(promiseGeneratingFn, batchSize = 100) {
	let count = 0;
	let waitChain = Promise.resolve();
	let promiseQueue = [];

	return (...args) => {
		if (count % batchSize === 0) {
			// replaces the current wait chain with a Promise
			// that waits for the current set of Promises to complete
			// first before allowing any more promises to execute
			//
			// awkward, because of the mutable aspect of promiseQueue
			// and count, we use an immediately executing function
			// block where they do not mutate.
			waitChain = (
				(queue, count) =>
					waitChain.then(() => {
						console.log(`Completed ${count}`);
						return Promise.all(queue)
					})
				)(promiseQueue, count);
			promiseQueue = [];
		}

		// we always return the tail.
		const tail = waitChain.then(() => promiseGeneratingFn(...args));
		promiseQueue.push(tail);
		count += 1;
		return tail;
	}
}

// [HOF]
//
// decorates a promise generating function such that if it takes too long to
// complete, it will time out.
//
// WARNING: Do not mix with the throttled function above, because promises
// will take arbitrarily longer when throttled. At the very least, put the
// timed before throttling.
export const timed = (promiseFn, timeout, task = 'promise resolution') =>
	() => Promise.resolve(promiseFn()).timeout(timeout, `${task} timed out`);

// [HOF]
//
// forces a promise-generating function to retry if it falis, until a predetermiend
// number of attempts, after which the error is simply thrown.
export const retry = (promiseFn, attempts = 1, task = 'promise resolution', errors = []) =>
	() => Promise.resolve(promiseFn()).catch(err => {
		if (attempts <= 0) {
			throw new MultiError(errors);
		} else {
			errors.push(err);
			return retry(promiseFn, attempts - 1, task, errors);
		}
	});

// [HOF]
//
// Initially takes a speecified retries and timeout
// the resulting higher order function will take in a promise generating function and name.
// the function is _immediately_ executed as a timed promise that will be retried before
// failing.
export const retryWithTimeout = ({ RETRIES, TIMEOUT }) => async (promiseFn, name) => {
	return await retry(timed(promiseFn, TIMEOUT, name), RETRIES, name)();
};

// [HOF]
//
// for a given Promise-generating function, track each execution by the stringified
// arguments. if the function is called again with the same arguments, then instead
// of generating a new promise, an existing in-flight promise is used instead. This
// prevents unnecessary repetition of async function calls while the same function
// is still in flight.
export function reuseInFlight(promiseFn, createKey = (...args) => JSON.stringify(args)) {
	const inflight = {};

	return function debounced(...args) {
		const key = createKey(...args);
		if (!inflight.hasOwnProperty(key)) {
			inflight[key] = promiseFn.apply(this, args).then(results => {
				// self invalidate
				delete inflight[key];
				return results;
			}, err => {
				// still self-invalidate, then rethrow
				delete inflight[key];
				throw err;
			});
		}

		return inflight[key];
	};
}