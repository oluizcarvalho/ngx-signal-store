# derivedFrom

Creates a computed signal derived from multiple source signals, passing their values as individual arguments to a computation function.

## Signature

```typescript
function derivedFrom<T extends readonly Signal<any>[], R>(
  signals: [...T],
  computation: (...values: UnwrappedValues<T>) => R
): Signal<R>
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `signals` | `Signal<any>[]` | Array of source signals |
| `computation` | `(...values) => R` | Function receiving the unwrapped values, returns the derived value |

## Examples

### Two signals

```typescript
import { signal } from '@angular/core';
import { derivedFrom } from 'ngx-signal-store';

const price = signal(100);
const quantity = signal(3);

const subtotal = derivedFrom([price, quantity], (p, q) => p * q);
subtotal(); // 300

price.set(150);
subtotal(); // 450
```

### Three signals

```typescript
const price    = signal(100);
const quantity = signal(3);
const taxRate  = signal(0.08);

const total = derivedFrom(
  [price, quantity, taxRate],
  (p, q, t) => p * q * (1 + t)
);

total(); // 324
```

### Mixed types

```typescript
const name    = signal('World');
const excited = signal(true);

const greeting = derivedFrom(
  [name, excited],
  (n, e) => e ? `Hello, ${n}!` : `Hello, ${n}.`
);

greeting();         // 'Hello, World!'
excited.set(false);
greeting();         // 'Hello, World.'
```

### In a store

```typescript
import { signal } from '@angular/core';
import { createSignalStore, withLoading, derivedFrom } from 'ngx-signal-store';

const store = withLoading(createSignalStore({
  state: {
    subtotal: 0,
    couponDiscount: 0,
  },
}));

const taxRate = signal(0.08);

const discountAmount = derivedFrom(
  [store.subtotal, store.couponDiscount],
  (sub, disc) => sub * disc
);

const tax = derivedFrom(
  [store.subtotal, discountAmount, taxRate],
  (sub, disc, rate) => (sub - disc) * rate
);

const total = derivedFrom(
  [store.subtotal, discountAmount, tax],
  (sub, disc, t) => sub - disc + t
);
```

## vs. `computed()`

`derivedFrom` is a thin wrapper around Angular's `computed()`. These two are equivalent:

```typescript
// With computed()
const total = computed(() => price() * quantity());

// With derivedFrom
const total = derivedFrom([price, quantity], (p, q) => p * q);
```

`derivedFrom` is more ergonomic when combining 3+ signals since the computation function receives positionally typed arguments instead of requiring you to call each signal inside the `computed` body.

## Notes

- The returned signal is read-only (same as `computed()`).
- All source signals are tracked as dependencies — if any changes, the computation re-runs.
- The computation function is called lazily (on first read) and memoized until a dependency changes.
