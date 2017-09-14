const DEFAULT_CONFIG = {
	context: null
};

function logError(err) {
	console.error(err.stack || err);
	for (let key in err) {
		if (key !== 'stack') {
			console.error(`${key} = ${err[key]}`);
		}
	}
}

// [HOF]
//
// returns a guarded version of a given async function.
// Errors are logged during synchronous or asynchronous execution
export default function guarded(asyncFn, config) {
	config = {
		...DEFAULT_CONFIG,
		...(config || {})
	};

	return async function guardedFn(...args) {
		try {
			return await asyncFn.apply(config.context, args);
		} catch (err) {
			logError(err);
			throw err;
		}
	};
}
