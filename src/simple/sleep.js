import Promise from 'bluebird';

export default function sleep(duration) {
	return new Promise(ok => setTimeout(ok, duration));
}