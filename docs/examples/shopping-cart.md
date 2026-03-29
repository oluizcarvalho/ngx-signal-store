# Shopping Cart

A shopping cart with dynamic pricing, coupons, and tax calculation — demonstrating `createSignalStore`, `derivedFrom`, and `withLoading`.

## What We'll Build

- Add/remove products and update quantities
- Apply discount coupons
- Computed tax and total using `derivedFrom`
- Async checkout with loading state

## Store Implementation

```typescript
import { computed, signal } from '@angular/core';
import { createSignalStore, withLoading, derivedFrom } from 'ngx-signal-store';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

function createShoppingCartStore() {
  const base = createSignalStore({
    state: {
      items: [] as CartItem[],
      couponCode: '',
      couponDiscount: 0, // 0 to 1 (e.g. 0.1 = 10% off)
    },

    computed: (s) => ({
      itemCount: computed(() => s.items().reduce((sum, i) => sum + i.quantity, 0)),
      subtotal:  computed(() => s.items().reduce((sum, i) => sum + i.price * i.quantity, 0)),
      isEmpty:   computed(() => s.items().length === 0),
    }),

    methods: (s, set) => ({
      addItem(product: Omit<CartItem, 'quantity'>, quantity = 1) {
        const existing = s.items().find(i => i.productId === product.productId);
        if (existing) {
          set({
            items: s.items().map(i =>
              i.productId === product.productId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...s.items(), { ...product, quantity }] });
        }
      },

      removeItem(productId: string) {
        set({ items: s.items().filter(i => i.productId !== productId) });
      },

      updateQuantity(productId: string, quantity: number) {
        if (quantity <= 0) {
          set({ items: s.items().filter(i => i.productId !== productId) });
        } else {
          set({
            items: s.items().map(i =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          });
        }
      },

      applyCoupon(code: string) {
        const coupons: Record<string, number> = {
          SAVE10: 0.1,
          SAVE20: 0.2,
          HALF:   0.5,
        };
        const discount = coupons[code.toUpperCase()] ?? 0;
        set({ couponCode: code, couponDiscount: discount });
      },

      clearCart() {
        set({ items: [], couponCode: '', couponDiscount: 0 });
      },
    }),
  });

  const store = withLoading(base);

  // External tax rate (could come from a config store)
  const taxRate = signal(0.08); // 8%

  // Derived financial calculations using derivedFrom
  const discountAmount = derivedFrom(
    [store.subtotal, store.couponDiscount],
    (subtotal, discount) => subtotal * discount
  );

  const taxAmount = derivedFrom(
    [store.subtotal, discountAmount, taxRate],
    (subtotal, disc, rate) => (subtotal - disc) * rate
  );

  const total = derivedFrom(
    [store.subtotal, discountAmount, taxAmount],
    (subtotal, disc, tax) => subtotal - disc + tax
  );

  // Checkout
  async function checkout(): Promise<{ orderId: string }> {
    return store.withAsync(async () => {
      await new Promise(r => setTimeout(r, 1500)); // simulate API
      const orderId = `ORD-${Date.now()}`;
      store.clearCart();
      return { orderId };
    });
  }

  return {
    ...store,
    taxRate,
    discountAmount,
    taxAmount,
    total,
    checkout,
  };
}

export const cartStore = createShoppingCartStore();
```

## Using in a Component

```typescript
@Component({
  selector: 'app-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cartStore.isEmpty()) {
      <p>Your cart is empty.</p>
    } @else {

      <!-- Items -->
      @for (item of cartStore.items(); track item.productId) {
        <div class="cart-item">
          <span>{{ item.name }}</span>
          <input
            type="number"
            [value]="item.quantity"
            min="0"
            (change)="cartStore.updateQuantity(item.productId, +$any($event.target).value)"
          />
          <span>{{ item.price * item.quantity | currency }}</span>
          <button (click)="cartStore.removeItem(item.productId)">Remove</button>
        </div>
      }

      <!-- Coupon -->
      <div class="coupon">
        <input #coupon placeholder="Coupon code" />
        <button (click)="cartStore.applyCoupon(coupon.value)">Apply</button>
        @if (cartStore.couponCode()) {
          <span>{{ (cartStore.couponDiscount() * 100) }}% off applied!</span>
        }
      </div>

      <!-- Summary -->
      <div class="summary">
        <div>
          <span>Subtotal</span>
          <span>{{ cartStore.subtotal() | currency }}</span>
        </div>
        @if (cartStore.discountAmount() > 0) {
          <div class="discount">
            <span>Discount ({{ cartStore.couponCode() }})</span>
            <span>-{{ cartStore.discountAmount() | currency }}</span>
          </div>
        }
        <div>
          <span>Tax ({{ cartStore.taxRate() * 100 }}%)</span>
          <span>{{ cartStore.taxAmount() | currency }}</span>
        </div>
        <div class="total">
          <strong>Total</strong>
          <strong>{{ cartStore.total() | currency }}</strong>
        </div>
      </div>

      <!-- Checkout -->
      <button
        [disabled]="cartStore.loading()"
        (click)="checkout()"
      >
        {{ cartStore.loading() ? 'Processing...' : 'Checkout' }}
      </button>
    }
  `,
})
export class CartComponent {
  cartStore = inject(CartService);

  async checkout() {
    try {
      const { orderId } = await this.cartStore.checkout();
      alert(`Order placed! ID: ${orderId}`);
    } catch {
      // error is set in cartStore.error()
    }
  }
}
```

## Key Patterns

| Feature | How |
|---|---|
| Existing item quantity merge | `find` + conditional `set` in `addItem` |
| Multi-step price calculation | `derivedFrom` chains (subtotal → discount → tax → total) |
| External config signal | `taxRate = signal(0.08)` passed into `derivedFrom` |
| Async checkout with loading | `withLoading` + `withAsync` |
| Remove on zero qty | `updateQuantity` converts to `removeItem` when qty ≤ 0 |
