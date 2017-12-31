const DEFAULT_CONFIG = {
	context: null,
	log: (...args) => console.error(...args)
};

function logError(log, err) {
	log(err.stack || err);
	for (const key in err) {
		if (key !== 'stack') {
			log(`${key} = ${err[key]}`);
		}
	}
}

// returns a guarded version of a given async function.
// Errors are logged during synchronous or asynchronous execution
export default function guarded(asyncFn, config) {
	config = {
		...DEFAULT_CONFIG,
		...(config || {})
	};

	return function guardedFn(...args) {
		return asyncFn
			.apply(config.context, args)
			.catch(err => {
				logError(config.log, err);
				throw err;
			});
	};
}
