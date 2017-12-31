import test from 'tape';
import { reuseInFlight } from 'hof';
import { BASIC_DURATION } from '../constants';
import { sleep } from '../utils';

test('basic reuseInFlight', assert => {
	let counter = 0;
	function incrementing() {
		return sleep(BASIC_DURATION).then(() => {
			const result = counter;
			counter += 1;
			return result;
		});
	}

	const reused = reuseInFlight(incrementing);

	const staggeredPromises = [
		reused(),
		sleep(BASIC_DURATION * 0.3).then(() => reused()),
		sleep(BASIC_DURATION * 0.7).then(() => reused()),
		sleep(BASIC_DURATION * 1.1).then(() => reused()),
		sleep(BASIC_DURATION * 1.4).then(() => reused()),
		sleep(BASIC_DURATION * 2.2).then(() => reused()),
	];

	assert.plan(staggeredPromises.length);

	Promise.all(staggeredPromises).then(([zero, zero2, zero3, one1, one2, two1]) => {
		assert.equal(zero, 0, 'initial promise is 0.');
		assert.equal(zero2, 0, '30% complete call still 0.');
		assert.equal(zero3, 0, '70% complete call still 0.');
		assert.equal(one1, 1, '110% complete call is now 1.');
		assert.equal(one2, 1, '140% complete call is still 1.');
		assert.equal(two1, 2, '220% complete call is now 2.');
		assert.end();
	});
});

test('ignoreSingleUndefined reuseInFlight', assert => {
	assert.plan(6);

	let counter = 0;
	function incrementing() {
		return sleep(BASIC_DURATION).then(() => {
			const result = counter;
			counter += 1;
			return result;
		});
	}

	const singleUndefinedValid = reuseInFlight(incrementing);
	const singleUndefinedIgnored = reuseInFlight(incrementing, { ignoreSingleUndefined: true });

	Promise.all([
		singleUndefinedValid(), // will be 0
		sleep(0.3 * BASIC_DURATION).then(singleUndefinedValid), // will be 1, [undefined] different from [] in function call
		sleep(0.7 * BASIC_DURATION).then(() => singleUndefinedValid()) // will be 0, considered no args
	]).then(([zero, one, stillZero]) => {
		assert.equal(0, zero, 'initial promise is 0.');
		assert.equal(1, one, 'called with one undefined arg, 1.');
		assert.equal(0, stillZero, 'call with no args, 0.');
	}).then(() => sleep(BASIC_DURATION * 2)) // let the incrementing function settle
	.then(() => Promise.all([
		singleUndefinedIgnored(), // will be 2
		sleep(0.3 * BASIC_DURATION).then(singleUndefinedIgnored), // still 2, single undefined ignored
		sleep(0.7 * BASIC_DURATION).then(() => singleUndefinedIgnored()) // still 2
	])).then(([two, againTwo, betterBeTwo]) => {
		assert.equal(2, two, 'basic case remains 2.');
		assert.equal(2, againTwo, 'called with one undefined arg, still 2.');
		assert.equal(2, betterBeTwo, 'still within threshold, 2');
		assert.end();
	})
});

test.skip('reuseInFlight w/custom key function');
test.skip('reuseInFlight w/custom context');