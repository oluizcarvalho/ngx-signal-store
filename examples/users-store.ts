/**
 * Users Store Example
 *
 * Demonstrates: createEntityStore + withPagination + withLoading
 */
import { computed } from '@angular/core';
import {
  createEntityStore,
  withLoading,
  withPagination,
} from 'ngx-signal-store';

// --- Types ---

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

// --- Store ---

function createUsersStore() {
  // 1. Base entity store
  const base = createEntityStore<User>({
    idKey: 'id',
    sortBy: (a, b) => a.name.localeCompare(b.name),
  });

  // 2. Add loading + pagination
  const withLoadingStore = withLoading(base);
  const store = withPagination(withLoadingStore, { pageSize: 10 });

  // --- Custom computed signals ---

  const activeUsers = computed(
    () => store.entities().filter((u) => u.active),
  );
  const adminCount = computed(
    () => store.entities().filter((u) => u.role === 'admin').length,
  );

  /** Returns the entities for the current page. */
  const paginatedUsers = computed(() => {
    const all = store.entities();
    const start = (store.page() - 1) * store.pageSize();
    return all.slice(start, start + store.pageSize());
  });

  // --- Methods ---

  async function loadUsers(): Promise<void> {
    await store.withAsync(async () => {
      // Simulate API
      const users: User[] = Array.from({ length: 47 }, (_, i) => ({
        id: `user-${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: i === 0 ? 'admin' : i % 3 === 0 ? 'editor' : 'viewer',
        active: i % 5 !== 0,
      }));
      store.setAll(users);
      store.setTotalItems(users.length);
    });
  }

  function deactivateUser(id: string): void {
    store.updateOne(id, { active: false });
  }

  function changeRole(id: string, role: User['role']): void {
    store.updateOne(id, { role });
  }

  return {
    ...store,
    activeUsers,
    adminCount,
    paginatedUsers,
    loadUsers,
    deactivateUser,
    changeRole,
  };
}

// --- Usage ---

export const usersStore = createUsersStore();

// await usersStore.loadUsers();
// usersStore.paginatedUsers();  // first 10 users
// usersStore.nextPage();
// usersStore.paginatedUsers();  // next 10 users
// usersStore.totalPages();      // 5
