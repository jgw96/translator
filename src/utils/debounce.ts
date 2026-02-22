/**
 * Creates a debounced version of a function that delays invoking
 * `func` until after `wait` milliseconds have elapsed since the
 * last time the debounced function was invoked.
 */
export function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  wait: number
): (...args: A) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: A) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}
