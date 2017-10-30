import test from 'tape';
import { sleep } from 'simple';
import { executedWithin } from '../utils';
import { BASIC_DURATION, MAX_DURATION_TOLERATED } from '../constants';

test('sleep', async assert => {
	assert.plan(1);

	executedWithin(assert, BASIC_DURATION, MAX_DURATION_TOLERATED)(
		async () => await sleep(BASIC_DURATION * 1000)
	);
});
