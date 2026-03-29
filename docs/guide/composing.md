# Composing Operators

One of ngx-signal-store's key strengths is its composability. Operators are plain functions that wrap a store and return a new object with additional signals and methods.

## Operator Pattern

Each operator follows the same pattern:

```typescript
const enhanced = withOperator(baseStore, options?);
```

The result is the original store **merged with** new capabilities. No mutation, no magic — just object composition.

---

## Layering Operators

You can chain multiple operators. The order typically goes from base store outward:

```typescript
import {
  createEntityStore,
  withLoading,
  withPagination,
  withFilter,
  withDevTools,
} from 'ngx-signal-store';

interface Product { id: string; name: string; price: number; category: string }

const store = withDevTools(
  withFilter(
    withPagination(
      withLoading(
        createEntityStore<Product>()
      ),
      { pageSize: 25 }
    ),
    (product, query) => product.name.toLowerCase().includes(query.toLowerCase())
  ),
  { name: 'ProductStore', maxHistory: 50 }
);

// store now has ALL of:
store.entities();          // Signal<Product[]>       — from entity store
store.loading();           // Signal<boolean>         — from withLoading
store.withAsync(fn);       // auto loading/error      — from withLoading
store.page();              // Signal<number>          — from withPagination
store.nextPage();          //                         — from withPagination
store.filter();            // Signal<string>          — from withFilter
store.filteredEntities();  // Signal<Product[]>       — from withFilter
store.canUndo();           // Signal<boolean>         — from withDevTools
store.undo();              //                         — from withDevTools
```

---

## Practical Example: User List

A typical data-fetching store with pagination and loading:

```typescript
import { createEntityStore, withLoading, withPagination } from 'ngx-signal-store';

interface User { id: string; name: string; role: string }

function createUserStore() {
  const store = withPagination(
    withLoading(createEntityStore<User>()),
    { pageSize: 20 }
  );

  async function loadPage() {
    await store.withAsync(async () => {
      const res = await fetch(
        `/api/users?page=${store.page()}&size=${store.pageSize()}`
      );
      const { data, total } = await res.json();
      store.setAll(data);
      store.setTotalItems(total);
    });
  }

  return { ...store, loadPage };
}

export const userStore = createUserStore();
```

Usage:

```typescript
await userStore.loadPage();
userStore.entities();    // current page users
userStore.totalPages();  // computed from total
userStore.nextPage();
await userStore.loadPage(); // fetch next page
```

---

## Adding DevTools to Any Store

`withDevTools` works with both `createSignalStore` and `createEntityStore` — it just needs the store to have `snapshot()` and `set()`:

```typescript
import { createSignalStore, withDevTools } from 'ngx-signal-store';

const editorStore = withDevTools(
  createSignalStore({
    state: { content: '', cursor: 0 },
    methods: (s, set) => ({
      type: (text: string) => set({ content: s.content() + text }),
    }),
  }),
  { name: 'Editor', maxHistory: 100 }
);

editorStore.type('Hello');
editorStore.type(' World');
editorStore.undo();       // removes ' World'
editorStore.undo();       // removes 'Hello'
editorStore.canUndo();    // false
editorStore.redo();       // restores 'Hello'
```

---

## Custom Operators

You can write your own operators following the same pattern:

```typescript
import { signal, computed, type Signal } from '@angular/core';

// A custom operator that adds "selected item" tracking to an entity store
function withSelection<T extends { id: string }>(
  store: { entities: Signal<T[]>; getById: (id: string) => T | undefined }
) {
  const _selectedId = signal<string | null>(null);

  const selectedEntity = computed(() => {
    const id = _selectedId();
    return id ? store.getById(id) : null;
  });

  return Object.assign({}, store, {
    selectedId: _selectedId.asReadonly(),
    selectedEntity,
    select: (id: string) => _selectedId.set(id),
    deselect: () => _selectedId.set(null),
  });
}

// Usage
const store = withSelection(createEntityStore<User>());
store.select('user-42');
store.selectedEntity(); // User | null
```

---

## Tips

- **Order matters for readability** — put `withLoading` close to the entity store, `withDevTools` outermost
- **Each operator is independent** — `withLoading` and `withPagination` don't know about each other
- **No injection context needed** — all operators use `signal()` and `computed()`, which work anywhere
