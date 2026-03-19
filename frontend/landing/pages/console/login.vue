<script setup lang="ts">
import {
  DEFAULT_THEME,
  SYSTEM_THEME_MEDIA_QUERY,
  THEME_COOKIE_KEY,
} from '~/composables/useCoreTheme'

definePageMeta({ layout: false })

const { theme } = useCoreTheme()
const { login, loginError, pending, isAuthenticated } = useAdminAuth()

const email = ref('')
const password = ref('')

/* Theme bootstrap for standalone login page */
const themeBootstrapScript = `(() => {
  try {
    const allowedThemes = ['dark', 'light']
    const cookieTheme = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('${THEME_COOKIE_KEY}='))
      ?.split('=')
      .slice(1)
      .join('=')
    const storedTheme = cookieTheme ? decodeURIComponent(cookieTheme) : null
    const resolvedTheme = allowedThemes.includes(storedTheme ?? '')
      ? storedTheme
      : window.matchMedia('${SYSTEM_THEME_MEDIA_QUERY}').matches
        ? 'dark'
        : 'light'
    document.documentElement.setAttribute('data-theme', resolvedTheme || '${DEFAULT_THEME}')
  } catch (_error) {
    document.documentElement.setAttribute('data-theme', '${DEFAULT_THEME}')
  }
})()`

useHead(() => ({
  htmlAttrs: { 'data-theme': theme.value },
  script: [{ innerHTML: themeBootstrapScript, tagPosition: 'head' }],
}))

const handleSubmit = async () => {
  const success = await login(email.value, password.value)
  if (success) navigateTo('/console')
}

onMounted(() => {
  if (isAuthenticated.value) navigateTo('/console')
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[var(--ca-bg)] px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <NuxtImg src="/logo.svg" alt="CoreAsia" width="48" height="48" class="mx-auto h-12 w-12" />
        <h1 class="mt-4 font-display text-2xl font-bold text-[var(--ca-text)]">Admin Login</h1>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">Masuk ke panel admin CoreAsia</p>
      </div>

      <form class="ca-card p-6 sm:p-8" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <BaseInput
            id="email"
            v-model="email"
            label="Email"
            type="email"
            placeholder="admin@coreasia.id"
            required
            icon="lucide:mail"
          />
          <BasePasswordInput
            id="password"
            v-model="password"
            label="Password"
            placeholder="Masukkan password"
            required
          />
        </div>

        <p v-if="loginError" class="mt-3 text-sm text-rose-400">{{ loginError }}</p>

        <button
          type="submit"
          class="ca-btn-primary mt-6 w-full"
          :disabled="pending || !email || !password"
        >
          <span v-if="pending">Memproses...</span>
          <span v-else>Masuk</span>
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-[var(--ca-subtle)]">
        <NuxtLink to="/" class="transition hover:text-[var(--ca-muted)]">
          &larr; Kembali ke website
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
