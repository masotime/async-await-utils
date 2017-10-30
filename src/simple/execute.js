import guarded from 'hof/guarded';

export default async function execute(fn, ...args) {
  const guardedFn = guarded(fn);
  return await guardedFn(...args);
}