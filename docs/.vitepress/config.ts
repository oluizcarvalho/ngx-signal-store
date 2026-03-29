import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ngx-signal-store',
  description: 'Lightweight Angular 21+ state management powered by native Signals',
  base: '/ngx-signal-store/',

  head: [
    ['meta', { name: 'theme-color', content: '#dd0031' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'ngx-signal-store' }],
    ['meta', { property: 'og:description', content: 'Lightweight Angular 21+ state management powered by native Signals' }],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API', link: '/api/create-signal-store', activeMatch: '/api/' },
      { text: 'Examples', link: '/examples/todo', activeMatch: '/examples/' },
      { text: 'vs NgRx', link: '/vs-ngrx' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Composing Operators', link: '/guide/composing' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Core',
          items: [
            { text: 'createSignalStore', link: '/api/create-signal-store' },
            { text: 'createEntityStore', link: '/api/create-entity-store' },
          ],
        },
        {
          text: 'Operators',
          items: [
            { text: 'withLoading', link: '/api/with-loading' },
            { text: 'withPagination', link: '/api/with-pagination' },
            { text: 'withFilter', link: '/api/with-filter' },
          ],
        },
        {
          text: 'Helpers',
          items: [
            { text: 'derivedFrom', link: '/api/derived-from' },
            { text: 'debounced', link: '/api/debounced' },
          ],
        },
        {
          text: 'DevTools',
          items: [
            { text: 'withDevTools', link: '/api/devtools' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Todo App', link: '/examples/todo' },
            { text: 'User Management', link: '/examples/users' },
            { text: 'Shopping Cart', link: '/examples/shopping-cart' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/oluizcarvalho/ngx-signal-store' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Luiz Carvalho',
    },

    editLink: {
      pattern: 'https://github.com/oluizcarvalho/ngx-signal-store/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
