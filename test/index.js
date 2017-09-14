import test from 'tape';
import * as API from 'index';

const BASIC_DURATION = 200;
const TOLERANCE = 0.1; // timing tolerance
const MAX_DURATION_TOLERATED = (1 + TOLERANCE) * BASIC_DURATION;

const executedWithin = (t, minimum, maximum) => async fn => {
	const start = Date.now();
	try {
		await fn();
	} finally {
		const elapsed = Date.now() - start;
		t.ok(elapsed >= minimum && elapsed <= maximum);
	}
}

test('sleep', async t => {
	t.plan(1);

	executedWithin(t, BASIC_DURATION, MAX_DURATION_TOLERATED)(
		async () => await API.sleep(BASIC_DURATION)
	);

});

test('guarded', async t => {
	t.plan(3);

	async function working(name) {
		await API.sleep(BASIC_DURATION);
		return `Hello ${name}`;
	}

	async function failing() {
		await API.sleep(BASIC_DURATION);
		const err = new Error('failure');
		err.other = 'pineapple';
		throw err;
	}

	const guardedWorking = API.guarded(working);
	const guardedFailing = API.guarded(failing);

	const str = await guardedWorking('world');
	t.equal(str, 'Hello world');

	try {
		await guardedFailing('world');
	} catch (err) {
		t.equal(err.message, 'failure');
		t.equal(err.other, 'pineapple');
	}
});

test('throttled', async t => {
	t.plan(6);

	let triggers;
	const BATCH_SIZE = 5;
	const promiseGeneratingFn = async () => {
		await API.sleep(BASIC_DURATION);
		triggers+=1;
	}

	const DOUBLE_SIZE = new Array(BATCH_SIZE * 2).fill();
	const LESS_THAN_SIZE = new Array(BATCH_SIZE - 1).fill();

	// baseline, without throttling, they all finish in < 150ms
	await executedWithin(t, BASIC_DURATION, MAX_DURATION_TOLERATED)(async () => {
		triggers = 0;
		await Promise.all(DOUBLE_SIZE.map(promiseGeneratingFn));
		t.equal(triggers, DOUBLE_SIZE.length);
	});

	// when throttled, they take their time in batches
	await executedWithin(t, BASIC_DURATION * 2, MAX_DURATION_TOLERATED * 2)(async () => {
		const throttledFn = API.throttled(promiseGeneratingFn, BATCH_SIZE);
		triggers = 0;
		await Promise.all(DOUBLE_SIZE.map(throttledFn));
		t.equal(triggers, DOUBLE_SIZE.length);
	});

	// but it is not throttled if it is smaller than the batch size
	await executedWithin(t, BASIC_DURATION, MAX_DURATION_TOLERATED)(async () => {
		const throttledFn = API.throttled(promiseGeneratingFn, BATCH_SIZE);
		triggers = 0;
		await Promise.all(LESS_THAN_SIZE.map(throttledFn));
		t.equal(triggers, LESS_THAN_SIZE.length);
	});

});

test('timed', async t => {
	t.plan(5);

	let triggers;
	const DOUBLE_TIME = BASIC_DURATION * 2;
	const HALF_TIME = BASIC_DURATION / 2;

	async function slowAsnyc() {
		await API.sleep(DOUBLE_TIME);
		triggers+=1;
	}

	async function fastAsync() {
		await API.sleep(HALF_TIME);
		triggers+=1;
	}

	const timedSlowAsync = API.timed(slowAsnyc, {
		timeout: BASIC_DURATION,
		task: 'slow task'
	});

	const timedFastAsync = API.timed(fastAsync, {
		timeout: BASIC_DURATION,
		task: 'quick task'
	});

	// a timed promise will time out if it takes too long
	await executedWithin(t, BASIC_DURATION, MAX_DURATION_TOLERATED)(async () => {
		triggers = 0;
		try {
			await timedSlowAsync();
		} catch (err) {
			t.equal(err.message, 'slow task timed out');
		}
		t.equal(triggers, 0);
	});

	// but it should be fine if it finishes in time
	await executedWithin(t, HALF_TIME, HALF_TIME * (1 + TOLERANCE))(async () => {
		triggers = 0;
		await timedFastAsync();
		t.equal(triggers, 1);
	});

});