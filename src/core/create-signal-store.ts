import { signal } from '@angular/core';
import type {
  SignalStoreConfig,
  SignalStoreInstance,
  SignalStoreState,
} from '../types';

/**
 * Creates a reactive store powered by Angular Signals.
 *
 * Each property in the initial state becomes a WritableSignal.
 * Optionally define computed signals and methods.
 *
 * @example
 * ```ts
 * const counter = createSignalStore({
 *   state: { count: 0 },
 *   computed: (s) => ({
 *     doubled: computed(() => s.count() * 2),
 *   }),
 *   methods: (s, set) => ({
 *     increment: () => set({ count: s.count() + 1 }),
 *   }),
 * });
 *
 * counter.count();   // 0
 * counter.increment();
 * counter.count();   // 1
 * counter.doubled(); // 2
 * ```
 */
export function createSignalStore<
  TState extends Record<string, any>,
  TComputed extends Record<string, any> = {},
  TMethods extends Record<string, any> = {},
>(
  config: SignalStoreConfig<TState, TComputed, TMethods>,
): SignalStoreInstance<TState, TComputed, TMethods> {
  const initialState = { ...config.state };

  // Create a WritableSignal for every key in the initial state
  const signalState = {} as SignalStoreState<TState>;
  for (const key of Object.keys(initialState) as Array<keyof TState>) {
    (signalState as any)[key] = signal(initialState[key]);
  }

  // set() — batch-update multiple state properties
  const set = (partial: Partial<TState>): void => {
    for (const key of Object.keys(partial) as Array<keyof TState>) {
      if (key in signalState) {
        signalState[key].set(partial[key] as TState[typeof key]);
      }
    }
  };

  // update() — functional updater
  const update = (updater: (state: TState) => Partial<TState>): void => {
    const current = snapshot();
    set(updater(current));
  };

  // snapshot() — get plain object of current values
  const snapshot = (): TState => {
    const result = {} as TState;
    for (const key of Object.keys(signalState) as Array<keyof TState>) {
      result[key] = signalState[key]();
    }
    return result;
  };

  // reset() — restore initial state
  const reset = (): void => {
    set({ ...initialState } as Partial<TState>);
  };

  // Build computed signals
  const computedSignals = config.computed
    ? config.computed(signalState)
    : ({} as TComputed);

  // Build methods
  const methods = config.methods
    ? config.methods(signalState, set)
    : ({} as TMethods);

  // Merge everything into a single object
  return Object.assign(
    {},
    signalState,
    computedSignals,
    methods,
    { snapshot, set, update, reset },
  ) as SignalStoreInstance<TState, TComputed, TMethods>;
}
