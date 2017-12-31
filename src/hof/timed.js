import { sleep } from 'simple';

const DEFAULT_CONFIG = {
	task: 'promise resolution',
	timeout: 1000,
	context: null
};

// decorates a promise generating function such that if it takes too long to
// complete, it will time out.
export default function timed(asyncFn, config) {
	config = {
		...DEFAULT_CONFIG,
		...(config || {})
	};

	return function timedFn(...args) {
		const pacer = sleep(config.timeout).then(() => Promise.reject(new Error(`${config.task} timed out`)));
		return Promise.race([asyncFn.apply(config.context, args), pacer]);
	}
}
