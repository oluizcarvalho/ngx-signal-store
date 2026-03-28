import { describe, it, expect, vi, afterEach } from 'vitest';
import { signal } from '@angular/core';
import { debounced } from './debounced';

describe('debounced', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with the source value', () => {
    const source = signal('hello');
    const d = debounced(source, 100);

    expect(d.value()).toBe('hello');
    d.destroy();
  });

  it('should update after the delay', () => {
    vi.useFakeTimers();

    const source = signal('a');
    const d = debounced(source, 200);

    source.set('b');

    // Trigger polling interval
    vi.advanceTimersByTime(16);
    // Value should not have changed yet
    expect(d.value()).toBe('a');

    // Advance past debounce delay
    vi.advanceTimersByTime(200);
    expect(d.value()).toBe('b');

    d.destroy();
  });

  it('should debounce rapid changes', () => {
    vi.useFakeTimers();

    const source = signal(0);
    const d = debounced(source, 100);

    source.set(1);
    vi.advanceTimersByTime(16);
    source.set(2);
    vi.advanceTimersByTime(16);
    source.set(3);
    vi.advanceTimersByTime(16);

    // Not enough time for debounce
    expect(d.value()).toBe(0);

    // Advance past debounce
    vi.advanceTimersByTime(100);
    expect(d.value()).toBe(3); // Only the last value

    d.destroy();
  });

  it('should stop updating after destroy()', () => {
    vi.useFakeTimers();

    const source = signal('start');
    const d = debounced(source, 50);

    d.destroy();
    source.set('changed');
    vi.advanceTimersByTime(100);

    expect(d.value()).toBe('start');
  });
});
