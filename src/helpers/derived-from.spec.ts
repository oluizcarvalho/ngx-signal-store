import { describe, it, expect } from 'vitest';
import { signal } from '@angular/core';
import { derivedFrom } from './derived-from';

describe('derivedFrom', () => {
  it('should derive a value from multiple signals', () => {
    const a = signal(2);
    const b = signal(3);

    const product = derivedFrom([a, b], (x, y) => x * y);
    expect(product()).toBe(6);
  });

  it('should react to source signal changes', () => {
    const price = signal(100);
    const quantity = signal(2);

    const total = derivedFrom([price, quantity], (p, q) => p * q);
    expect(total()).toBe(200);

    price.set(150);
    expect(total()).toBe(300);

    quantity.set(3);
    expect(total()).toBe(450);
  });

  it('should work with a single signal', () => {
    const value = signal(5);
    const doubled = derivedFrom([value], (v) => v * 2);
    expect(doubled()).toBe(10);
  });

  it('should work with different types', () => {
    const name = signal('World');
    const excited = signal(true);

    const greeting = derivedFrom([name, excited], (n, e) =>
      e ? `Hello, ${n}!` : `Hello, ${n}.`,
    );

    expect(greeting()).toBe('Hello, World!');

    excited.set(false);
    expect(greeting()).toBe('Hello, World.');
  });

  it('should work with three signals', () => {
    const a = signal(1);
    const b = signal(2);
    const c = signal(3);

    const sum = derivedFrom([a, b, c], (x, y, z) => x + y + z);
    expect(sum()).toBe(6);

    a.set(10);
    expect(sum()).toBe(15);
  });
});
