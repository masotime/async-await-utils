import Promise from 'bluebird';

const DEFAULT_CONFIG = {
	task: 'promise resolution',
	timeout: 1000,
	context: null
};

// decorates a promise generating function such that if it takes too long to
// complete, it will time out.
//
// WARNING: Do not mix with the throttled function above, because promises
// will take arbitrarily longer when throttled. At the very least, put the
// timed before throttling.
export default function timed(asyncFn, config) {
	config = {
		...DEFAULT_CONFIG,
		...(config || {})
	};

	return async function timedFn(...args) {
		return Promise.resolve(
			asyncFn.apply(config.context, args)
		).timeout(config.timeout, `${config.task} timed out`);
	}
}
