import test from 'tape';
import { guarded } from 'hof';
import { sleep } from '../utils';
import { BASIC_DURATION } from '../constants';

test('guarded', async assert => {
	assert.plan(3);

	async function working(name) {
		await sleep(BASIC_DURATION);
		return `Hello ${name}`;
	}

	async function failing() {
		await sleep(BASIC_DURATION);
		const err = new Error('failure');
		err.other = 'pineapple';
		throw err;
	}

	const guardedWorking = guarded(working);
	const guardedFailing = guarded(failing);

	const str = await guardedWorking('world');
	assert.equal(str, 'Hello world');

	try {
		await guardedFailing('world');
	} catch (err) {
		assert.equal(err.message, 'failure');
		assert.equal(err.other, 'pineapple');
	}
});

test.skip('guarded context');