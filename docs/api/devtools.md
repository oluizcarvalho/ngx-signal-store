# withDevTools

Adds time-travel debugging to any store — undo, redo, and jump to any point in history.

## Signature

```typescript
function withDevTools<T>(
  store: T & { snapshot: () => any; set: (...args: any[]) => void },
  options?: DevToolsOptions
): T & DevToolsState
```

## Options

| Property | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Label for this store (for logging/debugging) |
| `maxHistory` | `number` | `50` | Maximum number of history entries to keep |

## Return Value (additional properties)

| Property | Type | Description |
|---|---|---|
| `canUndo` | `Signal<boolean>` | `true` when undo is available |
| `canRedo` | `Signal<boolean>` | `true` when redo is available |
| `history` | `Signal<any[]>` | Array of all recorded state snapshots |
| `historyIndex` | `Signal<number>` | Current position in the history array |
| `undo()` | `() => void` | Restore the previous state |
| `redo()` | `() => void` | Re-apply the next state |
| `jumpTo(index)` | `(number) => void` | Jump to a specific history entry |
| `record()` | `() => void` | Manually record the current state as a history entry |

## Examples

### Basic undo/redo

```typescript
import { createSignalStore, withDevTools } from 'ngx-signal-store';

const store = withDevTools(
  createSignalStore({ state: { text: '' } }),
  { name: 'Editor', maxHistory: 100 }
);

store.set({ text: 'Hello' });
store.set({ text: 'Hello World' });

store.historyIndex(); // 2
store.canUndo();      // true

store.undo();
store.text();         // 'Hello'

store.undo();
store.text();         // ''
store.canUndo();      // false

store.redo();
store.text();         // 'Hello'
```

### Discarding redo history

When you undo and then make a new change, the "redo" entries are discarded:

```typescript
store.set({ text: 'A' });
store.set({ text: 'B' });
store.set({ text: 'C' });

store.undo();          // back to 'B'
store.undo();          // back to 'A'

store.set({ text: 'X' });
store.canRedo();       // false — future was discarded
store.history().length // 3: ['', 'A', 'X']
```

### Jump to a specific point

```typescript
store.set({ count: 10 });
store.set({ count: 20 });
store.set({ count: 30 });
// history: [0, 10, 20, 30], index: 3

store.jumpTo(1);
store.count(); // 10
```

### With entity store

`withDevTools` works with any store that has `snapshot()` and `set()`:

```typescript
import { createEntityStore, withDevTools } from 'ngx-signal-store';

const store = withDevTools(
  createEntityStore<Todo>(),
  { name: 'TodoStore' }
);

store.addOne({ id: 1, title: 'First todo', done: false });
store.addOne({ id: 2, title: 'Second todo', done: false });

store.undo();
store.entities().length; // 1 (second todo removed)
```

### In a component

```typescript
@Component({
  template: `
    <button [disabled]="!store.canUndo()" (click)="store.undo()">Undo</button>
    <button [disabled]="!store.canRedo()" (click)="store.redo()">Redo</button>
    <span>Step {{ store.historyIndex() + 1 }} of {{ store.history().length }}</span>
  `,
})
export class EditorComponent {
  store = inject(EditorService);
}
```

## How It Works

`withDevTools` wraps the store's `set()` method. Every call to `set()` automatically records a snapshot of the state after the update. Undo/redo navigate this history and restore state using the original (unwrapped) `set()` to avoid creating new history entries.

## Notes

- The initial state is always recorded as the first history entry (index 0).
- When `maxHistory` is exceeded, the oldest entries are dropped from the front.
- `undo()`/`redo()` are no-ops when `canUndo`/`canRedo` is `false`.
- For entity stores, `set()` refers to `setAll()` — only `setAll` calls are tracked. Individual `addOne`, `updateOne`, etc. are **not** automatically tracked. To track them, call `store.record()` manually after each mutation, or wrap them with `set()`.
