# ngx-signal-store vs NgRx

A practical comparison to help you choose the right tool.

## Feature Comparison

| | **ngx-signal-store** | **@ngrx/signals** | **@ngrx/store** |
|---|---|---|---|
| **Bundle size** | ~3 KB | ~8 KB | ~15 KB+ |
| **RxJS required** | No | Optional | Yes |
| **Boilerplate** | Minimal | Moderate | Heavy |
| **Learning curve** | Low | Medium | High |
| **Signals-first** | Yes (100%) | Yes | No (adapter) |
| **Setup** | None | None | `StoreModule.forRoot()` |
| **Entity CRUD** | Built-in | Via `/entities` addon | Via `@ngrx/entity` |
| **DevTools** | Built-in (undo/redo) | Redux DevTools | Redux DevTools |
| **Type inference** | Full automatic | Good | Manual selectors |
| **Action/Reducer pattern** | No | No | Yes |

---

## Code Comparison

The same counter store implemented in each library:

### ngx-signal-store

```typescript
import { createSignalStore } from 'ngx-signal-store';

const counterStore = createSignalStore({
  state: { count: 0 },
  methods: (s, set) => ({
    increment: () => set({ count: s.count() + 1 }),
    decrement: () => set({ count: s.count() - 1 }),
  }),
});

counterStore.count();     // 0
counterStore.increment();
counterStore.count();     // 1
```

**1 file, ~10 lines.**

---

### @ngrx/signals

```typescript
// counter.store.ts
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

export const CounterStore = signalStore(
  withState({ count: 0 }),
  withMethods((store) => ({
    increment: () => patchState(store, s => ({ count: s.count + 1 })),
    decrement: () => patchState(store, s => ({ count: s.count - 1 })),
  }))
);
```

```typescript
// component.ts
@Component({
  providers: [CounterStore],
  template: `{{ store.count() }}`,
})
export class CounterComponent {
  store = inject(CounterStore);
}
```

**2 files, requires DI registration.**

---

### @ngrx/store (traditional)

```typescript
// counter.actions.ts
export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');

// counter.reducer.ts
const initialState = { count: 0 };
export const counterReducer = createReducer(
  initialState,
  on(increment, state => ({ count: state.count + 1 })),
  on(decrement, state => ({ count: state.count - 1 })),
);

// counter.selectors.ts
export const selectCount = createSelector(
  (state: AppState) => state.counter,
  counter => counter.count
);

// app.module.ts
StoreModule.forRoot({ counter: counterReducer })

// component.ts
@Component({ template: `{{ count$ | async }}` })
export class CounterComponent {
  count$ = this.store.select(selectCount);
  constructor(private store: Store) {}
  increment() { this.store.dispatch(increment()); }
}
```

**4 files, ~50 lines, module registration required.**

---

## When to Choose Each

### Choose **ngx-signal-store** when:
- You want minimal boilerplate and fast iteration
- Your team is new to Angular or state management
- You're building a small to medium app or a library
- You want zero RxJS dependency in your state layer
- You want built-in undo/redo without extra setup

### Choose **@ngrx/signals** when:
- You're already invested in the NgRx ecosystem
- You need the Redux DevTools browser extension for debugging
- Your team is comfortable with NgRx patterns and DI-centric stores
- You need `rxMethod()` for complex async flows with RxJS operators

### Choose **@ngrx/store** when:
- You're maintaining a large existing codebase already using NgRx
- You have strict requirements for the Flux pattern (actions, reducers, effects)
- You need Redux DevTools time-travel (browser extension)
- Multiple teams coordinate on state via decoupled actions/effects

---

## Migration Path

If you're currently using `@ngrx/store` and want to try ngx-signal-store, you can migrate incrementally — one feature store at a time. The two libraries don't conflict with each other and can coexist in the same Angular application.

```typescript
// Before (NgRx)
this.store.select(selectUsers)
this.store.dispatch(loadUsers())

// After (ngx-signal-store)
userStore.entities()
userStore.loadUsers()
```
