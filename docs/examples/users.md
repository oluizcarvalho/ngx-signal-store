# User Management

A paginated user list with role management, demonstrating `createEntityStore`, `withLoading`, and `withPagination`.

## What We'll Build

- Load users from a paginated API
- Navigate between pages
- Update user roles and active status
- Computed stats (active count, admin count)

## Store Implementation

```typescript
import { computed } from '@angular/core';
import {
  createEntityStore,
  withLoading,
  withPagination,
} from 'ngx-signal-store';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

function createUsersStore() {
  // Base entity store — alphabetically sorted
  const base = createEntityStore<User>({
    idKey: 'id',
    sortBy: (a, b) => a.name.localeCompare(b.name),
  });

  // Add loading + pagination
  const store = withPagination(withLoading(base), { pageSize: 10 });

  // Custom computed signals
  const activeUsers  = computed(() => store.entities().filter(u => u.active));
  const adminCount   = computed(() => store.entities().filter(u => u.role === 'admin').length);
  const paginatedUsers = computed(() => {
    const all = store.entities();
    const start = (store.page() - 1) * store.pageSize();
    return all.slice(start, start + store.pageSize());
  });

  // Methods
  async function loadUsers() {
    await store.withAsync(async () => {
      const res = await fetch(
        `/api/users?page=${store.page()}&size=${store.pageSize()}`
      );
      const { data, total } = await res.json();
      store.setAll(data);
      store.setTotalItems(total);
    });
  }

  function deactivateUser(id: string) {
    store.updateOne(id, { active: false });
  }

  function changeRole(id: string, role: User['role']) {
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

export const usersStore = createUsersStore();
```

## Using in a Component

```typescript
@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Stats -->
    <div class="stats">
      <span>Total: {{ usersStore.length() }}</span>
      <span>Active: {{ usersStore.activeUsers().length }}</span>
      <span>Admins: {{ usersStore.adminCount() }}</span>
    </div>

    <!-- Loading -->
    @if (usersStore.loading()) {
      <app-skeleton-list />
    } @else {

      <!-- User table -->
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (user of usersStore.paginatedUsers(); track user.id) {
            <tr [class.inactive]="!user.active">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select
                  [value]="user.role"
                  (change)="usersStore.changeRole(user.id, $any($event.target).value)"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </td>
              <td>{{ user.active ? 'Active' : 'Inactive' }}</td>
              <td>
                @if (user.active) {
                  <button (click)="usersStore.deactivateUser(user.id)">Deactivate</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>

      <!-- Pagination -->
      <nav>
        <button
          [disabled]="!usersStore.hasPrevPage()"
          (click)="changePage(-1)"
        >Previous</button>

        <span>Page {{ usersStore.page() }} of {{ usersStore.totalPages() }}</span>

        <button
          [disabled]="!usersStore.hasNextPage()"
          (click)="changePage(1)"
        >Next</button>
      </nav>
    }
  `,
})
export class UsersComponent implements OnInit {
  usersStore = inject(UsersService);

  ngOnInit() {
    this.usersStore.loadUsers();
  }

  async changePage(delta: number) {
    this.usersStore.setPage(this.usersStore.page() + delta);
    await this.usersStore.loadUsers();
  }
}
```

## Key Patterns

| Feature | How |
|---|---|
| Server-side pagination | `withPagination` + `setTotalItems` from API response |
| Alphabetical sort | `sortBy` in entity store config |
| Current page slice | `computed()` on `entities()` |
| Inline role update | `updateOne()` |
| Loading skeleton | `store.loading()` signal |
