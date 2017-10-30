import Promise from 'bluebird';

export default async function sleep(duration) {
	return new Promise(ok => setTimeout(ok, duration));
};