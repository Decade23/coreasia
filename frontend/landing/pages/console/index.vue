<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { fetchStats } = useArticles()
const { items: bots, fetchBots } = useBotSchedules()
const { tc } = useConsoleI18n()
const { formatDateTime } = useConsoleDateTime()
const stats = ref<Record<string, number>>({})

onMounted(async () => {
  stats.value = await fetchStats()
  fetchBots()
})

const activeBots = computed(() => bots.value.filter(b => b.is_active).length)
const botStatusColor = (s: string) => {
  const m: Record<string, string> = { idle: 'text-[var(--ca-muted)]', running: 'text-blue-400', success: 'text-emerald-400', error: 'text-rose-400' }
  return m[s] || m.idle
}
const formatBotDate = (d: string | null) => formatDateTime(d)

const totalArticles = computed(() => Object.values(stats.value).reduce((a, b) => a + b, 0))
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('dashboard.kicker')"
      icon="lucide:layout-dashboard"
      :title="tc('dashboard.title')"
      :description="tc('dashboard.description')"
    >
      <template #meta>
        <span class="ca-pill-emerald">
          <Icon name="lucide:bot" class="h-3.5 w-3.5" />
          {{ activeBots }} bots {{ tc('common.active') }}
        </span>
      </template>
    </ConsolePageHeader>

    <!-- Stats Cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="ca-console-stat">
        <div class="flex items-center gap-3">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Icon name="lucide:file-text" class="h-5 w-5 ca-tone-gold" />
          </div>
          <div>
            <p class="text-2xl font-bold text-[var(--ca-text)]">{{ totalArticles }}</p>
            <p class="text-xs text-[var(--ca-muted)]">{{ tc('dashboard.totalArticles') }}</p>
          </div>
        </div>
      </div>

      <div class="ca-console-stat">
        <div class="flex items-center gap-3">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Icon name="lucide:check-circle" class="h-5 w-5 ca-tone-emerald" />
          </div>
          <div>
            <p class="text-2xl font-bold text-[var(--ca-text)]">{{ stats.published || 0 }}</p>
            <p class="text-xs text-[var(--ca-muted)]">{{ tc('dashboard.published') }}</p>
          </div>
        </div>
      </div>

      <div class="ca-console-stat">
        <div class="flex items-center gap-3">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10">
            <Icon name="lucide:edit-3" class="h-5 w-5 text-[var(--ca-muted)]" />
          </div>
          <div>
            <p class="text-2xl font-bold text-[var(--ca-text)]">{{ stats.draft || 0 }}</p>
            <p class="text-xs text-[var(--ca-muted)]">{{ tc('dashboard.draft') }}</p>
          </div>
        </div>
      </div>

      <div class="ca-console-stat">
        <div class="flex items-center gap-3">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Icon name="lucide:archive" class="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-[var(--ca-text)]">{{ stats.archived || 0 }}</p>
            <p class="text-xs text-[var(--ca-muted)]">{{ tc('dashboard.archived') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bot Status -->
    <div v-if="bots.length" class="mt-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-display text-sm font-semibold text-[var(--ca-text)]">
          <Icon name="lucide:bot" class="mr-1.5 inline h-4 w-4 text-amber-400" />
          {{ tc('dashboard.botSection') }}
        </h2>
        <NuxtLink to="/console/bots" class="text-xs ca-tone-gold hover:underline">{{ tc('dashboard.botManage') }} &rarr;</NuxtLink>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="b in bots"
          :key="b.id"
          to="/console/bots"
          class="ca-card-soft flex items-center gap-3 rounded-[1.5rem] p-4 transition hover:-translate-y-0.5"
        >
          <div class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" :class="b.is_active ? 'bg-emerald-500/10' : 'bg-slate-500/10'">
            <Icon name="lucide:bot" class="h-4 w-4" :class="b.is_active ? 'text-emerald-400' : 'text-[var(--ca-subtle)]'" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-[var(--ca-text)] truncate">{{ b.name }}</p>
            <div class="flex items-center gap-2 text-[0.65rem]">
              <span :class="botStatusColor(b.last_status)" class="font-semibold uppercase">{{ b.last_status }}</span>
              <span class="text-[var(--ca-subtle)]">{{ formatBotDate(b.last_run_at) }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink to="/console/articles/create" class="ca-card-soft group flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
        <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
          <Icon name="lucide:plus" class="h-5 w-5 ca-tone-gold" />
        </div>
        <div>
          <h3 class="font-display font-semibold text-[var(--ca-text)]">{{ tc('dashboard.createArticle') }}</h3>
          <p class="text-sm text-[var(--ca-muted)]">{{ tc('dashboard.createArticleDesc') }}</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/console/articles" class="ca-card-soft group flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
        <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
          <Icon name="lucide:list" class="h-5 w-5 ca-tone-emerald" />
        </div>
        <div>
          <h3 class="font-display font-semibold text-[var(--ca-text)]">{{ tc('dashboard.manageArticles') }}</h3>
          <p class="text-sm text-[var(--ca-muted)]">{{ tc('dashboard.manageArticlesDesc') }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
