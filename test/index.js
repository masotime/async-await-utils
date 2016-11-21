import test from 'tape';
import testFn from 'index';

test('stub', t => {
	t.plan(1);
	t.ok(true);
});

test('output', t => {
	t.plan(1);
	t.equal(testFn(), 'Hello Benjamin Goh <masotime@gmail.com>!');
});