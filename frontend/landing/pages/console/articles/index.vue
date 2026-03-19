<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { items, loading, error, totalItems, currentPage, fetchArticles, deleteArticle, publishArticle, unpublishArticle } = useArticles()

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

const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Artikel</h1>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">Kelola semua artikel blog</p>
      </div>
      <NuxtLink to="/console/articles/create" class="ca-btn-primary">
        <Icon name="lucide:plus" class="h-4 w-4" />
        Buat Artikel
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row">
      <div class="flex-1">
        <BaseInput
          id="search"
          v-model="searchQuery"
          placeholder="Cari artikel..."
          icon="lucide:search"
        />
      </div>
      <select
        v-model="statusFilter"
        class="ca-field-control border-[color:var(--ca-border)] focus:border-amber-300/40 w-full sm:w-40"
      >
        <option value="">Semua Status</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
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
      <p class="mt-3 text-sm text-[var(--ca-muted)]">Belum ada artikel</p>
      <NuxtLink to="/console/articles/create" class="ca-btn-primary mt-4">Buat Artikel Pertama</NuxtLink>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[color:var(--ca-border)]">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Judul</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Kategori</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Status</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Tanggal</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="article in items"
            :key="article.id"
            class="border-b border-[color:var(--ca-border)] transition hover:bg-[var(--ca-panel-bg)]"
          >
            <td class="px-4 py-3">
              <NuxtLink :to="`/console/articles/${article.id}`" class="text-sm font-medium text-[var(--ca-text)] hover:ca-tone-gold transition">
                {{ article.title }}
              </NuxtLink>
              <p class="mt-0.5 text-xs text-[var(--ca-subtle)]">/artikel/{{ article.slug }}</p>
            </td>
            <td class="px-4 py-3 text-sm text-[var(--ca-muted)]">{{ article.category }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase" :class="statusColor(article.status)">
                {{ article.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-[var(--ca-muted)]">{{ formatDate(article.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <NuxtLink :to="`/console/articles/${article.id}`" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]">
                  <Icon name="lucide:edit-3" class="h-4 w-4" />
                </NuxtLink>
                <button
                  v-if="article.status === 'draft'"
                  type="button"
                  class="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10"
                  title="Publish"
                  @click="handlePublish(article.id)"
                >
                  <Icon name="lucide:upload" class="h-4 w-4" />
                </button>
                <button
                  v-if="article.status === 'published'"
                  type="button"
                  class="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/10"
                  title="Unpublish"
                  @click="handleUnpublish(article.id)"
                >
                  <Icon name="lucide:download" class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                  title="Hapus"
                  @click="handleDelete(article.id, article.title)"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalItems > 10" class="mt-4 flex items-center justify-between">
        <p class="text-xs text-[var(--ca-muted)]">{{ totalItems }} artikel</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="ca-btn-secondary !px-3 !py-1.5 text-xs"
            :disabled="currentPage <= 1"
            @click="fetchArticles(currentPage - 1, { search: searchQuery, status: statusFilter })"
          >Prev</button>
          <button
            type="button"
            class="ca-btn-secondary !px-3 !py-1.5 text-xs"
            :disabled="currentPage * 10 >= totalItems"
            @click="fetchArticles(currentPage + 1, { search: searchQuery, status: statusFilter })"
          >Next</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showDeleteConfirm = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">Hapus Artikel?</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">Apakah Anda yakin ingin menghapus "{{ deletingTitle }}"? Tindakan ini tidak dapat dibatalkan.</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showDeleteConfirm = false">Batal</button>
            <button type="button" class="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600" @click="confirmDelete">Hapus</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
