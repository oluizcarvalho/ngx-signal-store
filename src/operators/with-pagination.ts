import { signal, computed, type Signal, type WritableSignal } from '@angular/core';
import type { PaginationConfig } from '../types';

export interface PaginationState {
  page: Signal<number>;
  pageSize: Signal<number>;
  totalItems: Signal<number>;
  totalPages: Signal<number>;
  hasNextPage: Signal<boolean>;
  hasPrevPage: Signal<boolean>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

/**
 * Adds pagination state and navigation to any store.
 *
 * @example
 * ```ts
 * const store = withPagination(createEntityStore<User>(), { pageSize: 20 });
 *
 * store.setTotalItems(100);
 * store.totalPages(); // 5
 * store.nextPage();
 * store.page();       // 2
 * ```
 */
export function withPagination<T extends Record<string, any>>(
  store: T,
  config: PaginationConfig = {},
): T & PaginationState {
  const _page: WritableSignal<number> = signal(1);
  const _pageSize: WritableSignal<number> = signal(config.pageSize ?? 10);
  const _totalItems: WritableSignal<number> = signal(0);

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(_totalItems() / _pageSize())),
  );

  const hasNextPage = computed(() => _page() < totalPages());
  const hasPrevPage = computed(() => _page() > 1);

  const setPage = (page: number): void => {
    _page.set(Math.max(1, page));
  };

  const setPageSize = (size: number): void => {
    _pageSize.set(Math.max(1, size));
    _page.set(1); // Reset to first page on page-size change
  };

  const setTotalItems = (total: number): void => {
    _totalItems.set(Math.max(0, total));
  };

  const nextPage = (): void => {
    if (hasNextPage()) {
      _page.update((p) => p + 1);
    }
  };

  const prevPage = (): void => {
    if (hasPrevPage()) {
      _page.update((p) => p - 1);
    }
  };

  return Object.assign({}, store, {
    page: _page.asReadonly(),
    pageSize: _pageSize.asReadonly(),
    totalItems: _totalItems.asReadonly(),
    totalPages,
    hasNextPage,
    hasPrevPage,
    setPage,
    setPageSize,
    setTotalItems,
    nextPage,
    prevPage,
  });
}
