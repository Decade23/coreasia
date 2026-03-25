<script setup lang="ts">
import type { KeywordDomain, KeywordSuggestion } from '~/composables/useKeywords'

definePageMeta({ layout: 'console', middleware: 'console' })

const { items, total, loading, saving, error, stats, fetchKeywords, fetchStats, createKeyword, createBatch, updateKeyword, deleteKeyword, suggestKeywords } = useKeywords()
const { can } = usePermissions()
const { tc } = useConsoleI18n()

const showFormModal = ref(false)
const showDeleteConfirm = ref(false)
const showSuggestModal = ref(false)
const showReviewModal = ref(false)
const editingKeyword = ref<KeywordDomain | null>(null)
const deletingKeyword = ref<KeywordDomain | null>(null)

const currentPage = ref(1)
const filterStatus = ref('')
const filterCategory = ref('')
const searchQuery = ref('')

const formData = ref({
  keyword: '',
  category: 'seo',
  search_volume: null as number | null,
  difficulty: null as number | null,
  priority: 5,
})

const suggestForm = ref({
  niche: 'jasa pembuatan website indonesia',
  category: '',
  count: 10,
})

const suggestions = ref<KeywordSuggestion[]>([])
const selectedSuggestions = ref<Set<number>>(new Set())

const categoryOptions = computed(() => [
  { label: tc('keywords.categories.seo'), value: 'seo' },
  { label: tc('keywords.categories.teknologi'), value: 'teknologi' },
  { label: tc('keywords.categories.bisnis'), value: 'bisnis' },
  { label: tc('keywords.categories.marketing'), value: 'marketing' },
  { label: tc('keywords.categories.edukasi'), value: 'edukasi' },
  { label: tc('keywords.categories.general'), value: 'general' },
])

const statusOptions = computed(() => [
  { label: tc('common.all'), value: '' },
  { label: tc('keywords.statuses.active'), value: 'active' },
  { label: tc('keywords.statuses.used'), value: 'used' },
  { label: tc('keywords.statuses.paused'), value: 'paused' },
])

const priorityOptions = Array.from({ length: 10 }, (_, i) => ({
  label: `${i + 1}`, value: i + 1,
}))

const loadData = async () => {
  await Promise.all([
    fetchKeywords({
      page: currentPage.value,
      per_page: 20,
      status: filterStatus.value,
      category: filterCategory.value,
      search: searchQuery.value,
    }),
    fetchStats(),
  ])
}

watch([filterStatus, filterCategory, searchQuery], () => {
  currentPage.value = 1
  loadData()
})

onMounted(() => loadData())

const openCreate = () => {
  editingKeyword.value = null
  formData.value = { keyword: '', category: 'seo', search_volume: null, difficulty: null, priority: 5 }
  showFormModal.value = true
}

const openEdit = (kw: KeywordDomain) => {
  editingKeyword.value = kw
  formData.value = {
    keyword: kw.keyword,
    category: kw.category,
    search_volume: kw.search_volume,
    difficulty: kw.difficulty,
    priority: kw.priority,
  }
  showFormModal.value = true
}

const handleSubmit = async () => {
  let success: boolean
  if (editingKeyword.value) {
    success = await updateKeyword(editingKeyword.value.id, formData.value)
  } else {
    success = await createKeyword(formData.value)
  }
  if (success) {
    showFormModal.value = false
    loadData()
  }
}

const confirmDelete = (kw: KeywordDomain) => {
  deletingKeyword.value = kw
  showDeleteConfirm.value = true
}

const handleDelete = async () => {
  if (!deletingKeyword.value) return
  const success = await deleteKeyword(deletingKeyword.value.id)
  if (success) {
    showDeleteConfirm.value = false
    deletingKeyword.value = null
    loadData()
  }
}

const toggleStatus = async (kw: KeywordDomain) => {
  const newStatus = kw.status === 'active' ? 'paused' : 'active'
  const success = await updateKeyword(kw.id, { status: newStatus })
  if (success) loadData()
}

const openSuggest = () => {
  suggestForm.value = { niche: 'jasa pembuatan website indonesia', category: '', count: 10 }
  suggestions.value = []
  selectedSuggestions.value = new Set()
  showSuggestModal.value = true
}

const handleSuggest = async () => {
  const result = await suggestKeywords(suggestForm.value)
  if (result.length) {
    suggestions.value = result
    selectedSuggestions.value = new Set(result.map((_, i) => i))
    showSuggestModal.value = false
    showReviewModal.value = true
  }
}

const toggleSuggestionSelection = (idx: number) => {
  const s = new Set(selectedSuggestions.value)
  if (s.has(idx)) s.delete(idx)
  else s.add(idx)
  selectedSuggestions.value = s
}

const handleAddSuggestions = async () => {
  const selected = [...selectedSuggestions.value].map(i => suggestions.value[i])
  const batch = selected.map(s => ({
    keyword: s.keyword,
    category: s.category || 'seo',
    search_volume: s.search_volume_estimate || null,
    difficulty: s.difficulty_estimate || null,
    priority: 5,
  }))
  const success = await createBatch(batch, 'ai_suggested')
  if (success) {
    showReviewModal.value = false
    loadData()
  }
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'active': return 'ca-pill-emerald'
    case 'used': return 'ca-pill-blue'
    case 'paused': return 'ca-pill-muted'
    default: return 'ca-pill-muted'
  }
}

const totalPages = computed(() => Math.ceil(total.value / 20))
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('keywords.kicker')"
      icon="lucide:tag"
      :title="tc('keywords.title')"
      :description="tc('keywords.description')"
    >
      <template #actions>
        <button v-if="can('keywords:ai_suggest')" class="ca-btn-secondary text-sm" @click="openSuggest">
          <Icon name="lucide:sparkles" class="h-4 w-4" />
          {{ tc('keywords.aiSuggest') }}
        </button>
        <button v-if="can('keywords:create')" class="ca-btn-primary text-sm" @click="openCreate">
          <Icon name="lucide:plus" class="h-4 w-4" />
          {{ tc('keywords.add') }}
        </button>
      </template>
    </ConsolePageHeader>

    <!-- Stats -->
    <div v-if="stats" class="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
      <div class="ca-card-soft p-4 text-center">
        <p class="text-2xl font-bold text-[var(--ca-text)]">{{ stats.total }}</p>
        <p class="text-xs text-[var(--ca-muted)]">Total</p>
      </div>
      <div class="ca-card-soft p-4 text-center">
        <p class="text-2xl font-bold ca-tone-emerald">{{ stats.active }}</p>
        <p class="text-xs text-[var(--ca-muted)]">{{ tc('keywords.statuses.active') }}</p>
      </div>
      <div class="ca-card-soft p-4 text-center">
        <p class="text-2xl font-bold ca-tone-blue">{{ stats.used }}</p>
        <p class="text-xs text-[var(--ca-muted)]">{{ tc('keywords.statuses.used') }}</p>
      </div>
      <div class="ca-card-soft p-4 text-center">
        <p class="text-2xl font-bold text-[var(--ca-subtle)]">{{ stats.paused }}</p>
        <p class="text-xs text-[var(--ca-muted)]">{{ tc('keywords.statuses.paused') }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <BaseInput
        id="kw-search"
        v-model="searchQuery"
        :placeholder="tc('common.search')"
        class="sm:max-w-xs"
      />
      <SearchSelect
        id="kw-status"
        v-model="filterStatus"
        :options="statusOptions"
        :placeholder="tc('keywords.filterStatus')"
      />
      <SearchSelect
        id="kw-category"
        v-model="filterCategory"
        :options="[{ label: tc('common.all'), value: '' }, ...categoryOptions]"
        :placeholder="tc('keywords.filterCategory')"
      />
    </div>

    <!-- Loading / Empty / List -->
    <div v-if="loading" class="ca-card p-8 text-center">
      <p class="text-sm text-[var(--ca-muted)]">{{ tc('common.loading') }}</p>
    </div>

    <div v-else-if="!items.length" class="ca-card p-8 text-center">
      <Icon name="lucide:tag" class="mx-auto h-10 w-10 text-[var(--ca-subtle)]" />
      <p class="mt-3 text-sm font-medium text-[var(--ca-text)]">{{ tc('keywords.empty') }}</p>
      <button v-if="can('keywords:create')" class="ca-btn-primary mt-4 text-sm" @click="openCreate">
        {{ tc('keywords.emptyAction') }}
      </button>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="kw in items"
        :key="kw.id"
        class="ca-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm font-semibold text-[var(--ca-text)] truncate">{{ kw.keyword }}</h3>
            <span :class="statusBadgeClass(kw.status)" class="px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider rounded-full">
              {{ tc(`keywords.statuses.${kw.status}`) }}
            </span>
            <span class="ca-pill-muted px-2 py-0.5 text-[0.65rem] rounded-full">
              {{ tc(`keywords.categories.${kw.category}`) || kw.category }}
            </span>
          </div>
          <div class="mt-1 flex items-center gap-4 text-xs text-[var(--ca-muted)]">
            <span>{{ tc('keywords.priority') }}: {{ kw.priority }}</span>
            <span v-if="kw.search_volume">Vol: {{ kw.search_volume?.toLocaleString() }}</span>
            <span v-if="kw.difficulty">Diff: {{ kw.difficulty }}</span>
            <span>{{ tc('keywords.usageCount') }}: {{ kw.usage_count }}</span>
            <span class="ca-pill-muted px-1.5 py-0.5 rounded text-[0.6rem]">{{ tc(`keywords.sources.${kw.source}`) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            v-if="can('keywords:update')"
            class="ca-btn-ghost text-xs px-2 py-1"
            @click="toggleStatus(kw)"
          >
            <Icon :name="kw.status === 'active' ? 'lucide:pause' : 'lucide:play'" class="h-3.5 w-3.5" />
          </button>
          <button
            v-if="can('keywords:update')"
            class="ca-btn-ghost text-xs px-2 py-1"
            @click="openEdit(kw)"
          >
            <Icon name="lucide:pencil" class="h-3.5 w-3.5" />
          </button>
          <button
            v-if="can('keywords:delete')"
            class="ca-btn-ghost text-xs px-2 py-1 text-red-500"
            @click="confirmDelete(kw)"
          >
            <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
        <button
          :disabled="currentPage <= 1"
          class="ca-btn-ghost text-xs px-3 py-1"
          @click="currentPage--; loadData()"
        >
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
        </button>
        <span class="text-xs text-[var(--ca-muted)]">{{ currentPage }} / {{ totalPages }}</span>
        <button
          :disabled="currentPage >= totalPages"
          class="ca-btn-ghost text-xs px-3 py-1"
          @click="currentPage++; loadData()"
        >
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <ConsoleModal
      :show="showFormModal"
      :title="editingKeyword ? tc('keywords.formEdit') : tc('keywords.formCreate')"
      @close="showFormModal = false"
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          id="kw-keyword"
          v-model="formData.keyword"
          :label="tc('keywords.keyword')"
          placeholder="jasa pembuatan web profesional"
          required
        />
        <SearchSelect
          id="kw-category"
          v-model="formData.category"
          :options="categoryOptions"
          :label="tc('keywords.category')"
          required
        />
        <div class="grid grid-cols-3 gap-3">
          <BaseInput
            id="kw-priority"
            v-model.number="formData.priority"
            :label="tc('keywords.priority')"
            type="number"
            :min="1"
            :max="10"
          />
          <BaseInput
            id="kw-volume"
            v-model.number="formData.search_volume"
            :label="tc('keywords.searchVolume')"
            type="number"
            :min="0"
          />
          <BaseInput
            id="kw-diff"
            v-model.number="formData.difficulty"
            :label="tc('keywords.difficulty')"
            type="number"
            :min="0"
            :max="100"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="ca-btn-secondary text-sm" @click="showFormModal = false">
            {{ tc('common.cancel') }}
          </button>
          <button type="submit" class="ca-btn-primary text-sm" :disabled="saving">
            {{ saving ? tc('common.processing') : tc('keywords.save') }}
          </button>
        </div>
      </form>
    </ConsoleModal>

    <!-- Delete Confirm Modal -->
    <ConsoleModal
      :show="showDeleteConfirm"
      :title="tc('keywords.deleteTitle')"
      @close="showDeleteConfirm = false"
    >
      <p class="text-sm text-[var(--ca-muted)]">
        {{ tc('keywords.deleteDescription').replace('{{name}}', deletingKeyword?.keyword || '') }}
      </p>
      <div class="flex justify-end gap-3 pt-4">
        <button class="ca-btn-secondary text-sm" @click="showDeleteConfirm = false">
          {{ tc('common.cancel') }}
        </button>
        <button class="ca-btn-danger text-sm" :disabled="saving" @click="handleDelete">
          {{ saving ? tc('common.processing') : tc('common.yesDelete') }}
        </button>
      </div>
    </ConsoleModal>

    <!-- AI Suggest Modal -->
    <ConsoleModal
      :show="showSuggestModal"
      :title="tc('keywords.aiSuggestTitle')"
      @close="showSuggestModal = false"
    >
      <p class="text-sm text-[var(--ca-muted)] mb-4">{{ tc('keywords.aiSuggestDesc') }}</p>
      <form class="space-y-4" @submit.prevent="handleSuggest">
        <BaseInput
          id="suggest-niche"
          v-model="suggestForm.niche"
          :label="tc('keywords.niche')"
          :placeholder="tc('keywords.nichePlaceholder')"
          required
        />
        <SearchSelect
          id="suggest-category"
          v-model="suggestForm.category"
          :options="[{ label: tc('common.all'), value: '' }, ...categoryOptions]"
          :label="tc('keywords.category')"
        />
        <BaseInput
          id="suggest-count"
          v-model.number="suggestForm.count"
          :label="tc('keywords.suggestCount')"
          type="number"
          :min="1"
          :max="30"
        />
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="ca-btn-secondary text-sm" @click="showSuggestModal = false">
            {{ tc('common.cancel') }}
          </button>
          <button type="submit" class="ca-btn-primary text-sm" :disabled="saving">
            <Icon v-if="saving" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
            {{ saving ? tc('keywords.generating') : tc('keywords.generate') }}
          </button>
        </div>
      </form>
    </ConsoleModal>

    <!-- Review Suggestions Modal -->
    <ConsoleModal
      :show="showReviewModal"
      :title="tc('keywords.reviewTitle')"
      size="lg"
      @close="showReviewModal = false"
    >
      <div class="space-y-2 max-h-[60vh] overflow-y-auto">
        <div
          v-for="(s, idx) in suggestions"
          :key="idx"
          class="ca-card-soft p-3 cursor-pointer transition"
          :class="selectedSuggestions.has(idx) ? 'border-[color:var(--ca-gold-border)]' : ''"
          @click="toggleSuggestionSelection(idx)"
        >
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="selectedSuggestions.has(idx)"
              class="h-4 w-4 rounded"
              @click.stop="toggleSuggestionSelection(idx)"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-[var(--ca-text)]">{{ s.keyword }}</p>
              <div class="flex items-center gap-3 mt-1 text-xs text-[var(--ca-muted)]">
                <span>{{ tc(`keywords.categories.${s.category}`) || s.category }}</span>
                <span>{{ tc('keywords.volumeEstimate') }}: {{ s.search_volume_estimate }}</span>
                <span>{{ tc('keywords.difficultyEstimate') }}: {{ s.difficulty_estimate }}</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ s.rationale }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center pt-4">
        <span class="text-xs text-[var(--ca-muted)]">{{ selectedSuggestions.size }} / {{ suggestions.length }}</span>
        <div class="flex gap-3">
          <button class="ca-btn-secondary text-sm" @click="showReviewModal = false">
            {{ tc('common.cancel') }}
          </button>
          <button
            class="ca-btn-primary text-sm"
            :disabled="saving || !selectedSuggestions.size"
            @click="handleAddSuggestions"
          >
            {{ saving ? tc('common.processing') : tc('keywords.addSelected') }}
          </button>
        </div>
      </div>
    </ConsoleModal>
  </div>
</template>
