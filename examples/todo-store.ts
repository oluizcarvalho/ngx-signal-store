/**
 * Todo Store Example
 *
 * Demonstrates: createEntityStore + withLoading + withFilter + withDevTools
 */
import { computed } from '@angular/core';
import {
  createEntityStore,
  withLoading,
  withFilter,
  withDevTools,
} from 'ngx-signal-store';

// --- Types ---

interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: Date;
}

// --- Store ---

function createTodoStore() {
  // 1. Base entity store
  const base = createEntityStore<Todo>({
    idKey: 'id',
    sortBy: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  });

  // 2. Add loading state
  const withLoadingStore = withLoading(base);

  // 3. Add filtering
  const withFilterStore = withFilter(
    withLoadingStore,
    (todo, query) => todo.title.toLowerCase().includes(query.toLowerCase()),
  );

  // 4. Add undo/redo
  const store = withDevTools(withFilterStore, {
    name: 'TodoStore',
    maxHistory: 30,
  });

  // --- Custom computed signals ---

  const completedCount = computed(
    () => store.entities().filter((t) => t.done).length,
  );
  const pendingCount = computed(
    () => store.entities().filter((t) => !t.done).length,
  );
  const progress = computed(() => {
    const total = store.length();
    return total === 0 ? 0 : Math.round((completedCount() / total) * 100);
  });

  // --- Custom methods ---

  let nextId = 1;

  function addTodo(title: string): void {
    store.addOne({
      id: nextId++,
      title,
      done: false,
      createdAt: new Date(),
    });
  }

  function toggleTodo(id: number): void {
    const todo = store.getById(id);
    if (todo) {
      store.updateOne(id, { done: !todo.done });
    }
  }

  function clearCompleted(): void {
    const completedIds = store
      .entities()
      .filter((t) => t.done)
      .map((t) => t.id);
    store.removeMany(completedIds);
  }

  async function loadFromApi(): Promise<void> {
    await store.withAsync(async () => {
      // Simulate API call
      const response: Todo[] = [
        { id: 100, title: 'Learn Angular Signals', done: false, createdAt: new Date() },
        { id: 101, title: 'Build a store library', done: true, createdAt: new Date() },
        { id: 102, title: 'Write tests', done: false, createdAt: new Date() },
      ];
      nextId = 103;
      store.setAll(response);
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

// --- Usage ---

export const todoStore = createTodoStore();

// todoStore.addTodo('Buy groceries');
// todoStore.toggleTodo(1);
// todoStore.setFilter('buy');
// todoStore.filteredEntities();
// todoStore.undo();
// todoStore.progress();
