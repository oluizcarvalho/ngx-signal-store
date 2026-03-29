---
layout: home

hero:
  name: ngx-signal-store
  text: State management for Angular 21+
  tagline: Built entirely on native Signals. No RxJS. No boilerplate. Just signals.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/create-signal-store
    - theme: alt
      text: View on GitHub
      link: https://github.com/oluizcarvalho/ngx-signal-store

features:
  - icon: ⚡
    title: Zero Boilerplate
    details: One function call creates a fully reactive store with state, computed signals, and methods. No actions, reducers, or selectors.

  - icon: 🎯
    title: 100% Signals
    details: Built entirely on Angular's native signal primitives — signal(), computed(), and linkedSignal(). No RxJS dependency required.

  - icon: 🧩
    title: Composable Operators
    details: Extend any store with withLoading, withPagination, withFilter, and withDevTools. Mix and match freely.

  - icon: 🔒
    title: Type-Safe
    details: Full TypeScript inference from state shape to computed properties to methods. No manual type annotations needed.

  - icon: 🪶
    title: Tiny (~3 KB)
    details: Tree-shakeable by design. Import only what you use. Zero runtime overhead beyond Angular's own signals.

  - icon: ⏱️
    title: Time-Travel DevTools
    details: Built-in undo/redo and history navigation with withDevTools. Debug state changes without any extra setup.
---

## Quick Look

```typescript
import { computed } from '@angular/core';
import { createSignalStore } from 'ngx-signal-store';

const counter = createSignalStore({
  state: { count: 0 },
  computed: (s) => ({
    doubled: computed(() => s.count() * 2),
  }),
  methods: (s, set) => ({
    increment: () => set({ count: s.count() + 1 }),
    decrement: () => set({ count: s.count() - 1 }),
  }),
});

counter.count();     // 0
counter.increment();
counter.count();     // 1
counter.doubled();   // 2
```

## Install

```bash
npm install ngx-signal-store
```

Requires `@angular/core >= 21.0.0` as a peer dependency.
