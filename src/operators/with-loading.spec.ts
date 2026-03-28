import { describe, it, expect } from 'vitest';
import { withLoading } from './with-loading';

describe('withLoading', () => {
  const makeStore = () => ({ value: 'test' });

  it('should add loading and error signals', () => {
    const store = withLoading(makeStore());

    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.value).toBe('test');
  });

  it('should update loading state', () => {
    const store = withLoading(makeStore());

    store.setLoading(true);
    expect(store.loading()).toBe(true);

    store.setLoading(false);
    expect(store.loading()).toBe(false);
  });

  it('should update error state', () => {
    const store = withLoading(makeStore());

    store.setError('Something went wrong');
    expect(store.error()).toBe('Something went wrong');

    store.setError(null);
    expect(store.error()).toBeNull();
  });

  it('withAsync should set loading during execution', async () => {
    const store = withLoading(makeStore());

    const promise = store.withAsync(async () => {
      expect(store.loading()).toBe(true);
      return 42;
    });

    const result = await promise;
    expect(result).toBe(42);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('withAsync should set error on failure', async () => {
    const store = withLoading(makeStore());

    try {
      await store.withAsync(async () => {
        throw new Error('Network error');
      });
    } catch {
      // expected
    }

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Network error');
  });

  it('withAsync should clear previous error on new call', async () => {
    const store = withLoading(makeStore());

    // First call fails
    try {
      await store.withAsync(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }
    expect(store.error()).toBe('fail');

    // Second call succeeds
    await store.withAsync(async () => 'ok');
    expect(store.error()).toBeNull();
  });
});
