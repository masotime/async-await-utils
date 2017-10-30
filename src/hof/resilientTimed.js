import resilient from 'hof/resilient';
import timed from 'hof/timed';

// convenience composition of resilient, timed function - the function will time out
// after the given timeout, but will retry itself attempts times. The same
// config will be passed to both the timed and resilient functions.
export default function resilientTimed(asyncFn, config) {
	return resilient(timed(asyncFn, config), config);
}
