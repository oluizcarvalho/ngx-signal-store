import { signal, computed } from '@angular/core';
import type { EntityStoreConfig, EntityStoreInstance } from '../types';

/**
 * Creates a reactive entity store with built-in CRUD operations.
 *
 * @example
 * ```ts
 * interface Todo { id: number; title: string; done: boolean }
 *
 * const todos = createEntityStore<Todo>({ idKey: 'id' });
 *
 * todos.addOne({ id: 1, title: 'Learn Signals', done: false });
 * todos.entities(); // [{ id: 1, title: 'Learn Signals', done: false }]
 * todos.length();   // 1
 *
 * todos.updateOne(1, { done: true });
 * todos.removeOne(1);
 * todos.isEmpty();  // true
 * ```
 */
export function createEntityStore<T extends Record<string, any>>(
  config: EntityStoreConfig<T, keyof T> = {},
): EntityStoreInstance<T> {
  const idKey = (config.idKey ?? 'id') as keyof T;
  const initialEntities = config.initialEntities ? [...config.initialEntities] : [];
  const sortFn = config.sortBy;

  const entities = signal<T[]>(applySorting(initialEntities));

  // Computed signals
  const ids = computed(() => entities().map((e) => e[idKey]));
  const entityMap = computed(
    () => new Map(entities().map((e) => [e[idKey], e])),
  );
  const length = computed(() => entities().length);
  const isEmpty = computed(() => entities().length === 0);

  function applySorting(list: T[]): T[] {
    return sortFn ? [...list].sort(sortFn) : list;
  }

  function getById(id: T[keyof T]): T | undefined {
    return entities().find((e) => e[idKey] === id);
  }

  function addOne(entity: T): void {
    entities.update((list) => applySorting([...list, entity]));
  }

  function addMany(newEntities: T[]): void {
    entities.update((list) => applySorting([...list, ...newEntities]));
  }

  function updateOne(id: T[keyof T], changes: Partial<T>): void {
    entities.update((list) =>
      applySorting(
        list.map((e) => (e[idKey] === id ? { ...e, ...changes } : e)),
      ),
    );
  }

  function updateMany(
    updates: Array<{ id: T[keyof T]; changes: Partial<T> }>,
  ): void {
    entities.update((list) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.changes]));
      return applySorting(
        list.map((e) => {
          const changes = updateMap.get(e[idKey]);
          return changes ? { ...e, ...changes } : e;
        }),
      );
    });
  }

  function removeOne(id: T[keyof T]): void {
    entities.update((list) => list.filter((e) => e[idKey] !== id));
  }

  function removeMany(idsToRemove: Array<T[keyof T]>): void {
    const idSet = new Set(idsToRemove);
    entities.update((list) => list.filter((e) => !idSet.has(e[idKey])));
  }

  function setAll(newEntities: T[]): void {
    entities.set(applySorting([...newEntities]));
  }

  function clear(): void {
    entities.set([]);
  }

  function snapshot(): T[] {
    return [...entities()];
  }

  function set(newEntities: T[]): void {
    entities.set(applySorting([...newEntities]));
  }

  function reset(): void {
    entities.set(applySorting([...initialEntities]));
  }

  return {
    entities,
    ids,
    entityMap,
    length,
    isEmpty,
    getById,
    addOne,
    addMany,
    updateOne,
    updateMany,
    removeOne,
    removeMany,
    setAll,
    clear,
    snapshot,
    set,
    reset,
  };
}
