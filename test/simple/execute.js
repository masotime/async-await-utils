import test from 'tape';
import { execute } from 'simple';

test('execute', async (assert) => {
	const willFail = async () => { throw new Error('whatever') };
	const willPass = async () => { return Promise.resolve(1); };

	// not sure if all this actually tests anything
	try {
		await execute(willFail);
	} catch(err) {
		assert.equal(err.message, 'whatever', 'Execute correctly cascades the thrown error');
	}

	try {
		await execute(willPass);
	} catch(err) {
		assert.fail('Execute should not throw an error');
	}

	assert.end();
});