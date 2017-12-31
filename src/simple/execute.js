import guarded from 'hof/guarded';

export default function execute(fn, ...args) {
  const guardedFn = guarded(fn);
  return guardedFn(...args);
}