import { signal, computed, type Signal, type WritableSignal } from '@angular/core';

export interface FilterState<E> {
  filter: Signal<string>;
  setFilter: (filter: string) => void;
  filteredEntities: Signal<E[]>;
}

/**
 * Adds text filtering to an entity store.
 *
 * Requires the store to expose an `entities` signal.
 *
 * @example
 * ```ts
 * const store = withFilter(
 *   createEntityStore<Todo>(),
 *   (todo, query) => todo.title.toLowerCase().includes(query.toLowerCase()),
 * );
 *
 * store.addOne({ id: 1, title: 'Buy groceries', done: false });
 * store.setFilter('buy');
 * store.filteredEntities(); // [{ id: 1, title: 'Buy groceries', done: false }]
 * ```
 */
export function withFilter<
  T extends Record<string, any> & { entities: Signal<E[]> },
  E = T['entities'] extends Signal<(infer U)[]> ? U : never,
>(
  store: T,
  filterFn: (entity: E, query: string) => boolean,
): T & FilterState<E> {
  const _filter: WritableSignal<string> = signal('');

  const filteredEntities = computed(() => {
    const query = _filter();
    const items = store.entities() as E[];
    if (!query) return items;
    return items.filter((entity) => filterFn(entity, query));
  });

  const setFilter = (value: string): void => {
    _filter.set(value);
  };

  return Object.assign({}, store, {
    filter: _filter.asReadonly(),
    setFilter,
    filteredEntities,
  });
}
