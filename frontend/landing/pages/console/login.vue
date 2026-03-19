<script setup lang="ts">
definePageMeta({ layout: false })

const { login, loginError, pending, isAuthenticated } = useAdminAuth()

const email = ref('')
const password = ref('')

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
