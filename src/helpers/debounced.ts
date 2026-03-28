import { signal, type Signal, type WritableSignal } from '@angular/core';

/**
 * Creates a debounced signal that updates after a delay.
 *
 * Returns a read-only signal whose value trails the source by `delayMs`.
 * Also returns a `destroy()` function to clean up the polling interval.
 *
 * @example
 * ```ts
 * const search = signal('');
 * const debouncedSearch = debounced(search, 300);
 *
 * search.set('hello');
 * // After 300ms:
 * // debouncedSearch.value(); // 'hello'
 *
 * // Clean up when done:
 * debouncedSearch.destroy();
 * ```
 */
export interface DebouncedSignal<T> {
  /** The debounced read-only signal. */
  value: Signal<T>;
  /** Stops the internal polling. Call this when the signal is no longer needed. */
  destroy: () => void;
}

export function debounced<T>(
  source: Signal<T>,
  delayMs: number,
): DebouncedSignal<T> {
  const output: WritableSignal<T> = signal(source());
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastSeenValue: T = source();
  let destroyed = false;

  // Poll for source changes since we can't rely on effect() outside injection context
  const intervalId = setInterval(() => {
    if (destroyed) return;
    const current = source();
    if (!Object.is(current, lastSeenValue)) {
      lastSeenValue = current;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        if (!destroyed) {
          output.set(current);
        }
      }, delayMs);
    }
  }, 16); // ~60fps polling

  const destroy = (): void => {
    destroyed = true;
    clearInterval(intervalId);
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };

  return {
    value: output.asReadonly(),
    destroy,
  };
}
