import { describe, it, expect } from 'vitest';
import { signal } from '@angular/core';
import { withFilter } from './with-filter';

interface Item {
  id: number;
  name: string;
}

describe('withFilter', () => {
  const makeStore = (items: Item[] = []) => ({
    entities: signal(items),
    extra: 'preserved',
  });

  const filterFn = (item: Item, query: string) =>
    item.name.toLowerCase().includes(query.toLowerCase());

  it('should add filter and filteredEntities signals', () => {
    const store = withFilter(makeStore(), filterFn);

    expect(store.filter()).toBe('');
    expect(store.filteredEntities()).toEqual([]);
  });

  it('should return all entities when filter is empty', () => {
    const items = [
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
    ];
    const store = withFilter(makeStore(items), filterFn);

    expect(store.filteredEntities()).toEqual(items);
  });

  it('should filter entities by query', () => {
    const items = [
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
      { id: 3, name: 'Avocado' },
    ];
    const store = withFilter(makeStore(items), filterFn);

    store.setFilter('a');
    // 'Apple', 'Banana', 'Avocado' all contain 'a'
    expect(store.filteredEntities().length).toBe(3);

    store.setFilter('an');
    // 'Banana' contains 'an'
    expect(store.filteredEntities()).toEqual([{ id: 2, name: 'Banana' }]);
  });

  it('should react to entity changes', () => {
    const items = [{ id: 1, name: 'Apple' }];
    const base = makeStore(items);
    const store = withFilter(base, filterFn);

    store.setFilter('ban');
    expect(store.filteredEntities()).toEqual([]);

    // Add a matching entity
    base.entities.set([
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
    ]);
    expect(store.filteredEntities()).toEqual([{ id: 2, name: 'Banana' }]);
  });

  it('should preserve original store properties', () => {
    const store = withFilter(makeStore(), filterFn);
    expect(store.extra).toBe('preserved');
  });
});
