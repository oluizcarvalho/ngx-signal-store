<p align="center">
  <img src="https://angular.dev/assets/images/press-kit/angular_icon_gradient.gif" width="80" alt="Angular Logo" />
</p>

<h1 align="center">ngx-signal-store</h1>

<p align="center">
  <b>Lightweight state management for Angular 21+ powered by native Signals</b>
</p>

<p align="center">
  <a href="#installation">Installation</a> &bull;
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#api-reference">API</a> &bull;
  <a href="#examples">Examples</a> &bull;
  <a href="#comparison-vs-ngrx">vs NgRx</a>
</p>

---

## Why ngx-signal-store?

Angular Signals are the future of reactivity in Angular. **ngx-signal-store** gives you a thin, type-safe layer on top of native signals to manage application state — **without the boilerplate**.

- **Zero boilerplate** — one function call creates a fully reactive store
- **100% Signals** — no RxJS dependency, no actions, no reducers
- **Type-safe** — full TypeScript inference out of the box
- **Composable** — mix and match operators: loading, pagination, filtering, devtools
- **Tiny** — under 3 KB gzipped, tree-shakeable

---

## Installation

```bash
npm install ngx-signal-store
```

> **Peer dependency:** `@angular/core` >= 21.0.0

---

## Quick Start

```typescript
import { computed } from '@angular/core';
import { createSignalStore } from 'ngx-signal-store';

const counter = createSignalStore({
  state: { count: 0 },
  computed: (s) => ({
    doubled: computed(() => s.count() * 2),
  }),
  methods: (s, set) => ({
    increment: () => set({ count: s.count() + 1 }),
    decrement: () => set({ count: s.count() - 1 }),
    reset: () => set({ count: 0 }),
  }),
});

counter.count();     // 0
counter.increment();
counter.doubled();   // 2
```

---

## API Reference

### `createSignalStore(config)`

Creates a reactive store where every state property becomes a `WritableSignal`.

```typescript
const store = createSignalStore({
  state: { name: '', age: 0 },
  computed: (s) => ({
    isAdult: computed(() => s.age() >= 18),
  }),
  methods: (s, set) => ({
    setName: (name: string) => set({ name }),
    birthday: () => set({ age: s.age() + 1 }),
  }),
});

// Built-in methods:
store.set({ name: 'Alice', age: 30 });  // Batch update
store.update(s => ({ age: s.age + 1 })); // Functional update
store.snapshot();                         // { name: 'Alice', age: 31 }
store.reset();                            // Back to initial state
```

---

### `createEntityStore(config?)`

Creates a store optimized for collections with built-in CRUD.

```typescript
import { createEntityStore } from 'ngx-signal-store';

interface User {
  id: string;
  name: string;
  email: string;
}

const users = createEntityStore<User>({
  idKey: 'id',              // default: 'id'
  sortBy: (a, b) => a.name.localeCompare(b.name),
});

// CRUD
users.addOne({ id: '1', name: 'Alice', email: 'alice@test.com' });
users.addMany([...]);
users.updateOne('1', { name: 'Alice Smith' });
users.updateMany([{ id: '1', changes: { email: 'new@test.com' } }]);
users.removeOne('1');
users.removeMany(['1', '2']);
users.setAll([...]);
users.clear();

// Computed
users.entities();  // Signal<User[]>
users.ids();       // Signal<string[]>
users.entityMap(); // Signal<Map<string, User>>
users.length();    // Signal<number>
users.isEmpty();   // Signal<boolean>
users.getById('1');
```

---

### `withLoading(store)`

Adds loading and error state management.

```typescript
import { createEntityStore, withLoading } from 'ngx-signal-store';

const store = withLoading(createEntityStore<User>());

store.loading(); // false
store.error();   // null

// Automatic loading/error handling
await store.withAsync(async () => {
  const data = await fetch('/api/users').then(r => r.json());
  store.setAll(data);
});

// Or manual
store.setLoading(true);
store.setError('Something went wrong');
```

---

### `withPagination(store, config?)`

Adds pagination state with navigation helpers.

```typescript
import { createEntityStore, withPagination } from 'ngx-signal-store';

const store = withPagination(createEntityStore<User>(), { pageSize: 20 });

store.setTotalItems(100);
store.totalPages();   // 5
store.page();         // 1
store.hasNextPage();  // true

store.nextPage();     // page → 2
store.prevPage();     // page → 1
store.setPage(3);     // page → 3
store.setPageSize(50); // resets to page 1
```

---

### `withFilter(store, filterFn)`

Adds text-based filtering to an entity store.

```typescript
import { createEntityStore, withFilter } from 'ngx-signal-store';

const store = withFilter(
  createEntityStore<Todo>(),
  (todo, query) => todo.title.toLowerCase().includes(query.toLowerCase()),
);

store.setFilter('groceries');
store.filteredEntities(); // only matching todos
store.filter();           // 'groceries'
```

---

### `derivedFrom(signals, computation)`

Combine multiple signals into a single computed signal.

```typescript
import { signal } from '@angular/core';
import { derivedFrom } from 'ngx-signal-store';

const price = signal(100);
const quantity = signal(3);
const taxRate = signal(0.08);

const total = derivedFrom(
  [price, quantity, taxRate],
  (p, q, t) => p * q * (1 + t),
);

total(); // 324
```

---

### `debounced(source, delayMs)`

Creates a debounced version of a signal.

```typescript
import { signal } from '@angular/core';
import { debounced } from 'ngx-signal-store';

const searchInput = signal('');
const debouncedSearch = debounced(searchInput, 300);

searchInput.set('hello');
// After 300ms: debouncedSearch.value() === 'hello'

// Clean up when done
debouncedSearch.destroy();
```

---

### `withDevTools(store, options?)`

Adds time-travel debugging with undo/redo to any store.

```typescript
import { createSignalStore, withDevTools } from 'ngx-signal-store';

const store = withDevTools(
  createSignalStore({ state: { text: '' } }),
  { name: 'Editor', maxHistory: 100 },
);

store.set({ text: 'Hello' });
store.set({ text: 'Hello World' });

store.canUndo();      // true
store.undo();
store.snapshot();     // { text: 'Hello' }

store.canRedo();      // true
store.redo();
store.snapshot();     // { text: 'Hello World' }

store.history();      // all snapshots
store.historyIndex(); // current position
store.jumpTo(0);      // jump to initial state
```

---

## Examples

### Todo App

Full CRUD with filtering, loading states, and undo/redo:

```typescript
const todoStore = createTodoStore();

todoStore.addTodo('Buy groceries');
todoStore.toggleTodo(1);
todoStore.setFilter('buy');
todoStore.filteredEntities(); // filtered results
todoStore.undo();             // undo the toggle
todoStore.progress();         // completion percentage
```

See [`examples/todo-store.ts`](./examples/todo-store.ts)

### Users with Pagination

Paginated entity store with role management:

```typescript
const usersStore = createUsersStore();

await usersStore.loadUsers();
usersStore.paginatedUsers(); // first page
usersStore.nextPage();
usersStore.totalPages();     // calculated from total
```

See [`examples/users-store.ts`](./examples/users-store.ts)

### Shopping Cart

Computed totals, coupons, tax calculations:

```typescript
const cart = createShoppingCartStore();

cart.addItem({ productId: 'p1', name: 'Widget', price: 29.99 });
cart.applyCoupon('SAVE10');
cart.total();    // with discount + tax
await cart.checkout();
```

See [`examples/shopping-cart-store.ts`](./examples/shopping-cart-store.ts)

---

## Comparison vs NgRx

| Feature | **ngx-signal-store** | **@ngrx/store** | **@ngrx/signals** |
|---|---|---|---|
| **Bundle size** | ~3 KB | ~15 KB+ | ~8 KB |
| **Boilerplate** | Minimal (1 function) | Heavy (actions, reducers, selectors, effects) | Moderate (withState, withMethods, ...) |
| **Learning curve** | Low | High | Medium |
| **Signals-first** | Yes (100%) | No (Observable-based) | Yes |
| **RxJS required** | No | Yes | Optional |
| **Entity CRUD** | Built-in | @ngrx/entity addon | @ngrx/signals/entities addon |
| **DevTools** | Built-in (undo/redo) | Redux DevTools | Community plugins |
| **Type inference** | Full automatic | Manual selectors | Good |
| **Setup required** | None | StoreModule.forRoot() | None |

### Code Comparison

**Counter store in ngx-signal-store:**

```typescript
const counter = createSignalStore({
  state: { count: 0 },
  methods: (s, set) => ({
    increment: () => set({ count: s.count() + 1 }),
  }),
});
```

**Counter store in @ngrx/store (traditional):**

```typescript
// actions.ts
export const increment = createAction('[Counter] Increment');

// reducer.ts
const initialState = { count: 0 };
export const counterReducer = createReducer(
  initialState,
  on(increment, (state) => ({ ...state, count: state.count + 1 })),
);

// selectors.ts
export const selectCount = (state: AppState) => state.counter.count;

// component.ts
store.dispatch(increment());
store.select(selectCount);
```

**That's 4 files vs 1 function call.**

---

## Composability

Operators are plain functions — compose them freely:

```typescript
import {
  createEntityStore,
  withLoading,
  withPagination,
  withFilter,
  withDevTools,
} from 'ngx-signal-store';

const store = withDevTools(
  withFilter(
    withPagination(
      withLoading(
        createEntityStore<Product>()
      ),
      { pageSize: 25 },
    ),
    (p, q) => p.name.includes(q),
  ),
  { name: 'Products' },
);

// store now has: CRUD + loading + pagination + filtering + undo/redo
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

```bash
# Clone
git clone https://github.com/oluizcarvalho/ngx-signal-store.git
cd ngx-signal-store

# Install
npm install

# Test
npm test

# Type check
npm run typecheck
```

---

## License

MIT &copy; [Luiz Carvalho](https://github.com/oluizcarvalho)
