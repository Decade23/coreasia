<script setup lang="ts">
import {
  DEFAULT_THEME,
  SYSTEM_THEME_MEDIA_QUERY,
  THEME_COOKIE_KEY,
} from '~/composables/useCoreTheme'

const { theme, setTheme } = useCoreTheme()
const toggleTheme = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')
const { locale, setLocale } = useCoreI18n()
const { user, logout } = useAdminAuth()
const route = useRoute()

/* ── Theme bootstrap ── */
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

const toggleLocale = () => setLocale(locale.value === 'id' ? 'en' : 'id')

const menuItems = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/console' },
  { label: 'Artikel', icon: 'lucide:file-text', to: '/console/articles' },
  { label: 'Bots', icon: 'lucide:bot', to: '/console/bots' },
  { label: 'AI Settings', icon: 'lucide:sparkles', to: '/console/ai-settings' },
  { label: 'API Keys', icon: 'lucide:key-round', to: '/console/api-keys' },
  { label: 'Users', icon: 'lucide:users', to: '/console/users' },
  { label: 'Audit Log', icon: 'lucide:scroll-text', to: '/console/audit-log' },
]

const isActive = (path: string) => {
  if (path === '/console') return route.path === '/console'
  return route.path.startsWith(path)
}

const isSidebarOpen = ref(false)
const showUserMenu = ref(false)

/* ── Breadcrumb ── */
const breadcrumbs = computed(() => {
  const crumbs: { label: string; to?: string }[] = [{ label: 'Console', to: '/console' }]
  const path = route.path

  const matched = menuItems.find(m => m.to !== '/console' && path.startsWith(m.to))
  if (matched) {
    crumbs.push({ label: matched.label, to: matched.to })
  }

  // Sub-pages
  if (path.includes('/create')) crumbs.push({ label: 'Buat Baru' })
  else if (path.match(/\/[0-9a-f-]{36}$/)) crumbs.push({ label: 'Edit' })

  return crumbs
})

/* Close user menu on click outside */
if (import.meta.client) {
  const onClickOutside = (e: MouseEvent) => {
    if (showUserMenu.value) showUserMenu.value = false
  }
  onMounted(() => document.addEventListener('click', onClickOutside))
  onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
}

const showLogoutConfirm = ref(false)
const handleLogout = () => {
  showLogoutConfirm.value = false
  logout()
}
</script>

<template>
  <div class="min-h-screen bg-[var(--ca-bg)]">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-56 border-r border-[color:var(--ca-border)] bg-[var(--ca-bg)] transition-transform lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-full flex-col">
        <!-- Logo -->
        <div class="flex h-14 items-center gap-2.5 border-b border-[color:var(--ca-border)] px-4">
          <NuxtImg src="/logo.svg" alt="CoreAsia" width="28" height="28" class="h-7 w-7" />
          <div>
            <span class="block font-display text-sm font-bold leading-tight text-[var(--ca-text)]">CoreAsia</span>
            <span class="block text-[0.6rem] uppercase tracking-[0.14em] text-[var(--ca-muted)]">Console</span>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 space-y-0.5 p-2.5">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-colors"
            :class="isActive(item.to) ? 'bg-[var(--ca-kicker-bg)] text-brand-primary' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]'"
            @click="isSidebarOpen = false"
          >
            <Icon :name="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Sidebar footer -->
        <div class="border-t border-[color:var(--ca-border)] p-3">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--ca-subtle)] transition hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-muted)]"
          >
            <Icon name="lucide:arrow-left" class="h-3.5 w-3.5" />
            Kembali ke website
          </NuxtLink>
        </div>
      </div>
    </aside>

    <!-- Overlay (mobile) -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="isSidebarOpen = false" />

    <!-- Main -->
    <div class="lg:pl-56">
      <!-- Top header bar -->
      <header class="sticky top-0 z-20 h-14 border-b border-[color:var(--ca-border)] bg-[var(--ca-bg)]/80 backdrop-blur-xl">
        <div class="flex h-full items-center justify-between px-4 sm:px-6">
          <!-- Left: hamburger + breadcrumb -->
          <div class="flex items-center gap-3">
            <button type="button" class="lg:hidden text-[var(--ca-muted)]" @click="isSidebarOpen = !isSidebarOpen">
              <Icon name="lucide:menu" class="h-5 w-5" />
            </button>
            <nav class="hidden sm:flex items-center gap-1.5 text-xs">
              <template v-for="(crumb, i) in breadcrumbs" :key="i">
                <span v-if="i > 0" class="text-[var(--ca-subtle)]">/</span>
                <NuxtLink
                  v-if="crumb.to && i < breadcrumbs.length - 1"
                  :to="crumb.to"
                  class="text-[var(--ca-muted)] hover:text-[var(--ca-text)] transition"
                >
                  {{ crumb.label }}
                </NuxtLink>
                <span v-else class="font-semibold text-[var(--ca-text)]">{{ crumb.label }}</span>
              </template>
            </nav>
          </div>

          <!-- Right: actions -->
          <div class="flex items-center gap-1">
            <!-- Theme -->
            <CaTooltip :text="theme === 'dark' ? 'Mode terang' : 'Mode gelap'" position="bottom">
              <button type="button" class="ca-header-btn" @click="toggleTheme">
                <Icon :name="theme === 'dark' ? 'lucide:sun' : 'lucide:moon'" class="h-4 w-4" />
              </button>
            </CaTooltip>

            <!-- Language -->
            <CaTooltip :text="locale === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'" position="bottom">
              <button type="button" class="ca-header-btn" @click="toggleLocale">
                <span class="text-[0.7rem] font-bold">{{ locale === 'id' ? 'EN' : 'ID' }}</span>
              </button>
            </CaTooltip>

            <!-- Divider -->
            <div class="mx-1 h-5 w-px bg-[var(--ca-border)]" />

            <!-- User menu -->
            <div class="relative" @click.stop>
              <button type="button" class="ca-header-btn gap-2 pl-2 pr-2.5" @click="showUserMenu = !showUserMenu">
                <div class="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                  <Icon name="lucide:user" class="h-3.5 w-3.5" />
                </div>
                <span class="hidden sm:inline text-xs font-medium text-[var(--ca-text)] max-w-[100px] truncate">{{ user?.full_name || 'Admin' }}</span>
                <Icon name="lucide:chevron-down" class="h-3 w-3 text-[var(--ca-subtle)]" />
              </button>

              <!-- Dropdown -->
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 scale-95 -translate-y-1"
                leave-active-class="transition duration-100 ease-in"
                leave-to-class="opacity-0 scale-95 -translate-y-1"
              >
                <div v-if="showUserMenu" class="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] p-1.5 shadow-xl">
                  <div class="px-3 py-2 mb-1">
                    <p class="text-xs font-semibold text-[var(--ca-text)] truncate">{{ user?.full_name }}</p>
                    <p class="text-[0.65rem] text-[var(--ca-muted)] truncate">{{ user?.email }}</p>
                    <span class="mt-1 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-amber-400">{{ user?.role }}</span>
                  </div>
                  <div class="h-px bg-[var(--ca-border)] my-1" />
                  <button
                    type="button"
                    class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
                    @click="showUserMenu = false; showLogoutConfirm = true"
                  >
                    <Icon name="lucide:log-out" class="h-3.5 w-3.5" />
                    Keluar
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- Logout confirm modal -->
    <Teleport to="body">
      <div v-if="showLogoutConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showLogoutConfirm = false">
        <div class="ca-card w-full max-w-sm p-6 text-center">
          <div class="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
            <Icon name="lucide:log-out" class="h-6 w-6 text-rose-400" />
          </div>
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">Keluar dari Console?</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">Anda perlu login kembali untuk mengakses console.</p>
          <div class="mt-6 flex justify-center gap-3">
            <button type="button" class="ca-btn-secondary" @click="showLogoutConfirm = false">Batal</button>
            <button type="button" class="rounded-lg bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition" @click="handleLogout">Ya, Keluar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
  <ToastContainer />
</template>

<style scoped>
.ca-header-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: var(--ca-muted);
  transition: all 0.15s;
}
.ca-header-btn:hover {
  background: var(--ca-panel-bg-strong);
  color: var(--ca-text);
}
</style>
