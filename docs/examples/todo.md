# Todo App

A full-featured todo list demonstrating `createEntityStore`, `withLoading`, `withFilter`, and `withDevTools` together.

## What We'll Build

- Add, toggle, and remove todos
- Filter todos by text
- Load todos from a (simulated) API with loading/error states
- Undo/redo any action

## Store Implementation

```typescript
import { computed } from '@angular/core';
import {
  createEntityStore,
  withLoading,
  withFilter,
  withDevTools,
} from 'ngx-signal-store';

interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: Date;
}

function createTodoStore() {
  // 1. Base entity store — newest first
  const base = createEntityStore<Todo>({
    idKey: 'id',
    sortBy: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  });

  // 2. Loading + error states
  const withLoadingStore = withLoading(base);

  // 3. Text filtering
  const withFilterStore = withFilter(
    withLoadingStore,
    (todo, query) => todo.title.toLowerCase().includes(query.toLowerCase()),
  );

  // 4. Time-travel devtools
  const store = withDevTools(withFilterStore, {
    name: 'TodoStore',
    maxHistory: 30,
  });

  // Extra computed signals
  const completedCount = computed(() => store.entities().filter(t => t.done).length);
  const pendingCount   = computed(() => store.entities().filter(t => !t.done).length);
  const progress       = computed(() => {
    const total = store.length();
    return total === 0 ? 0 : Math.round((completedCount() / total) * 100);
  });

  // Auto-increment ID
  let nextId = 1;

  function addTodo(title: string) {
    store.addOne({ id: nextId++, title, done: false, createdAt: new Date() });
  }

  function toggleTodo(id: number) {
    const todo = store.getById(id);
    if (todo) store.updateOne(id, { done: !todo.done });
  }

  function clearCompleted() {
    const ids = store.entities().filter(t => t.done).map(t => t.id);
    store.removeMany(ids);
  }

  async function loadFromApi() {
    await store.withAsync(async () => {
      // Simulate API
      await new Promise(r => setTimeout(r, 800));
      store.setAll([
        { id: 100, title: 'Learn Angular Signals', done: false, createdAt: new Date() },
        { id: 101, title: 'Build a signal store', done: true,  createdAt: new Date() },
        { id: 102, title: 'Write tests',           done: false, createdAt: new Date() },
      ]);
      nextId = 103;
    });
  }

  return {
    ...store,
    completedCount,
    pendingCount,
    progress,
    addTodo,
    toggleTodo,
    clearCompleted,
    loadFromApi,
  };
}

export const todoStore = createTodoStore();
```

## Using in a Component

```typescript
@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <header>
      <h1>Todos</h1>
      <p>{{ todoStore.progress() }}% complete</p>
    </header>

    <!-- Loading state -->
    @if (todoStore.loading()) {
      <p>Loading...</p>
    } @else if (todoStore.error()) {
      <p class="error">{{ todoStore.error() }}</p>
    }

    <!-- Add todo -->
    <form (submit)="addTodo($event)">
      <input #input placeholder="What needs to be done?" />
      <button type="submit">Add</button>
    </form>

    <!-- Filter -->
    <input
      [value]="todoStore.filter()"
      (input)="todoStore.setFilter($any($event.target).value)"
      placeholder="Search todos..."
    />

    <!-- Todo list -->
    @for (todo of todoStore.filteredEntities(); track todo.id) {
      <div [class.done]="todo.done">
        <input type="checkbox"
          [checked]="todo.done"
          (change)="todoStore.toggleTodo(todo.id)"
        />
        <span>{{ todo.title }}</span>
        <button (click)="todoStore.removeOne(todo.id)">✕</button>
      </div>
    }

    <!-- Footer -->
    <footer>
      <span>{{ todoStore.pendingCount() }} items left</span>
      <button (click)="todoStore.clearCompleted()">Clear completed</button>
    </footer>

    <!-- DevTools -->
    <div class="devtools">
      <button [disabled]="!todoStore.canUndo()" (click)="todoStore.undo()">Undo</button>
      <button [disabled]="!todoStore.canRedo()" (click)="todoStore.redo()">Redo</button>
    </div>
  `,
})
export class TodoComponent {
  todoStore = inject(TodoStoreService);

  addTodo(event: SubmitEvent) {
    event.preventDefault();
    const input = (event.target as HTMLFormElement).querySelector('input')!;
    const title = input.value.trim();
    if (title) {
      this.todoStore.addTodo(title);
      input.value = '';
    }
  }
}
```

## Key Patterns

| Feature | How |
|---|---|
| Sorted newest-first | `sortBy` in `createEntityStore` |
| Loading state | `withLoading` + `withAsync` |
| Search | `withFilter` with custom `filterFn` |
| Undo/redo | `withDevTools` |
| Derived stats | `computed()` on `store.entities()` |
