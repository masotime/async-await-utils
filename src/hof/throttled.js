import Promise from 'bluebird';

// throttles the number of promises a promise generating function can execute. This is useful
// when you are firing off a large number of promises without waiting for them to be complete.
//
// the decorator maintains a count of the number of executions, and if the count hits a defined
// batch size, it blocks all subsequent promises until the current batch of promises complete.
export default function throttled(asyncFn, batchSize = 100) {
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
		const tail = waitChain.then(() => asyncFn(...args));
		promiseQueue.push(tail);
		count += 1;
		return tail;
	}
}
