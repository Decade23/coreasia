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
    '@nuxtjs/color-mode',
  ],
  vite: {
    plugins: [
      // @ts-expect-error - Tailwind CSS v4 Vite plugin
      (await import("@tailwindcss/vite")).default(),
    ],
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8083/api',
      tenantSlug: 'demo',
    },
  },
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
  },
  devServer: {
    port: 3001
  },
  components: [
    { path: '~/components/atoms', pathPrefix: false },
    { path: '~/components/molecules', pathPrefix: false, ignore: ['CaDatePicker.vue'] },
    { path: '~/components/organisms', pathPrefix: false },
    { path: '~/components/templates', pathPrefix: false },
  ],
  css: ['~/assets/css/main.css'],
  i18n: {
    locales: [
      { code: 'id', iso: 'id-ID', file: 'id.json', name: 'Bahasa Indonesia' },
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' }
    ],
    defaultLocale: 'id',
    langDir: '../locales',
    lazy: false,
    detectBrowserLanguage: false,
    strategy: 'prefix_except_default'
  }
})
