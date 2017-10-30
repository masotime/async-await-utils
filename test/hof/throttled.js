import test from 'tape';
import { BASIC_DURATION, MAX_DURATION_TOLERATED } from '../constants';
import { executedWithin, sleep } from '../utils';
import { throttled } from 'hof';

test('throttled', async assert => {
	assert.plan(6);

	let triggers;
	const BATCH_SIZE = 5;
	const promiseGeneratingFn = async () => {
		await sleep(BASIC_DURATION);
		triggers+=1;
	}

	const DOUBLE_SIZE = new Array(BATCH_SIZE * 2).fill();
	const LESS_THAN_SIZE = new Array(BATCH_SIZE - 1).fill();

	// baseline, without throttling, they all finish in < 150ms
	await executedWithin(assert, BASIC_DURATION, MAX_DURATION_TOLERATED)(async () => {
		triggers = 0;
		await Promise.all(DOUBLE_SIZE.map(promiseGeneratingFn));
		assert.equal(triggers, DOUBLE_SIZE.length);
	});

	// when throttled, they take their time in batches
	await executedWithin(assert, BASIC_DURATION * 2, MAX_DURATION_TOLERATED * 2)(async () => {
		const throttledFn = throttled(promiseGeneratingFn, { batchSize: BATCH_SIZE });
		triggers = 0;
		await Promise.all(DOUBLE_SIZE.map(throttledFn));
		assert.equal(triggers, DOUBLE_SIZE.length);
	});

	// but it is not throttled if it is smaller than the batch size
	await executedWithin(assert, BASIC_DURATION, MAX_DURATION_TOLERATED)(async () => {
		const throttledFn = throttled(promiseGeneratingFn, { batchSize: BATCH_SIZE });
		triggers = 0;
		await Promise.all(LESS_THAN_SIZE.map(throttledFn));
		assert.equal(triggers, LESS_THAN_SIZE.length);
	});

});