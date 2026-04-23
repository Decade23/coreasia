<script setup lang="ts">
import {
  DEFAULT_THEME,
  SYSTEM_THEME_MEDIA_QUERY,
  THEME_COOKIE_KEY,
} from '~/composables/useCoreTheme'

definePageMeta({ layout: false })

const { theme } = useCoreTheme()
const { login, loginError, pending, isAuthenticated } = useAdminAuth()
const { tc } = useConsoleI18n()
const toast = useToast()

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
  bodyAttrs: { class: 'ca-console-page' },
  script: [{ innerHTML: themeBootstrapScript, tagPosition: 'head' }],
}))

const handleSubmit = async () => {
  const success = await login(email.value, password.value)
  if (success) {
    toast.success(tc('login.success'))
    navigateTo('/console')
  } else {
    toast.error(tc('login.failed'))
  }
}

onMounted(() => {
  if (isAuthenticated.value) navigateTo('/console')
})
</script>

<template>
  <div class="ca-console-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
    <div class="relative z-[1] w-full max-w-lg">
      <div class="mb-8 text-center">
        <div class="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.75rem] border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] shadow-[var(--ca-card-soft-shadow)]">
          <NuxtImg src="/logo.svg" alt="CoreAsia" width="48" height="48" class="h-10 w-10" />
        </div>
        <div class="mt-5">
          <span class="ca-kicker">
            <Icon name="lucide:shield-check" class="h-3.5 w-3.5" />
            {{ tc('layout.kicker') }}
          </span>
        </div>
        <h1 class="mt-5 font-display text-3xl font-bold text-[var(--ca-text)]">{{ tc('login.title') }}</h1>
        <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ tc('login.description') }}</p>
      </div>

      <form class="ca-console-dialog p-6 sm:p-8" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <BaseInput
            id="email"
            v-model="email"
            :label="tc('login.email')"
            type="email"
            placeholder="admin@coreasia.id"
            required
            icon="lucide:mail"
          />
          <BasePasswordInput
            id="password"
            v-model="password"
            :label="tc('login.password')"
            :placeholder="tc('login.passwordPlaceholder')"
            required
          />
        </div>

        <p v-if="loginError" class="mt-3 text-sm text-rose-400">{{ loginError }}</p>

        <button
          type="submit"
          class="ca-btn-primary mt-6 w-full"
          :disabled="pending || !email || !password"
        >
          <span v-if="pending">{{ tc('login.submitting') }}</span>
          <span v-else>{{ tc('login.submit') }}</span>
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-[var(--ca-subtle)]">
        <NuxtLink to="/" class="transition hover:text-[var(--ca-muted)]">
          &larr; {{ tc('common.backToWebsite') }}
        </NuxtLink>
      </p>
    </div>
  </div>
  <ToastContainer />
</template>
