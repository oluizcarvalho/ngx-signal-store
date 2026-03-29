# debounced

Creates a debounced version of a signal that only updates after a specified delay of inactivity.

## Signature

```typescript
function debounced<T>(source: Signal<T>, delayMs: number): DebouncedSignal<T>
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `source` | `Signal<T>` | The source signal to debounce |
| `delayMs` | `number` | Delay in milliseconds |

## Return Value

```typescript
interface DebouncedSignal<T> {
  value: Signal<T>;    // The debounced read-only signal
  destroy: () => void; // Stop internal polling — call when done
}
```

## Examples

### Search input debouncing

```typescript
import { signal } from '@angular/core';
import { debounced } from 'ngx-signal-store';

const searchInput = signal('');
const debouncedSearch = debounced(searchInput, 300);

// User types rapidly:
searchInput.set('a');
searchInput.set('an');
searchInput.set('ang');
searchInput.set('angu');
searchInput.set('angul');

// debouncedSearch.value() is still '' immediately
// After 300ms of no changes:
// debouncedSearch.value() === 'angul'

// When done (e.g., component destroyed):
debouncedSearch.destroy();
```

### In an Angular component

```typescript
import { Component, OnDestroy, signal } from '@angular/core';
import { debounced } from 'ngx-signal-store';

@Component({
  template: `
    <input
      [value]="searchRaw()"
      (input)="searchRaw.set($event.target.value)"
    />
    <!-- Uses the debounced value for the actual API call -->
    <p>Searching for: {{ debouncedSearch.value() }}</p>
  `,
})
export class SearchComponent implements OnDestroy {
  readonly searchRaw = signal('');
  readonly debouncedSearch = debounced(this.searchRaw, 400);

  // Trigger API call when debounced value changes
  // (use effect() or link this to your store)

  ngOnDestroy() {
    this.debouncedSearch.destroy();
  }
}
```

### With a store method

```typescript
import { signal, effect } from '@angular/core';
import { createEntityStore, withLoading, debounced } from 'ngx-signal-store';

@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly query = signal('');
  readonly debouncedQuery = debounced(this.query, 300);
  readonly store = withLoading(createEntityStore<Result>());

  constructor() {
    // Use effect() inside injection context to react to debounced value
    effect(() => {
      const q = this.debouncedQuery.value();
      if (q) this.search(q);
    });
  }

  async search(query: string) {
    await this.store.withAsync(async () => {
      const results = await fetch(`/api/search?q=${query}`).then(r => r.json());
      this.store.setAll(results);
    });
  }

  ngOnDestroy() {
    this.debouncedQuery.destroy();
  }
}
```

## How It Works

Since `effect()` requires an Angular injection context, `debounced` uses a polling approach: it checks the source signal every ~16ms (≈60fps) and schedules a `setTimeout` whenever the value changes. This makes it safe to use outside injection contexts (standalone, in tests, etc.).

## Notes

- Call `destroy()` when the debounced signal is no longer needed to stop the internal interval.
- In tests, use `vi.useFakeTimers()` to control timing.
- The initial value of `debouncedSignal.value()` matches the source signal at creation time.
- For use inside Angular services/components, you may prefer triggering API calls from `effect()` that reads `debouncedSignal.value()` within the injection context.
