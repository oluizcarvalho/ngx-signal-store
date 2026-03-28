import { computed, type Signal } from '@angular/core';

/**
 * Creates a computed signal derived from multiple source signals.
 *
 * A convenience wrapper around `computed()` that unwraps an array of signals
 * and passes their values to a computation function.
 *
 * @example
 * ```ts
 * const price = signal(100);
 * const quantity = signal(3);
 * const tax = signal(0.1);
 *
 * const total = derivedFrom(
 *   [price, quantity, tax],
 *   (p, q, t) => p * q * (1 + t),
 * );
 *
 * total(); // 330
 * ```
 */
export function derivedFrom<T extends readonly Signal<any>[], R>(
  signals: [...T],
  computation: (
    ...values: { [K in keyof T]: T[K] extends Signal<infer V> ? V : never }
  ) => R,
): Signal<R> {
  return computed(() => {
    const values = signals.map((s) => s()) as {
      [K in keyof T]: T[K] extends Signal<infer V> ? V : never;
    };
    return (computation as any)(...values);
  });
}
