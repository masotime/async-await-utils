import test from 'tape';
import { resilient } from 'hof';
import { sleep, failsForNTimes } from '../utils';
import { BASIC_DURATION } from '../constants';

const RUNS = 3;
const works = async function() {
	await sleep(BASIC_DURATION);
	return 'success';
}

test('resilient below threshold', async assert => {
	const failsTwoTimes = failsForNTimes(works, RUNS - 1);

	// the failing version will fail twice, but succeed on the third
	// we test a resiilient version that tries 3 times
	const resilientFn = resilient(failsTwoTimes, { attempts: RUNS - 1 });

	assert.equal(await resilientFn(), 'success');
	assert.equal(await resilientFn(), 'success');

	assert.end();
});

test('resilient above threshold', async assert => {
	const failsFourTimes = failsForNTimes(works, RUNS + 1);

	// the failing version will fail twice, but succeed on the third
	// we test a resiilient version that tries 3 times
	const resilientFn = resilient(failsFourTimes, { attempts: RUNS - 1 });
	try {
		await resilientFn();
		assert.fail('Resilient function should have thrown')
	} catch (err) {
		assert.pass('Throws as expected');
	}

	assert.end();
});

test.skip('resilient error stacking');
test.skip('resilient context binding');