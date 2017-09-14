const DEFAULT_CONFIG = {
	createKey(...args) { return JSON.stringify(args); }
};

// for a given Promise-generating function, track each execution by the stringified
// arguments. if the function is called again with the same arguments, then instead
// of generating a new promise, an existing in-flight promise is used instead. This
// prevents unnecessary repetition of async function calls while the same function
// is still in flight.
export default function reuseInFlight(asyncFn, config) {
	config = {
		...DEFAULT_CONFIG,
		...(config || {})
	};

	const inflight = {};

	return async function debounced(...args) {
		const key = config.createKey(...args);
		if (!inflight.hasOwnProperty(key)) {
			// WE DO NOT AWAIT, we are storing the promise itself
			inflight[key] = asyncFn.apply(this, args)
				.then(results => {
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