# withFilter

Adds text-based filtering to a store that exposes an `entities` signal.

## Signature

```typescript
function withFilter<T, E>(
  store: T & { entities: Signal<E[]> },
  filterFn: (entity: E, query: string) => boolean
): T & FilterState<E>
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `store` | `T & { entities: Signal<E[]> }` | Any store with an `entities` signal (typically `createEntityStore`) |
| `filterFn` | `(entity: E, query: string) => boolean` | Returns `true` if the entity matches the query |

## Return Value (additional properties)

| Property | Type | Description |
|---|---|---|
| `filter` | `Signal<string>` | The current filter query (starts as `''`) |
| `setFilter(query)` | `(string) => void` | Update the filter query |
| `filteredEntities` | `Signal<E[]>` | Entities matching the current filter. Returns all entities when query is empty. |

## Examples

### Basic filtering

```typescript
import { createEntityStore, withFilter } from 'ngx-signal-store';

interface Todo { id: number; title: string; done: boolean }

const store = withFilter(
  createEntityStore<Todo>(),
  (todo, query) => todo.title.toLowerCase().includes(query.toLowerCase())
);

store.addMany([
  { id: 1, title: 'Buy groceries', done: false },
  { id: 2, title: 'Walk the dog', done: false },
  { id: 3, title: 'Buy flowers', done: true },
]);

store.filteredEntities().length; // 3 (no filter)

store.setFilter('buy');
store.filteredEntities();
// [{ id: 1, title: 'Buy groceries'... }, { id: 3, title: 'Buy flowers'... }]
```

### Multi-field filter

```typescript
interface User { id: string; name: string; email: string; role: string }

const store = withFilter(
  createEntityStore<User>(),
  (user, query) => {
    const q = query.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );
  }
);
```

### In a component with input binding

```typescript
@Component({
  template: `
    <input
      [value]="store.filter()"
      (input)="store.setFilter($event.target.value)"
      placeholder="Search..."
    />

    @for (item of store.filteredEntities(); track item.id) {
      <app-item [item]="item" />
    }

    <p>{{ store.filteredEntities().length }} results</p>
  `,
})
export class ItemListComponent {
  store = inject(ItemService);
}
```

### Combined with pagination

```typescript
import { computed } from '@angular/core';
import { createEntityStore, withLoading, withPagination, withFilter } from 'ngx-signal-store';

const store = withFilter(
  withPagination(withLoading(createEntityStore<Product>()), { pageSize: 10 }),
  (p, q) => p.name.toLowerCase().includes(q.toLowerCase())
);

// Page the filtered results
const pagedFiltered = computed(() => {
  const items = store.filteredEntities();
  const start = (store.page() - 1) * store.pageSize();
  return items.slice(start, start + store.pageSize());
});
```

## Notes

- When `filter()` is empty (`''`), `filteredEntities()` returns all entities without calling `filterFn`.
- `filteredEntities` is a `computed()` signal — it re-evaluates automatically when either the filter or the entity list changes.
- The filter is always a string. For complex filter objects, use `createSignalStore` directly with a custom `computed`.
