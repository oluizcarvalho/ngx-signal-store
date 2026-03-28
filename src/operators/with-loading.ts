import { signal, type Signal, type WritableSignal } from '@angular/core';

export interface LoadingState {
  loading: Signal<boolean>;
  error: Signal<string | null>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  /** Wraps an async function with automatic loading/error state management. */
  withAsync: <R>(fn: () => Promise<R>) => Promise<R>;
}

/**
 * Adds loading and error state management to any store.
 *
 * @example
 * ```ts
 * const store = withLoading(createEntityStore<User>());
 *
 * await store.withAsync(async () => {
 *   const users = await fetchUsers();
 *   store.setAll(users);
 * });
 *
 * store.loading(); // false (after completion)
 * store.error();   // null (if no error)
 * ```
 */
export function withLoading<T extends Record<string, any>>(
  store: T,
): T & LoadingState {
  const _loading: WritableSignal<boolean> = signal(false);
  const _error: WritableSignal<string | null> = signal(null);

  const setLoading = (value: boolean): void => {
    _loading.set(value);
  };

  const setError = (value: string | null): void => {
    _error.set(value);
  };

  const withAsync = async <R>(fn: () => Promise<R>): Promise<R> => {
    _loading.set(true);
    _error.set(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      _error.set(message);
      throw err;
    } finally {
      _loading.set(false);
    }
  };

  return Object.assign({}, store, {
    loading: _loading.asReadonly(),
    error: _error.asReadonly(),
    setLoading,
    setError,
    withAsync,
  });
}
