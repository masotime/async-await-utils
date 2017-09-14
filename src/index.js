// HOF: Higher order function
import Promise from 'bluebird';
import resilient from 'hof/resilient';
import timed from 'hof/timed';
import reuseInFlight from 'hof/reuseInFlight';
import throttled from 'hof/throttled';
import guarded from 'hof/guarded';

export const sleep = async duration => new Promise(ok => setTimeout(ok, duration));

// convenience composition of resilient, timed function - the function will time out
// after the given timeout, but will retry itself attempts times. The same
// config will be passed to both the timed and resilient functions.
function resilientTimed(asyncFn, config) {
	return resilient(timed(asyncFn, config), config);
}

export {
	guarded,
	timed,
	throttled,
	resilient,
	resilientTimed,
	reuseInFlight
};
