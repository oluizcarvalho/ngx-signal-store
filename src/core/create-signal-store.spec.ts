import { describe, it, expect } from 'vitest';
import { computed } from '@angular/core';
import { createSignalStore } from './create-signal-store';

describe('createSignalStore', () => {
  it('should create a store with initial state as signals', () => {
    const store = createSignalStore({
      state: { count: 0, name: 'test' },
    });

    expect(store.count()).toBe(0);
    expect(store.name()).toBe('test');
  });

  it('should update state via set()', () => {
    const store = createSignalStore({
      state: { count: 0, name: 'test' },
    });

    store.set({ count: 5 });
    expect(store.count()).toBe(5);
    expect(store.name()).toBe('test'); // unchanged
  });

  it('should batch-update multiple properties via set()', () => {
    const store = createSignalStore({
      state: { a: 1, b: 2, c: 3 },
    });

    store.set({ a: 10, c: 30 });
    expect(store.a()).toBe(10);
    expect(store.b()).toBe(2);
    expect(store.c()).toBe(30);
  });

  it('should support update() with a function', () => {
    const store = createSignalStore({
      state: { count: 5 },
    });

    store.update((s) => ({ count: s.count * 2 }));
    expect(store.count()).toBe(10);
  });

  it('should return a snapshot of current state', () => {
    const store = createSignalStore({
      state: { x: 1, y: 'hello' },
    });

    store.set({ x: 42 });
    const snap = store.snapshot();
    expect(snap).toEqual({ x: 42, y: 'hello' });
  });

  it('should reset to initial state', () => {
    const store = createSignalStore({
      state: { count: 0, name: 'init' },
    });

    store.set({ count: 99, name: 'changed' });
    store.reset();
    expect(store.count()).toBe(0);
    expect(store.name()).toBe('init');
  });

  it('should support computed signals', () => {
    const store = createSignalStore({
      state: { price: 100, quantity: 3 },
      computed: (s) => ({
        total: computed(() => s.price() * s.quantity()),
      }),
    });

    expect(store.total()).toBe(300);

    store.set({ quantity: 5 });
    expect(store.total()).toBe(500);
  });

  it('should support methods', () => {
    const store = createSignalStore({
      state: { count: 0 },
      methods: (s, set) => ({
        increment: () => set({ count: s.count() + 1 }),
        decrement: () => set({ count: s.count() - 1 }),
        incrementBy: (n: number) => set({ count: s.count() + n }),
      }),
    });

    store.increment();
    expect(store.count()).toBe(1);

    store.incrementBy(4);
    expect(store.count()).toBe(5);

    store.decrement();
    expect(store.count()).toBe(4);
  });

  it('should support computed + methods together', () => {
    const store = createSignalStore({
      state: { items: [] as number[] },
      computed: (s) => ({
        total: computed(() => s.items().reduce((a, b) => a + b, 0)),
        count: computed(() => s.items().length),
      }),
      methods: (s, set) => ({
        add: (n: number) => set({ items: [...s.items(), n] }),
        clear: () => set({ items: [] }),
      }),
    });

    store.add(10);
    store.add(20);
    expect(store.total()).toBe(30);
    expect(store.count()).toBe(2);

    store.clear();
    expect(store.total()).toBe(0);
    expect(store.count()).toBe(0);
  });

  it('snapshot should return a plain object, not signals', () => {
    const store = createSignalStore({
      state: { value: 42 },
    });

    const snap = store.snapshot();
    expect(typeof snap.value).toBe('number');
    expect(snap.value).toBe(42);
  });
});
