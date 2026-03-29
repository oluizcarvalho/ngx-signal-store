# createEntityStore

Creates a reactive store optimized for managing collections of entities, with built-in CRUD operations and computed helpers.

## Signature

```typescript
function createEntityStore<T extends Record<string, any>>(
  config?: EntityStoreConfig<T>
): EntityStoreInstance<T>
```

## Config

| Property | Type | Default | Description |
|---|---|---|---|
| `idKey` | `keyof T` | `'id'` | The property used as the unique identifier |
| `initialEntities` | `T[]` | `[]` | Entities to pre-populate the store |
| `sortBy` | `(a: T, b: T) => number` | — | Optional comparator to keep entities sorted |

## Return Value

### Signals

| Property | Type | Description |
|---|---|---|
| `entities` | `Signal<T[]>` | All entities as an array |
| `ids` | `Signal<Array<T[idKey]>>` | All entity IDs |
| `entityMap` | `Signal<Map<id, T>>` | Entities indexed by ID |
| `length` | `Signal<number>` | Total entity count |
| `isEmpty` | `Signal<boolean>` | True when the store is empty |

### Methods

| Method | Description |
|---|---|
| `getById(id)` | Returns the entity with the given ID, or `undefined` |
| `addOne(entity)` | Add a single entity |
| `addMany(entities)` | Add multiple entities |
| `updateOne(id, changes)` | Partially update an entity |
| `updateMany(updates)` | Batch-update multiple entities |
| `removeOne(id)` | Remove a single entity |
| `removeMany(ids)` | Remove multiple entities |
| `setAll(entities)` | Replace the entire collection |
| `clear()` | Remove all entities |
| `snapshot()` | Current entities as a plain array copy |
| `set(entities)` | Replace collection (same as `setAll`) |
| `reset()` | Restore `initialEntities` |

## Examples

### Basic CRUD

```typescript
interface Todo { id: number; title: string; done: boolean }

const todos = createEntityStore<Todo>({ idKey: 'id' });

todos.addOne({ id: 1, title: 'Buy milk', done: false });
todos.addMany([
  { id: 2, title: 'Walk dog', done: false },
  { id: 3, title: 'Read book', done: true },
]);

todos.length();  // 3
todos.ids();     // [1, 2, 3]
todos.isEmpty(); // false

todos.updateOne(1, { done: true });
todos.getById(1); // { id: 1, title: 'Buy milk', done: true }

todos.removeOne(3);
todos.length(); // 2
```

### Custom ID key

```typescript
interface Product { sku: string; name: string; price: number }

const products = createEntityStore<Product>({ idKey: 'sku' });

products.addOne({ sku: 'WIDGET-001', name: 'Widget', price: 9.99 });
products.getById('WIDGET-001'); // { sku: 'WIDGET-001', ... }
```

### Sorted collection

```typescript
interface User { id: string; name: string }

const users = createEntityStore<User>({
  sortBy: (a, b) => a.name.localeCompare(b.name),
});

users.addMany([
  { id: '1', name: 'Charlie' },
  { id: '2', name: 'Alice' },
  { id: '3', name: 'Bob' },
]);

users.entities().map(u => u.name); // ['Alice', 'Bob', 'Charlie']
```

### With initial data

```typescript
const store = createEntityStore<User>({
  initialEntities: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ],
});

store.length();   // 2

// Reset restores the initial data
store.clear();
store.length();   // 0
store.reset();
store.length();   // 2
```

### Batch update

```typescript
todos.updateMany([
  { id: 1, changes: { done: true } },
  { id: 2, changes: { title: 'Walk the dog' } },
]);
```

### Using entityMap for fast lookups

```typescript
const map = todos.entityMap(); // Map<number, Todo>
map.get(1); // O(1) lookup
```

## Notes

- All mutation methods update immutably — the internal array is never mutated in place.
- If `sortBy` is provided, entities are re-sorted after every mutation (add, update, setAll).
- `getById` scans the array linearly; for O(1) lookups use `entityMap()`.
