import { VError, MultiError } from 'verror';

const DEFAULT_CONFIG = {
	task: 'promise resolution',
	attempts: 3,
	context: null
};

export default function resilient(asyncFn, config) {
	config = {
		...DEFAULT_CONFIG,
		...(config || {})
	};

	const maxAttempts = config.attempts;

	function resilientFn(...args) {
		const errors = [];
		let currentAttempts = 0;

		// recursive "catcher"
		function statefulCatch(err) {
			if (currentAttempts >= config.attempts) {
				// give up
				throw new VError({
					name: 'ResilientPromiseFailed',//
					cause: new MultiError(errors),
					info: { task: config.task, maxAttempts }
				}, `Resilient ${config.task} failed after ${maxAttempts}`);
			} else {
				currentAttempts += 1;
				errors.push(err);
				return asyncFn.apply(config.context, args).catch(statefulCatch);
			}
		}

		// kick off the chain
		return asyncFn.apply(config.context, args).catch(statefulCatch);
	}

	return resilientFn;
}