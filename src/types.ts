import { Signal, WritableSignal } from '@angular/core';

/** Maps each key of T to a WritableSignal holding that key's value type. */
export type SignalStoreState<T> = { [K in keyof T]: WritableSignal<T[K]> };

/** Maps each key of T to a read-only Signal. */
export type ReadonlySignals<T> = { [K in keyof T]: Signal<T[K]> };

/** Configuration for createSignalStore. */
export interface SignalStoreConfig<
  TState extends Record<string, any>,
  TComputed extends Record<string, any> = {},
  TMethods extends Record<string, any> = {},
> {
  state: TState;
  computed?: (state: SignalStoreState<TState>) => TComputed;
  methods?: (
    state: SignalStoreState<TState>,
    set: (partial: Partial<TState>) => void,
  ) => TMethods;
}

/** Configuration for createEntityStore. */
export interface EntityStoreConfig<
  T extends Record<string, any>,
  K extends keyof T = 'id' extends keyof T ? 'id' : keyof T,
> {
  idKey?: K;
  initialEntities?: T[];
  sortBy?: (a: T, b: T) => number;
}

/** The return type of createSignalStore. */
export type SignalStoreInstance<
  TState extends Record<string, any>,
  TComputed extends Record<string, any> = {},
  TMethods extends Record<string, any> = {},
> = SignalStoreState<TState> &
  TComputed &
  TMethods & {
    snapshot: () => TState;
    set: (partial: Partial<TState>) => void;
    update: (updater: (state: TState) => Partial<TState>) => void;
    reset: () => void;
  };

/** The return type of createEntityStore. */
export interface EntityStoreInstance<T extends Record<string, any>> {
  entities: WritableSignal<T[]>;
  ids: Signal<Array<T[keyof T]>>;
  entityMap: Signal<Map<T[keyof T], T>>;
  length: Signal<number>;
  isEmpty: Signal<boolean>;
  getById: (id: T[keyof T]) => T | undefined;
  addOne: (entity: T) => void;
  addMany: (entities: T[]) => void;
  updateOne: (id: T[keyof T], changes: Partial<T>) => void;
  updateMany: (updates: Array<{ id: T[keyof T]; changes: Partial<T> }>) => void;
  removeOne: (id: T[keyof T]) => void;
  removeMany: (ids: Array<T[keyof T]>) => void;
  setAll: (entities: T[]) => void;
  clear: () => void;
  snapshot: () => T[];
  set: (entities: T[]) => void;
  reset: () => void;
}

/** Options for withDevTools. */
export interface DevToolsOptions {
  name?: string;
  maxHistory?: number;
}

/** Pagination configuration. */
export interface PaginationConfig {
  pageSize?: number;
}
