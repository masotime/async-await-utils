export async function sleep(n) { // n is in SECONDS, not MS
	return new Promise(ok => setTimeout(ok, n * 1000));
}

export function failsForNTimes(fn, times, lag = 1) {
	let n = 0;

	const failingFn = (...args) => {
		if (n < times) {
			n += 1;
			return sleep(lag).then(() => {
				throw new Error(`Fail time #${n}, ${times - n} to success.`);
			});
		}

		// at this point, n === times, so it will succeed
		return fn(...args);
	}

	return failingFn;
}

export const executedWithin = (t, minimum, maximum) => async fn => {
	const start = Date.now();
	try {
		await fn();
	} finally {
		const elapsed = (Date.now() - start) / 1000;
		t.ok(elapsed >= minimum && elapsed <= maximum, `Expected elapsed time ${elapsed} to be between ${minimum} and ${maximum}`);
	}
}
