# Getting Started

## Installation

```bash
npm install ngx-signal-store
```

**Peer dependency:** `@angular/core >= 21.0.0`

---

## Your First Store

A store is created with a single function call. Every key in `state` becomes a `Signal`.

```typescript
import { createSignalStore } from 'ngx-signal-store';

const counterStore = createSignalStore({
  state: { count: 0 },
  methods: (s, set) => ({
    increment: () => set({ count: s.count() + 1 }),
    decrement: () => set({ count: s.count() - 1 }),
    reset:     () => set({ count: 0 }),
  }),
});

counterStore.count();     // Signal<number> → 0
counterStore.increment();
counterStore.count();     // 1
```

### Adding Computed Signals

Use Angular's native `computed()` to derive values:

```typescript
import { computed } from '@angular/core';
import { createSignalStore } from 'ngx-signal-store';

const cartStore = createSignalStore({
  state: {
    items: [] as { name: string; price: number; qty: number }[],
  },
  computed: (s) => ({
    total:     computed(() => s.items().reduce((sum, i) => sum + i.price * i.qty, 0)),
    itemCount: computed(() => s.items().reduce((sum, i) => sum + i.qty, 0)),
    isEmpty:   computed(() => s.items().length === 0),
  }),
  methods: (s, set) => ({
    addItem: (item: { name: string; price: number }) =>
      set({ items: [...s.items(), { ...item, qty: 1 }] }),
    clear: () => set({ items: [] }),
  }),
});

cartStore.isEmpty();   // true
cartStore.addItem({ name: 'Widget', price: 9.99 });
cartStore.total();     // 9.99
cartStore.itemCount(); // 1
```

---

## Using in an Angular Component

Stores are plain objects — inject or instantiate them as services:

```typescript
import { Injectable, Component, ChangeDetectionStrategy } from '@angular/core';
import { createSignalStore } from 'ngx-signal-store';

// As a service (global state)
@Injectable({ providedIn: 'root' })
export class CounterService {
  private store = createSignalStore({
    state: { count: 0 },
    methods: (s, set) => ({
      increment: () => set({ count: s.count() + 1 }),
    }),
  });

  readonly count   = this.store.count;
  readonly increment = this.store.increment;
}

// In a component
@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Count: {{ counter.count() }}</p>
    <button (click)="counter.increment()">+</button>
  `,
})
export class CounterComponent {
  counter = inject(CounterService);
}
```

---

## Built-in Store Methods

Every store created with `createSignalStore` comes with these built-in helpers:

| Method | Description |
|---|---|
| `set(partial)` | Batch-update one or more state properties |
| `update(fn)` | Functional update: `store.update(s => ({ count: s.count + 1 }))` |
| `snapshot()` | Returns current state as a plain object |
| `reset()` | Restores initial state |

```typescript
store.set({ name: 'Alice', age: 30 });
store.update(s => ({ age: s.age + 1 }));
store.snapshot(); // { name: 'Alice', age: 31 }
store.reset();    // { name: '', age: 0 } (initial values)
```

---

## Working with Collections

Use [`createEntityStore`](/api/create-entity-store) for list-based state:

```typescript
import { createEntityStore } from 'ngx-signal-store';

interface User { id: string; name: string; email: string }

const users = createEntityStore<User>({ idKey: 'id' });

users.addOne({ id: '1', name: 'Alice', email: 'alice@example.com' });
users.length();   // 1
users.getById('1'); // { id: '1', name: 'Alice', ... }

users.updateOne('1', { name: 'Alice Smith' });
users.removeOne('1');
users.isEmpty();  // true
```

---

## Next Steps

- [Composing Operators](/guide/composing) — layer loading, pagination, filtering and devtools
- [API Reference](/api/create-signal-store) — full API documentation
- [Examples](/examples/todo) — real-world store patterns
