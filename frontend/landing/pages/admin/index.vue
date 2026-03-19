<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { fetchStats } = useArticles()
const stats = ref<Record<string, number>>({})

onMounted(async () => {
  stats.value = await fetchStats()
})

const totalArticles = computed(() => Object.values(stats.value).reduce((a, b) => a + b, 0))
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Dashboard</h1>
      <p class="mt-1 text-sm text-[var(--ca-muted)]">Ringkasan konten dan aktivitas admin</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="ca-card p-5">
        <div class="flex items-center gap-3">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Icon name="lucide:file-text" class="h-5 w-5 ca-tone-gold" />
          </div>
          <div>
            <p class="text-2xl font-bold text-[var(--ca-text)]">{{ totalArticles }}</p>
            <p class="text-xs text-[var(--ca-muted)]">Total Artikel</p>
          </div>
        </div>
      </div>

      <div class="ca-card p-5">
        <div class="flex items-center gap-3">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Icon name="lucide:check-circle" class="h-5 w-5 ca-tone-emerald" />
          </div>
          <div>
            <p class="text-2xl font-bold text-[var(--ca-text)]">{{ stats.published || 0 }}</p>
            <p class="text-xs text-[var(--ca-muted)]">Published</p>
          </div>
        </div>
      </div>

      <div class="ca-card p-5">
        <div class="flex items-center gap-3">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10">
            <Icon name="lucide:edit-3" class="h-5 w-5 text-[var(--ca-muted)]" />
          </div>
          <div>
            <p class="text-2xl font-bold text-[var(--ca-text)]">{{ stats.draft || 0 }}</p>
            <p class="text-xs text-[var(--ca-muted)]">Draft</p>
          </div>
        </div>
      </div>

      <div class="ca-card p-5">
        <div class="flex items-center gap-3">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Icon name="lucide:archive" class="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-[var(--ca-text)]">{{ stats.archived || 0 }}</p>
            <p class="text-xs text-[var(--ca-muted)]">Archived</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink to="/admin/articles/create" class="ca-card-soft group flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
        <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
          <Icon name="lucide:plus" class="h-5 w-5 ca-tone-gold" />
        </div>
        <div>
          <h3 class="font-display font-semibold text-[var(--ca-text)]">Buat Artikel Baru</h3>
          <p class="text-sm text-[var(--ca-muted)]">Tulis atau generate artikel dengan AI</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/articles" class="ca-card-soft group flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
        <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
          <Icon name="lucide:list" class="h-5 w-5 ca-tone-emerald" />
        </div>
        <div>
          <h3 class="font-display font-semibold text-[var(--ca-text)]">Kelola Artikel</h3>
          <p class="text-sm text-[var(--ca-muted)]">Edit, publish, atau hapus artikel</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
