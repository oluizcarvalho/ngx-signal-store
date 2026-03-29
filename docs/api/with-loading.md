# withLoading

Adds loading and error state management to any store.

## Signature

```typescript
function withLoading<T>(store: T): T & LoadingState
```

## Return Value (additional properties)

| Property | Type | Description |
|---|---|---|
| `loading` | `Signal<boolean>` | `true` while an async operation is in progress |
| `error` | `Signal<string \| null>` | Error message from the last failed operation, or `null` |
| `setLoading(value)` | `(boolean) => void` | Manually set loading state |
| `setError(error)` | `(string \| null) => void` | Manually set error state |
| `withAsync(fn)` | `<R>(() => Promise<R>) => Promise<R>` | Wraps an async function with automatic loading/error management |

## Examples

### Automatic loading/error management

```typescript
import { createEntityStore, withLoading } from 'ngx-signal-store';

const store = withLoading(createEntityStore<User>());

store.loading(); // false
store.error();   // null

// withAsync automatically:
//   1. sets loading = true
//   2. clears any previous error
//   3. runs your async function
//   4. sets loading = false (success or error)
//   5. sets error = message (if rejected)

await store.withAsync(async () => {
  const users = await fetch('/api/users').then(r => r.json());
  store.setAll(users);
});

store.loading(); // false
store.error();   // null
```

### Error handling

```typescript
try {
  await store.withAsync(async () => {
    throw new Error('Network timeout');
  });
} catch {
  // withAsync re-throws so you can handle it here too
}

store.loading(); // false
store.error();   // 'Network timeout'

// Subsequent successful calls clear the error automatically
await store.withAsync(async () => { /* ... */ });
store.error(); // null
```

### Manual control

```typescript
// If you need fine-grained control:
store.setLoading(true);
try {
  const data = await someOperation();
  store.setAll(data);
} finally {
  store.setLoading(false);
}
```

### In an Angular component

```typescript
@Component({
  template: `
    @if (store.loading()) {
      <app-spinner />
    } @else if (store.error()) {
      <p class="error">{{ store.error() }}</p>
    } @else {
      @for (item of store.entities(); track item.id) {
        <app-item [data]="item" />
      }
    }
  `,
})
export class ItemListComponent {
  store = inject(ItemService);

  ngOnInit() {
    this.store.loadItems();
  }
}
```

## Notes

- `withAsync` clears the previous `error` at the start of each call.
- The wrapped function's return value is forwarded — `withAsync` is fully typed.
- Any store object (not just entity stores) can be passed to `withLoading`.
