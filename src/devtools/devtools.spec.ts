import { describe, it, expect } from 'vitest';
import { createSignalStore } from '../core/create-signal-store';
import { withDevTools } from './devtools';

describe('withDevTools', () => {
  const makeStore = () =>
    withDevTools(
      createSignalStore({
        state: { count: 0, name: 'init' },
      }),
    );

  it('should initialize with one history entry', () => {
    const store = makeStore();
    expect(store.history().length).toBe(1);
    expect(store.historyIndex()).toBe(0);
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
  });

  it('should record state changes in history', () => {
    const store = makeStore();

    store.set({ count: 1 });
    expect(store.history().length).toBe(2);

    store.set({ count: 2 });
    expect(store.history().length).toBe(3);
    expect(store.historyIndex()).toBe(2);
  });

  it('should undo state changes', () => {
    const store = makeStore();

    store.set({ count: 1 });
    store.set({ count: 2 });
    expect(store.count()).toBe(2);

    store.undo();
    expect(store.count()).toBe(1);
    expect(store.historyIndex()).toBe(1);

    store.undo();
    expect(store.count()).toBe(0);
    expect(store.historyIndex()).toBe(0);
  });

  it('should redo undone changes', () => {
    const store = makeStore();

    store.set({ count: 1 });
    store.set({ count: 2 });

    store.undo();
    store.undo();
    expect(store.count()).toBe(0);

    store.redo();
    expect(store.count()).toBe(1);

    store.redo();
    expect(store.count()).toBe(2);
  });

  it('should report canUndo/canRedo correctly', () => {
    const store = makeStore();

    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);

    store.set({ count: 1 });
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);

    store.undo();
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(true);
  });

  it('should discard redo history on new change after undo', () => {
    const store = makeStore();

    store.set({ count: 1 });
    store.set({ count: 2 });
    store.set({ count: 3 });

    store.undo(); // back to 2
    store.undo(); // back to 1

    store.set({ count: 99 });
    expect(store.canRedo()).toBe(false);
    expect(store.history().length).toBe(3); // [0, 1, 99]
  });

  it('should jumpTo a specific history index', () => {
    const store = makeStore();

    store.set({ count: 10 });
    store.set({ count: 20 });
    store.set({ count: 30 });

    store.jumpTo(1);
    expect(store.count()).toBe(10);
    expect(store.historyIndex()).toBe(1);

    store.jumpTo(3);
    expect(store.count()).toBe(30);
    expect(store.historyIndex()).toBe(3);
  });

  it('should enforce maxHistory', () => {
    const store = withDevTools(
      createSignalStore({ state: { count: 0 } }),
      { maxHistory: 5 },
    );

    for (let i = 1; i <= 10; i++) {
      store.set({ count: i });
    }

    expect(store.history().length).toBeLessThanOrEqual(5);
    // Should still have the most recent entries
    expect(store.count()).toBe(10);
  });

  it('should not record history during undo/redo', () => {
    const store = makeStore();

    store.set({ count: 1 });
    store.set({ count: 2 });

    const historyBefore = store.history().length;
    store.undo();
    expect(store.history().length).toBe(historyBefore); // no new entries
  });

  it('should handle multiple properties', () => {
    const store = makeStore();

    store.set({ count: 5, name: 'changed' });
    expect(store.count()).toBe(5);
    expect(store.name()).toBe('changed');

    store.undo();
    expect(store.count()).toBe(0);
    expect(store.name()).toBe('init');
  });
});
