import test from 'tape';
import { BASIC_DURATION, MAX_DURATION_TOLERATED, TOLERANCE } from '../constants';
import { executedWithin, sleep } from '../utils';
import { timed } from 'hof';

test('timed', async t => {
	t.plan(5);

	let triggers;
	const DOUBLE_TIME = BASIC_DURATION * 2;
	const HALF_TIME = BASIC_DURATION / 2;

	async function slowAsnyc() {
		await sleep(DOUBLE_TIME);
		triggers+=1;
	}

	async function fastAsync() {
		await sleep(HALF_TIME);
		triggers+=1;
	}

	const timedSlowAsync = timed(slowAsnyc, {
		timeout: BASIC_DURATION * 1000,
		task: 'slow task'
	});

	const timedFastAsync = timed(fastAsync, {
		timeout: BASIC_DURATION * 1000,
		task: 'quick task'
	});

	// a timed promise will time out if it takes too long
	await executedWithin(t, BASIC_DURATION, MAX_DURATION_TOLERATED)(async () => {
		triggers = 0;
		try {
			await timedSlowAsync();
		} catch (err) {
			console.log(err, err.name, err.message);
			t.equal(err.message, 'slow task timed out');
		}
		t.equal(triggers, 0);
	});

	// but it should be fine if it finishes in time
	await executedWithin(t, HALF_TIME, HALF_TIME * (1 + TOLERANCE * 2))(async () => {
		triggers = 0;
		await timedFastAsync();
		t.equal(triggers, 1);
	});

});

test.skip('timed context?');