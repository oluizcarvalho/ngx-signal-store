# withPagination

Adds pagination state and navigation helpers to any store.

## Signature

```typescript
function withPagination<T>(
  store: T,
  config?: PaginationConfig
): T & PaginationState
```

## Config

| Property | Type | Default | Description |
|---|---|---|---|
| `pageSize` | `number` | `10` | Number of items per page |

## Return Value (additional properties)

| Property | Type | Description |
|---|---|---|
| `page` | `Signal<number>` | Current page number (1-based) |
| `pageSize` | `Signal<number>` | Items per page |
| `totalItems` | `Signal<number>` | Total item count (set manually, e.g. from API response) |
| `totalPages` | `Signal<number>` | `ceil(totalItems / pageSize)`, minimum 1 |
| `hasNextPage` | `Signal<boolean>` | `true` if there is a next page |
| `hasPrevPage` | `Signal<boolean>` | `true` if there is a previous page |
| `setPage(n)` | `(number) => void` | Navigate to a specific page |
| `setPageSize(n)` | `(number) => void` | Change page size (resets to page 1) |
| `setTotalItems(n)` | `(number) => void` | Update the total item count |
| `nextPage()` | `() => void` | Go to next page (no-op on last page) |
| `prevPage()` | `() => void` | Go to previous page (no-op on first page) |

## Examples

### Basic pagination

```typescript
import { createEntityStore, withPagination } from 'ngx-signal-store';

const store = withPagination(
  createEntityStore<User>(),
  { pageSize: 20 }
);

store.page();        // 1
store.pageSize();    // 20
store.totalItems();  // 0
store.totalPages();  // 1 (minimum)

// After loading data from API:
store.setAll(users);
store.setTotalItems(153);
store.totalPages();  // 8 (ceil(153/20))
store.hasNextPage(); // true
```

### Navigation

```typescript
store.nextPage();
store.page();        // 2
store.hasPrevPage(); // true

store.setPage(5);
store.page();        // 5

store.prevPage();
store.page();        // 4

// Clamped — won't exceed bounds:
store.setPage(999);
store.page();        // 8 (last page)
```

### Slicing entities client-side

```typescript
import { computed } from '@angular/core';

const store = withPagination(createEntityStore<User>(), { pageSize: 10 });

// Compute current page items from full entity list
const pageItems = computed(() => {
  const start = (store.page() - 1) * store.pageSize();
  return store.entities().slice(start, start + store.pageSize());
});
```

### Server-side pagination

```typescript
async function loadPage() {
  const res = await fetch(
    `/api/users?page=${store.page()}&size=${store.pageSize()}`
  );
  const { data, total } = await res.json();
  store.setAll(data);
  store.setTotalItems(total);
}

// Call on init and whenever page changes
```

### With loading

```typescript
import { withLoading, withPagination, createEntityStore } from 'ngx-signal-store';

const store = withPagination(
  withLoading(createEntityStore<Product>()),
  { pageSize: 25 }
);

await store.withAsync(async () => {
  const { data, total } = await fetchProducts(store.page(), store.pageSize());
  store.setAll(data);
  store.setTotalItems(total);
});
```

## Notes

- `page` is always ≥ 1.
- `setPageSize` resets `page` to 1 to avoid out-of-range states.
- `totalItems` must be set manually from your API response — the store does not count entities automatically, because server-side pagination means the full list isn't loaded locally.
