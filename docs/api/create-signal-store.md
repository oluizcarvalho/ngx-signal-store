# createSignalStore

Creates a reactive store where every state property is a `WritableSignal`, with optional computed signals and methods.

## Signature

```typescript
function createSignalStore<TState, TComputed, TMethods>(
  config: SignalStoreConfig<TState, TComputed, TMethods>
): SignalStoreInstance<TState, TComputed, TMethods>
```

## Config

| Property | Type | Required | Description |
|---|---|---|---|
| `state` | `TState` | ✅ | Initial state object. Each key becomes a `WritableSignal`. |
| `computed` | `(state) => TComputed` | — | Factory that receives signal state and returns computed signals. |
| `methods` | `(state, set) => TMethods` | — | Factory that receives signal state + `set()` and returns methods. |

## Return Value

The returned object contains:

| Property | Type | Description |
|---|---|---|
| `[key]` | `Signal<T>` | One read-only signal per state key |
| `[computed key]` | `Signal<T>` | One signal per computed property |
| `[method]` | `fn` | Each method defined in the `methods` factory |
| `set(partial)` | `(Partial<TState>) => void` | Batch-update one or more state properties |
| `update(fn)` | `((TState) => Partial<TState>) => void` | Functional update |
| `snapshot()` | `() => TState` | Current state as a plain object |
| `reset()` | `() => void` | Restore initial state |

## Examples

### Basic state

```typescript
const store = createSignalStore({
  state: { count: 0, name: '' },
});

store.count(); // 0
store.name();  // ''

store.set({ count: 5 });
store.count(); // 5
```

### With computed

```typescript
import { computed } from '@angular/core';

const store = createSignalStore({
  state: { price: 100, quantity: 2 },
  computed: (s) => ({
    total: computed(() => s.price() * s.quantity()),
  }),
});

store.total(); // 200
store.set({ quantity: 3 });
store.total(); // 300
```

### With methods

```typescript
const store = createSignalStore({
  state: { count: 0 },
  methods: (s, set) => ({
    increment:   () => set({ count: s.count() + 1 }),
    decrement:   () => set({ count: s.count() - 1 }),
    incrementBy: (n: number) => set({ count: s.count() + n }),
    reset:       () => set({ count: 0 }),
  }),
});

store.increment();
store.incrementBy(5);
store.count(); // 6
```

### Functional update

```typescript
const store = createSignalStore({
  state: { items: [] as string[] },
});

store.update(s => ({ items: [...s.items, 'new item'] }));
store.snapshot(); // { items: ['new item'] }
```

### As an Angular service

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private store = createSignalStore({
    state: { dark: false, fontSize: 14 },
    methods: (s, set) => ({
      toggleDark: () => set({ dark: !s.dark() }),
      setFontSize: (size: number) => set({ fontSize: size }),
    }),
  });

  readonly dark     = this.store.dark;
  readonly fontSize = this.store.fontSize;
  readonly toggleDark  = this.store.toggleDark;
  readonly setFontSize = this.store.setFontSize;
}
```

## Notes

- Each state key is stored as an independent `WritableSignal`, so `computed()` signals only re-evaluate when their specific dependencies change.
- The `set()` function accepts a `Partial<TState>`, so you only need to specify the keys you want to change.
- `reset()` always restores to the **initial values** passed at creation time.
