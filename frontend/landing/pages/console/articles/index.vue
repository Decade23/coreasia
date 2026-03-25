<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { items, loading, error, totalItems, currentPage, fetchArticles, deleteArticle, publishArticle, unpublishArticle } = useArticles()
const { can } = usePermissions()
const { tc } = useConsoleI18n()
const { formatDateTime } = useConsoleDateTime()

const searchQuery = ref('')
const statusFilter = ref('')
const showDeleteConfirm = ref(false)
const deletingId = ref('')
const deletingTitle = ref('')

let searchTimeout: ReturnType<typeof setTimeout>

onMounted(() => fetchArticles())

watch(searchQuery, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchArticles(1, { search: val, status: statusFilter.value }), 300)
})

watch(statusFilter, (val) => {
  fetchArticles(1, { search: searchQuery.value, status: val })
})

const handleDelete = (id: string, title: string) => {
  deletingId.value = id
  deletingTitle.value = title
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  const ok = await deleteArticle(deletingId.value)
  showDeleteConfirm.value = false
  if (ok) fetchArticles(currentPage.value, { search: searchQuery.value, status: statusFilter.value })
}

const handlePublish = async (id: string) => {
  const ok = await publishArticle(id)
  if (ok) fetchArticles(currentPage.value, { search: searchQuery.value, status: statusFilter.value })
}

const handleUnpublish = async (id: string) => {
  const ok = await unpublishArticle(id)
  if (ok) fetchArticles(currentPage.value, { search: searchQuery.value, status: statusFilter.value })
}

const statusColor = (status: string) => {
  if (status === 'published') return 'bg-emerald-500/10 text-emerald-400'
  if (status === 'archived') return 'bg-rose-500/10 text-rose-400'
  return 'bg-slate-500/10 text-[var(--ca-muted)]'
}

const statusLabel = (status: string) => {
  if (status === 'published') return tc('common.published')
  if (status === 'archived') return tc('common.archived')
  return tc('common.draft')
}

const aiSourceLabel = (article: any) => {
  if (article.ai_provider && article.ai_model) {
    return tc('articles.generatedWith', {
      provider: article.ai_provider,
      model: article.ai_model,
    })
  }

  return tc('articles.generatedWithUnknown')
}

const timestampItems = (article: any) => {
  const rows = [
    {
      label: tc('articles.createdLabel'),
      value: formatDateTime(article.created_at),
      actor: article.created_by_name,
      meta: '',
    },
    {
      label: tc('articles.updatedLabel'),
      value: formatDateTime(article.updated_at),
      actor: article.updated_by_name,
      meta: '',
    },
  ]

  if (article.ai_generated_at) {
    rows.push({
      label: tc('articles.generatedLabel'),
      value: formatDateTime(article.ai_generated_at),
      actor: article.ai_generated_by_name,
      meta: aiSourceLabel(article),
    })
  }

  return rows
}

const publishActivityItems = (article: any) => {
  const rows: Array<{ label: string; value: string; actor: string | null }> = []

  if (article.published_at) {
    rows.push({
      label: tc('articles.publishedLabel'),
      value: formatDateTime(article.published_at),
      actor: article.published_by_name,
    })
  }

  if (article.unpublished_at && article.status !== 'published') {
    rows.push({
      label: tc('articles.unpublishedLabel'),
      value: formatDateTime(article.unpublished_at),
      actor: article.unpublished_by_name,
    })
  }

  if (!rows.length) {
    rows.push({
      label: tc('articles.publishedLabel'),
      value: tc('articles.neverPublished'),
      actor: null,
    })
  }

  return rows
}

const statusOptions = computed(() => [
  { label: tc('articles.allStatuses'), value: '' },
  { label: tc('common.draft'), value: 'draft' },
  { label: tc('common.published'), value: 'published' },
  { label: tc('common.archived'), value: 'archived' },
])
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('articles.kicker')"
      icon="lucide:file-text"
      :title="tc('articles.listTitle')"
      :description="tc('articles.listDescription')"
    >
      <template #actions>
        <NuxtLink to="/console/articles/create" class="ca-btn-primary">
          <Icon name="lucide:plus" class="h-4 w-4" />
          {{ tc('articles.createAction') }}
        </NuxtLink>
      </template>
    </ConsolePageHeader>

    <!-- Filters -->
    <div class="ca-console-toolbar">
      <div class="flex-1">
        <BaseInput
          id="search"
          v-model="searchQuery"
          :placeholder="tc('articles.searchPlaceholder')"
          icon="lucide:search"
        />
      </div>
      <div class="w-full sm:w-48">
        <SearchSelect
          id="status-filter"
          v-model="statusFilter"
          :placeholder="tc('articles.allStatuses')"
          :options="statusOptions"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm text-[var(--ca-muted)]">Memuat artikel...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="ca-card p-6 text-center">
      <p class="text-sm text-rose-400">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="ca-card p-10 text-center">
      <Icon name="lucide:file-text" class="mx-auto h-12 w-12 text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm text-[var(--ca-muted)]">{{ tc('articles.empty') }}</p>
      <NuxtLink to="/console/articles/create" class="ca-btn-primary mt-4">{{ tc('articles.createFirst') }}</NuxtLink>
    </div>

    <!-- Table -->
    <div v-else class="ca-console-table-wrap">
      <table class="ca-console-table">
        <thead class="sticky top-0 z-10">
          <tr>
            <th>{{ tc('articles.titleField') }}</th>
            <th>{{ tc('common.status') }}</th>
            <th>{{ tc('articles.timestampsLabel') }}</th>
            <th>{{ tc('articles.publishActivityLabel') }}</th>
            <th class="text-right">{{ tc('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in items" :key="article.id">
            <td class="align-top">
              <NuxtLink :to="`/console/articles/${article.id}`" class="text-sm font-medium text-[var(--ca-text)] hover:ca-tone-gold transition">
                {{ article.title }}
              </NuxtLink>
              <p class="mt-0.5 text-xs text-[var(--ca-subtle)]">/artikel/{{ article.slug }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem]">
                <span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 py-0.5 font-semibold uppercase tracking-[0.08em] text-[var(--ca-muted)]">
                  {{ article.category }}
                </span>
                <span class="text-[var(--ca-subtle)]">{{ article.author }}</span>
                <span
                  v-if="article.ai_generated_at"
                  class="rounded-full bg-[var(--ca-kicker-bg)] px-2 py-0.5 font-semibold uppercase tracking-[0.08em] text-brand-primary"
                >
                  {{ tc('articles.aiDraft') }}
                </span>
                <span v-if="article.ai_generated_at" class="text-[var(--ca-subtle)]">{{ aiSourceLabel(article) }}</span>
              </div>
            </td>
            <td class="align-top">
              <span class="rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase" :class="statusColor(article.status)">
                {{ statusLabel(article.status) }}
              </span>
            </td>
            <td class="align-top">
              <div class="space-y-2">
                <div
                  v-for="item in timestampItems(article)"
                  :key="`${article.id}-${item.label}`"
                  class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-3 py-2"
                >
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">{{ item.label }}</p>
                  <p class="mt-1 text-xs text-[var(--ca-text)]">{{ item.value }}</p>
                  <p v-if="item.meta" class="mt-1 text-[0.68rem] text-[var(--ca-muted)]">{{ item.meta }}</p>
                  <p v-if="item.actor" class="mt-1 text-[0.68rem] text-[var(--ca-muted)]">{{ tc('articles.byUser', { name: item.actor }) }}</p>
                </div>
              </div>
            </td>
            <td class="align-top">
              <div class="space-y-2">
                <div
                  v-for="item in publishActivityItems(article)"
                  :key="`${article.id}-${item.label}-${item.value}`"
                  class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-3 py-2"
                >
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">{{ item.label }}</p>
                  <p class="mt-1 text-xs text-[var(--ca-text)]">{{ item.value }}</p>
                  <p v-if="item.actor" class="mt-1 text-[0.68rem] text-[var(--ca-muted)]">{{ tc('articles.byUser', { name: item.actor }) }}</p>
                </div>
              </div>
            </td>
            <td class="align-top text-right">
              <div class="flex items-center justify-end gap-1">
                <CaTooltip :text="tc('common.edit')" position="bottom">
                  <NuxtLink :to="`/console/articles/${article.id}`" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]">
                    <Icon name="lucide:edit-3" class="h-4 w-4" />
                  </NuxtLink>
                </CaTooltip>
                <CaTooltip v-if="article.status === 'draft' && can('articles:publish')" :text="tc('common.publish')" position="bottom">
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10"
                    @click="handlePublish(article.id)"
                  >
                    <Icon name="lucide:upload" class="h-4 w-4" />
                  </button>
                </CaTooltip>
                <CaTooltip v-if="article.status === 'published' && can('articles:publish')" :text="tc('common.unpublish')" position="bottom">
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/10"
                    @click="handleUnpublish(article.id)"
                  >
                    <Icon name="lucide:download" class="h-4 w-4" />
                  </button>
                </CaTooltip>
                <CaTooltip v-if="can('articles:delete')" :text="tc('common.delete')" position="bottom">
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                    @click="handleDelete(article.id, article.title)"
                  >
                    <Icon name="lucide:trash-2" class="h-4 w-4" />
                  </button>
                </CaTooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalItems > 10" class="mt-4 flex items-center justify-between">
        <p class="text-xs text-[var(--ca-muted)]">{{ tc('common.totalArticles', { count: totalItems }) }}</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="ca-btn-secondary !px-3 !py-1.5 text-xs"
            :disabled="currentPage <= 1"
            @click="fetchArticles(currentPage - 1, { search: searchQuery, status: statusFilter })"
          >{{ tc('audit.previous') }}</button>
          <button
            type="button"
            class="ca-btn-secondary !px-3 !py-1.5 text-xs"
            :disabled="currentPage * 10 >= totalItems"
            @click="fetchArticles(currentPage + 1, { search: searchQuery, status: statusFilter })"
          >{{ tc('audit.next') }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showDeleteConfirm = false">
        <div class="ca-console-dialog w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">{{ tc('articles.deleteTitle') }}</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ tc('articles.deleteDescription', { title: deletingTitle }) }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showDeleteConfirm = false">{{ tc('common.cancel') }}</button>
            <button type="button" class="ca-btn-danger !px-4 !py-2.5" @click="confirmDelete">{{ tc('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
