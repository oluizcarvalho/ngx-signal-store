import { describe, it, expect } from 'vitest';
import { withPagination } from './with-pagination';

describe('withPagination', () => {
  const makeStore = () => ({ data: 'test' });

  it('should initialize with defaults', () => {
    const store = withPagination(makeStore());

    expect(store.page()).toBe(1);
    expect(store.pageSize()).toBe(10);
    expect(store.totalItems()).toBe(0);
    expect(store.totalPages()).toBe(1); // min 1
    expect(store.hasNextPage()).toBe(false);
    expect(store.hasPrevPage()).toBe(false);
  });

  it('should accept custom page size', () => {
    const store = withPagination(makeStore(), { pageSize: 25 });
    expect(store.pageSize()).toBe(25);
  });

  it('should calculate totalPages correctly', () => {
    const store = withPagination(makeStore(), { pageSize: 10 });

    store.setTotalItems(95);
    expect(store.totalPages()).toBe(10); // ceil(95/10)

    store.setTotalItems(100);
    expect(store.totalPages()).toBe(10);
  });

  it('should navigate pages with nextPage/prevPage', () => {
    const store = withPagination(makeStore(), { pageSize: 10 });
    store.setTotalItems(50);

    expect(store.page()).toBe(1);
    expect(store.hasNextPage()).toBe(true);
    expect(store.hasPrevPage()).toBe(false);

    store.nextPage();
    expect(store.page()).toBe(2);
    expect(store.hasPrevPage()).toBe(true);

    store.prevPage();
    expect(store.page()).toBe(1);
  });

  it('should not go past last page', () => {
    const store = withPagination(makeStore(), { pageSize: 10 });
    store.setTotalItems(20);

    store.setPage(2);
    store.nextPage(); // should stay at 2
    expect(store.page()).toBe(2);
  });

  it('should not go below page 1', () => {
    const store = withPagination(makeStore());
    store.prevPage();
    expect(store.page()).toBe(1);
  });

  it('should reset page on pageSize change', () => {
    const store = withPagination(makeStore(), { pageSize: 10 });
    store.setTotalItems(100);
    store.setPage(5);

    store.setPageSize(20);
    expect(store.page()).toBe(1);
    expect(store.pageSize()).toBe(20);
    expect(store.totalPages()).toBe(5);
  });

  it('should preserve original store properties', () => {
    const store = withPagination(makeStore());
    expect(store.data).toBe('test');
  });
});
