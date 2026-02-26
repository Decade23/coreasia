// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
  ],
  vite: {
    plugins: [
      // @ts-expect-error - Tailwind CSS v4 Vite plugin
      (await import("@tailwindcss/vite")).default(),
    ],
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8080/api',
      tenantSlug: 'demo',
    },
  },
  devServer: {
    port: 3001
  },
  css: ['~/assets/css/main.css'],
  i18n: {
    locales: [
      { code: 'id', iso: 'id-ID', file: 'id.json', name: 'Bahasa Indonesia' },
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' }
    ],
    defaultLocale: 'id',
    langDir: 'locales',
    strategy: 'prefix_except_default'
  }
})
