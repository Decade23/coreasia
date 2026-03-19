<script setup lang="ts">
const { locale, setLocale } = useCoreI18n()
const { user, logout } = useAdminAuth()
const route = useRoute()

const toggleLocale = () => {
  setLocale(locale.value === 'id' ? 'en' : 'id')
}

const menuItems = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/console' },
  { label: 'Artikel', icon: 'lucide:file-text', to: '/console/articles' },
  { label: 'Users', icon: 'lucide:users', to: '/console/users' },
  { label: 'Audit Log', icon: 'lucide:scroll-text', to: '/console/audit-log' },
]

const isActive = (path: string) => {
  if (path === '/console') return route.path === '/console'
  return route.path.startsWith(path)
}

const isSidebarOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-[var(--ca-bg)]">
    <!-- Mobile header -->
    <header class="fixed top-0 left-0 right-0 z-50 h-14 ca-glass-header backdrop-blur-xl lg:hidden">
      <div class="flex h-full items-center justify-between px-4">
        <button type="button" class="text-[var(--ca-muted)]" @click="isSidebarOpen = !isSidebarOpen">
          <Icon name="lucide:menu" class="h-5 w-5" />
        </button>
        <span class="font-display text-sm font-bold text-[var(--ca-text)]">CoreAsia Console</span>
        <ThemeToggle />
      </div>
    </header>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 border-r border-[color:var(--ca-border)] bg-[var(--ca-bg)] transition-transform lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-full flex-col">
        <!-- Logo -->
        <div class="flex h-16 items-center gap-3 border-b border-[color:var(--ca-border)] px-5">
          <NuxtImg src="/logo.svg" alt="CoreAsia" width="32" height="32" class="h-8 w-8" />
          <div>
            <span class="block font-display text-sm font-bold text-[var(--ca-text)]">CoreAsia</span>
            <span class="block text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ca-muted)]">Console</span>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 space-y-1 p-3">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            :class="isActive(item.to) ? 'bg-[var(--ca-kicker-bg)] text-brand-primary' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]'"
            @click="isSidebarOpen = false"
          >
            <Icon :name="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Footer -->
        <div class="border-t border-[color:var(--ca-border)] p-3">
          <div class="mb-3 flex items-center justify-between px-3">
            <ThemeToggle />
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--ca-muted)] transition hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]"
              @click="toggleLocale"
            >
              <Icon name="lucide:languages" class="h-3.5 w-3.5" />
              {{ locale === 'id' ? 'EN' : 'ID' }}
            </button>
          </div>
          <div v-if="user" class="mb-2 px-3">
            <p class="text-xs font-medium text-[var(--ca-text)] truncate">{{ user.full_name }}</p>
            <p class="text-[0.65rem] text-[var(--ca-muted)] truncate">{{ user.email }}</p>
          </div>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
            @click="logout()"
          >
            <Icon name="lucide:log-out" class="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>

    <!-- Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="isSidebarOpen = false"
    />

    <!-- Main content -->
    <main class="pt-14 lg:pt-0 lg:pl-64">
      <div class="min-h-screen p-4 sm:p-6 lg:p-8">
        <slot />
      </div>
    </main>
  </div>
</template>
