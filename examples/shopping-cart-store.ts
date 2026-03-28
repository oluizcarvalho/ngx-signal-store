/**
 * Shopping Cart Store Example
 *
 * Demonstrates: createSignalStore + computed + withLoading + derivedFrom
 */
import { computed, signal } from '@angular/core';
import {
  createSignalStore,
  withLoading,
  derivedFrom,
} from 'ngx-signal-store';

// --- Types ---

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string;
  couponDiscount: number; // 0 to 1 (e.g., 0.1 = 10%)
}

// --- Store ---

function createShoppingCartStore() {
  const base = createSignalStore({
    state: {
      items: [] as CartItem[],
      couponCode: '',
      couponDiscount: 0,
    } satisfies CartState,

    computed: (s) => ({
      itemCount: computed(() =>
        s.items().reduce((sum, item) => sum + item.quantity, 0),
      ),
      subtotal: computed(() =>
        s.items().reduce((sum, item) => sum + item.price * item.quantity, 0),
      ),
      isEmpty: computed(() => s.items().length === 0),
    }),

    methods: (s, set) => ({
      addItem: (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
        const existing = s.items().find((i) => i.productId === product.productId);
        if (existing) {
          set({
            items: s.items().map((i) =>
              i.productId === product.productId
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          });
        } else {
          set({ items: [...s.items(), { ...product, quantity }] });
        }
      },

      removeItem: (productId: string) => {
        set({ items: s.items().filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          set({ items: s.items().filter((i) => i.productId !== productId) });
        } else {
          set({
            items: s.items().map((i) =>
              i.productId === productId ? { ...i, quantity } : i,
            ),
          });
        }
      },

      applyCoupon: (code: string) => {
        // Simulate coupon validation
        const coupons: Record<string, number> = {
          SAVE10: 0.1,
          SAVE20: 0.2,
          HALF: 0.5,
        };
        const discount = coupons[code.toUpperCase()] ?? 0;
        set({ couponCode: code, couponDiscount: discount });
      },

      clearCart: () => {
        set({ items: [], couponCode: '', couponDiscount: 0 });
      },
    }),
  });

  // Add loading for checkout
  const store = withLoading(base);

  // Derived signals using derivedFrom
  const taxRate = signal(0.08); // 8% tax

  const discount = derivedFrom(
    [store.subtotal, store.couponDiscount],
    (sub, disc) => sub * disc,
  );

  const tax = derivedFrom(
    [store.subtotal, discount, taxRate],
    (sub, disc, rate) => (sub - disc) * rate,
  );

  const total = derivedFrom(
    [store.subtotal, discount, tax],
    (sub, disc, t) => sub - disc + t,
  );

  // --- Methods ---

  async function checkout(): Promise<{ orderId: string }> {
    return store.withAsync(async () => {
      // Simulate checkout API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const orderId = `ORD-${Date.now()}`;
      store.clearCart();
      return { orderId };
    });
  }

  return {
    ...store,
    taxRate,
    discount,
    tax,
    total,
    checkout,
  };
}

// --- Usage ---

export const cartStore = createShoppingCartStore();

// cartStore.addItem({ productId: 'p1', name: 'Widget', price: 29.99 });
// cartStore.addItem({ productId: 'p2', name: 'Gadget', price: 49.99 }, 2);
// cartStore.itemCount();    // 3
// cartStore.subtotal();     // 129.97
// cartStore.applyCoupon('SAVE10');
// cartStore.discount();     // 12.997
// cartStore.total();        // ~126.33 (with tax)
// await cartStore.checkout();
