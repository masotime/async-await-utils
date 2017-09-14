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

	const errors = [];
	const maxAttempts = config.attempts;

	async function resilientFn(...args) {
		try {
			return await asyncFn.apply(config.context, args);
		} catch (err) {
			if (config.attempts <= 0) {
				// give up
				throw new VError({
					name: 'ResilientPromiseFailed',//
					cause: new MultiError(errors),
					info: { task: config.task, maxAttempts }
				}, `Resilient ${config.task} failed after ${maxAttempts}`);
			} else {
				config.attempts -= 1;
				errors.push(err);
				return resilientFn(...args);
			}
		}
	}

	return resilientFn;
}