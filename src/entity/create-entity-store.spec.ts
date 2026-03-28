import { describe, it, expect } from 'vitest';
import { createEntityStore } from './create-entity-store';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

describe('createEntityStore', () => {
  it('should create an empty store by default', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    expect(store.entities()).toEqual([]);
    expect(store.ids()).toEqual([]);
    expect(store.length()).toBe(0);
    expect(store.isEmpty()).toBe(true);
  });

  it('should accept initial entities', () => {
    const store = createEntityStore<Todo>({
      idKey: 'id',
      initialEntities: [
        { id: 1, title: 'A', done: false },
        { id: 2, title: 'B', done: true },
      ],
    });

    expect(store.length()).toBe(2);
    expect(store.ids()).toEqual([1, 2]);
    expect(store.isEmpty()).toBe(false);
  });

  it('should default idKey to "id"', () => {
    const store = createEntityStore<Todo>();
    store.addOne({ id: 1, title: 'Test', done: false });
    expect(store.getById(1)).toEqual({ id: 1, title: 'Test', done: false });
  });

  it('should addOne entity', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addOne({ id: 1, title: 'Test', done: false });

    expect(store.length()).toBe(1);
    expect(store.entities()[0]).toEqual({ id: 1, title: 'Test', done: false });
  });

  it('should addMany entities', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addMany([
      { id: 1, title: 'A', done: false },
      { id: 2, title: 'B', done: false },
    ]);

    expect(store.length()).toBe(2);
  });

  it('should getById', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addOne({ id: 42, title: 'Find me', done: false });

    expect(store.getById(42)).toEqual({ id: 42, title: 'Find me', done: false });
    expect(store.getById(99)).toBeUndefined();
  });

  it('should provide an entityMap', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addMany([
      { id: 1, title: 'A', done: false },
      { id: 2, title: 'B', done: true },
    ]);

    const map = store.entityMap();
    expect(map.get(1)?.title).toBe('A');
    expect(map.get(2)?.done).toBe(true);
  });

  it('should updateOne entity', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addOne({ id: 1, title: 'Original', done: false });

    store.updateOne(1, { title: 'Updated', done: true });
    expect(store.getById(1)).toEqual({ id: 1, title: 'Updated', done: true });
  });

  it('should updateMany entities', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addMany([
      { id: 1, title: 'A', done: false },
      { id: 2, title: 'B', done: false },
    ]);

    store.updateMany([
      { id: 1, changes: { done: true } },
      { id: 2, changes: { title: 'B-updated' } },
    ]);

    expect(store.getById(1)?.done).toBe(true);
    expect(store.getById(2)?.title).toBe('B-updated');
  });

  it('should removeOne entity', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addMany([
      { id: 1, title: 'A', done: false },
      { id: 2, title: 'B', done: false },
    ]);

    store.removeOne(1);
    expect(store.length()).toBe(1);
    expect(store.getById(1)).toBeUndefined();
  });

  it('should removeMany entities', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addMany([
      { id: 1, title: 'A', done: false },
      { id: 2, title: 'B', done: false },
      { id: 3, title: 'C', done: false },
    ]);

    store.removeMany([1, 3]);
    expect(store.length()).toBe(1);
    expect(store.ids()).toEqual([2]);
  });

  it('should setAll entities (replace)', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addOne({ id: 1, title: 'Old', done: false });

    store.setAll([
      { id: 10, title: 'New A', done: false },
      { id: 20, title: 'New B', done: true },
    ]);

    expect(store.length()).toBe(2);
    expect(store.ids()).toEqual([10, 20]);
  });

  it('should clear all entities', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addMany([
      { id: 1, title: 'A', done: false },
      { id: 2, title: 'B', done: false },
    ]);

    store.clear();
    expect(store.isEmpty()).toBe(true);
  });

  it('should return a snapshot (array copy)', () => {
    const store = createEntityStore<Todo>({ idKey: 'id' });
    store.addOne({ id: 1, title: 'A', done: false });

    const snap = store.snapshot();
    expect(snap).toEqual([{ id: 1, title: 'A', done: false }]);

    // Snapshot should be a copy
    snap.push({ id: 2, title: 'B', done: false });
    expect(store.length()).toBe(1);
  });

  it('should reset to initial entities', () => {
    const initial = [{ id: 1, title: 'Init', done: false }];
    const store = createEntityStore<Todo>({
      idKey: 'id',
      initialEntities: initial,
    });

    store.addOne({ id: 2, title: 'Extra', done: false });
    expect(store.length()).toBe(2);

    store.reset();
    expect(store.length()).toBe(1);
    expect(store.getById(1)?.title).toBe('Init');
  });

  it('should support sorting', () => {
    const store = createEntityStore<Todo>({
      idKey: 'id',
      sortBy: (a, b) => a.title.localeCompare(b.title),
    });

    store.addMany([
      { id: 1, title: 'Banana', done: false },
      { id: 2, title: 'Apple', done: false },
      { id: 3, title: 'Cherry', done: false },
    ]);

    expect(store.entities().map((e) => e.title)).toEqual([
      'Apple',
      'Banana',
      'Cherry',
    ]);
  });
});
