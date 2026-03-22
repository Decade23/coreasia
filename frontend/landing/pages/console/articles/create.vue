<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { createArticle, saving, error } = useArticles()
const { generateArticle, generating, error: aiError } = useAIGenerate()
const { uploadImage, uploading } = useImageUpload()

const form = ref({
  title: '',
  slug: '',
  description: '',
  content: '',
  category: 'general',
  tags: '',
  author: 'Tim CoreAsia',
  read_time: 5,
  status: 'draft',
  featured_image: '',
  seo_title: '',
  seo_description: '',
})

const showAIModal = ref(false)

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

watch(() => form.value.title, (val) => {
  if (!form.value.slug || form.value.slug === slugify(form.value.title.slice(0, -1))) {
    form.value.slug = slugify(val)
  }
})

const handleImageUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const url = await uploadImage(file)
  if (url) form.value.featured_image = url
}

const handleAIGenerate = async (params: any) => {
  const result = await generateArticle(params)
  if (result) {
    form.value.title = result.title
    form.value.slug = result.slug
    form.value.description = result.description
    form.value.content = result.content
    form.value.tags = result.tags.join(', ')
    form.value.read_time = result.read_time
    form.value.seo_title = result.title
    form.value.seo_description = result.description
    form.value.category = params.category || form.value.category
    showAIModal.value = false
  }
}

const handleSubmit = async () => {
  const data = {
    ...form.value,
    tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    featured_image: form.value.featured_image || null,
    seo_title: form.value.seo_title || null,
    seo_description: form.value.seo_description || null,
  }
  const ok = await createArticle(data)
  if (ok) navigateTo('/console/articles')
}

// AI modal state
const aiTopic = ref('')
const aiKeywords = ref('')
const aiTone = ref('professional')
const aiLanguage = ref('id')
const aiWordCount = ref(1000)
const aiCategory = ref('general')

// Topic suggestions based on CoreAsia services
const topicSuggestions = [
  { topic: 'Cara Meningkatkan SEO Website Bisnis di 2026', keywords: 'seo, website, bisnis, ranking google', category: 'seo' },
  { topic: 'Panduan Memilih Software House di Indonesia', keywords: 'software house, vendor IT, development', category: 'bisnis' },
  { topic: 'Apa Itu Web Monitoring dan Mengapa Bisnis Membutuhkannya', keywords: 'web monitoring, uptime, performa website', category: 'teknologi' },
  { topic: 'Tips Membangun Landing Page yang Konversi Tinggi', keywords: 'landing page, konversi, CTA, desain web', category: 'marketing' },
  { topic: 'Keuntungan Menggunakan LMS untuk Training Karyawan', keywords: 'lms, e-learning, training, HR', category: 'edukasi' },
  { topic: 'Strategi Digital Marketing untuk UMKM 2026', keywords: 'digital marketing, umkm, sosial media, ads', category: 'marketing' },
  { topic: 'Pentingnya Website Responsif untuk Bisnis Modern', keywords: 'responsive design, mobile first, UX', category: 'teknologi' },
  { topic: 'Cara Mengukur Performa Website dengan Google Analytics', keywords: 'google analytics, ga4, metrics, data', category: 'analitik' },
]

const applySuggestion = (s: typeof topicSuggestions[0]) => {
  aiTopic.value = s.topic
  aiKeywords.value = s.keywords
  aiCategory.value = s.category
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <NuxtLink to="/console/articles" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]">
        <Icon name="lucide:arrow-left" class="h-5 w-5" />
      </NuxtLink>
      <div>
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Buat Artikel</h1>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">Tulis artikel baru atau generate dengan AI</p>
      </div>
    </div>

    <form class="mx-auto max-w-4xl" @submit.prevent="handleSubmit">
      <div class="ca-card p-6">
        <!-- Actions bar -->
        <div class="mb-6 flex flex-wrap gap-2">
          <button type="button" class="ca-btn-secondary text-sm" @click="showAIModal = true">
            <Icon name="lucide:sparkles" class="h-4 w-4" />
            Generate AI
          </button>
        </div>

        <div class="space-y-4">
          <BaseInput id="title" v-model="form.title" label="Judul" placeholder="Judul artikel" required />
          <BaseInput id="slug" v-model="form.slug" label="Slug" placeholder="judul-artikel" required />

          <BaseTextarea id="description" v-model="form.description" label="Deskripsi" placeholder="Ringkasan singkat untuk meta description" rows="2" required />

          <!-- Content WYSIWYG editor -->
          <RichEditor
            id="content"
            v-model="form.content"
            label="Konten"
            placeholder="Tulis konten artikel di sini..."
            min-height="400px"
            required
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput id="category" v-model="form.category" label="Kategori" placeholder="general" required />
            <BaseInput id="tags" v-model="form.tags" label="Tags" placeholder="seo, web, bisnis" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput id="author" v-model="form.author" label="Penulis" placeholder="Tim CoreAsia" />
            <BaseInput id="read_time" v-model.number="form.read_time" label="Waktu Baca (menit)" type="number" />
          </div>

          <!-- Featured Image -->
          <div>
            <label class="ca-field-label">Featured Image</label>
            <div class="flex items-center gap-3">
              <input type="file" accept="image/jpeg,image/png,image/webp" class="ca-field-control border-[color:var(--ca-border)] text-sm" @change="handleImageUpload" />
              <span v-if="uploading" class="text-xs text-[var(--ca-muted)]">Mengupload...</span>
            </div>
            <img v-if="form.featured_image" :src="form.featured_image" class="mt-2 h-32 rounded-lg object-cover" />
          </div>

          <!-- SEO -->
          <details class="rounded-xl border border-[color:var(--ca-border)] p-4">
            <summary class="cursor-pointer text-sm font-semibold text-[var(--ca-muted)]">SEO Settings (opsional)</summary>
            <div class="mt-3 space-y-3">
              <BaseInput id="seo_title" v-model="form.seo_title" label="SEO Title" placeholder="Override title untuk search engine" />
              <BaseTextarea id="seo_description" v-model="form.seo_description" label="SEO Description" placeholder="Override meta description" rows="2" />
            </div>
          </details>
        </div>

        <p v-if="error" class="mt-3 text-sm text-rose-400">{{ error }}</p>

        <div class="mt-6 flex justify-end gap-3">
          <NuxtLink to="/console/articles" class="ca-btn-secondary">Batal</NuxtLink>
          <button type="submit" class="ca-btn-primary" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan Artikel' }}
          </button>
        </div>
      </div>
    </form>

    <!-- AI Generate Modal -->
    <Teleport to="body">
      <div v-if="showAIModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showAIModal = false">
        <div class="ca-card w-full max-w-lg p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:sparkles" class="mr-2 inline h-5 w-5 ca-tone-gold" />
            Generate Artikel dengan AI
          </h3>

          <!-- Topic Suggestions -->
          <div class="mt-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">
              <Icon name="lucide:lightbulb" class="mr-1 inline h-3.5 w-3.5 text-amber-400" />
              Saran Topik
            </p>
            <div class="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
              <button
                v-for="s in topicSuggestions"
                :key="s.topic"
                type="button"
                class="group flex w-full items-start gap-2.5 rounded-lg border border-[color:var(--ca-border)] px-3 py-2 text-left transition hover:border-amber-300/40 hover:bg-[var(--ca-kicker-bg)]"
                :class="aiTopic === s.topic ? 'border-amber-400/50 bg-amber-500/5' : ''"
                @click="applySuggestion(s)"
              >
                <Icon name="lucide:file-text" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ca-subtle)] group-hover:text-amber-400" :class="aiTopic === s.topic ? 'text-amber-400' : ''" />
                <div class="min-w-0">
                  <p class="text-[0.75rem] font-medium leading-snug text-[var(--ca-text)] group-hover:text-brand-primary">{{ s.topic }}</p>
                  <div class="mt-0.5 flex items-center gap-1.5">
                    <span class="rounded bg-[var(--ca-panel-bg-strong)] px-1.5 py-0.5 text-[0.6rem] font-medium text-[var(--ca-subtle)]">{{ s.category }}</span>
                    <span class="text-[0.6rem] text-[var(--ca-subtle)] truncate">{{ s.keywords }}</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div class="mt-4 space-y-3">
            <BaseInput id="ai-topic" v-model="aiTopic" label="Topik" placeholder="Apa topik artikel yang ingin digenerate?" required />
            <BaseInput id="ai-keywords" v-model="aiKeywords" label="Keywords" placeholder="seo, web monitoring, bisnis digital" />
            <div class="grid gap-3 sm:grid-cols-2">
              <SearchSelect
                id="ai-tone"
                v-model="aiTone"
                label="Gaya Penulisan"
                :options="[
                  { label: 'Profesional', value: 'professional' },
                  { label: 'Kasual', value: 'casual' },
                  { label: 'Informatif', value: 'informative' },
                ]"
              />
              <SearchSelect
                id="ai-language"
                v-model="aiLanguage"
                label="Bahasa"
                :options="[
                  { label: 'Indonesia', value: 'id' },
                  { label: 'English', value: 'en' },
                ]"
              />
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <BaseInput id="ai-wordcount" v-model.number="aiWordCount" label="Jumlah Kata" type="number" />
              <BaseInput id="ai-category" v-model="aiCategory" label="Kategori" placeholder="general" />
            </div>
          </div>

          <p v-if="aiError" class="mt-3 text-sm text-rose-400">{{ aiError }}</p>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showAIModal = false">Batal</button>
            <button
              type="button"
              class="ca-btn-primary"
              :disabled="generating || !aiTopic"
              @click="handleAIGenerate({
                topic: aiTopic,
                keywords: aiKeywords.split(',').map(k => k.trim()).filter(Boolean),
                tone: aiTone,
                language: aiLanguage,
                word_count: aiWordCount,
                category: aiCategory,
              })"
            >
              <Icon v-if="generating" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
              {{ generating ? 'Generating...' : 'Generate' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
