import { signal, computed, type Signal } from '@angular/core';
import type { DevToolsOptions } from '../types';

export interface DevToolsState {
  /** Undo the last state change. */
  undo: () => void;
  /** Redo a previously undone state change. */
  redo: () => void;
  /** Whether undo is available. */
  canUndo: Signal<boolean>;
  /** Whether redo is available. */
  canRedo: Signal<boolean>;
  /** Full history of state snapshots. */
  history: Signal<any[]>;
  /** Current position in the history stack. */
  historyIndex: Signal<number>;
  /** Jump to a specific point in history. */
  jumpTo: (index: number) => void;
  /** Manually record the current state as a history entry. */
  record: () => void;
}

/**
 * Adds time-travel debugging (undo/redo) to any store that implements
 * `snapshot()` and `set()`.
 *
 * The original `set()` method is wrapped so that every state change
 * is automatically recorded in the history stack.
 *
 * @example
 * ```ts
 * const store = withDevTools(
 *   createSignalStore({ state: { count: 0 } }),
 *   { name: 'Counter', maxHistory: 100 },
 * );
 *
 * store.set({ count: 1 });
 * store.set({ count: 2 });
 * store.canUndo(); // true
 *
 * store.undo();
 * store.snapshot(); // { count: 1 }
 *
 * store.redo();
 * store.snapshot(); // { count: 2 }
 * ```
 */
export function withDevTools<
  T extends Record<string, any> & {
    snapshot: () => any;
    set: (...args: any[]) => void;
  },
>(store: T, options: DevToolsOptions = {}): T & DevToolsState {
  const maxHistory = options.maxHistory ?? 50;

  // Initialize history with the current snapshot
  const _history = signal<any[]>([structuredClone(store.snapshot())]);
  const _index = signal(0);
  let _isTimeTraveling = false;

  const canUndo = computed(() => _index() > 0);
  const canRedo = computed(() => _index() < _history().length - 1);

  // Wrap the original set() to record history on each call
  const originalSet = store.set.bind(store);
  const wrappedSet = (...args: any[]): void => {
    (originalSet as any)(...args);
    if (!_isTimeTraveling) {
      recordSnapshot();
    }
  };

  function recordSnapshot(): void {
    const snap = structuredClone(store.snapshot());
    _history.update((h) => {
      // Discard any redo entries beyond current index
      const trimmed = h.slice(0, _index() + 1);
      trimmed.push(snap);
      // Enforce max history
      if (trimmed.length > maxHistory) {
        return trimmed.slice(trimmed.length - maxHistory);
      }
      return trimmed;
    });
    _index.set(_history().length - 1);
  }

  function restoreSnapshot(snap: any): void {
    _isTimeTraveling = true;
    originalSet(snap);
    _isTimeTraveling = false;
  }

  const undo = (): void => {
    if (canUndo()) {
      _index.update((i) => i - 1);
      restoreSnapshot(structuredClone(_history()[_index()]));
    }
  };

  const redo = (): void => {
    if (canRedo()) {
      _index.update((i) => i + 1);
      restoreSnapshot(structuredClone(_history()[_index()]));
    }
  };

  const jumpTo = (index: number): void => {
    const h = _history();
    if (index >= 0 && index < h.length) {
      _index.set(index);
      restoreSnapshot(structuredClone(h[index]));
    }
  };

  const record = (): void => {
    recordSnapshot();
  };

  return Object.assign({}, store, {
    set: wrappedSet,
    undo,
    redo,
    canUndo,
    canRedo,
    history: _history.asReadonly(),
    historyIndex: _index.asReadonly(),
    jumpTo,
    record,
  }) as T & DevToolsState;
}
