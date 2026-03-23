<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { createArticle, publishArticle, saving, error } = useArticles()
const { generateArticle, generating, error: aiError } = useAIGenerate()
const { uploadImage, uploading } = useImageUpload()
const toast = useToast()
const { tc } = useConsoleI18n()

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

const handleImageUpload = async (file: File) => {
  const url = await uploadImage(file)
  if (url) form.value.featured_image = url
}

// AI modal featured image
const aiImageUploading = ref(false)
const handleAIImageUpload = async (file: File) => {
  aiImageUploading.value = true
  const url = await uploadImage(file)
  if (url) form.value.featured_image = url
  aiImageUploading.value = false
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
    if (result.featured_image && !form.value.featured_image) {
      form.value.featured_image = result.featured_image
    }
    showAIModal.value = false
  }
}

const buildFormData = () => ({
  ...form.value,
  tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
  featured_image: form.value.featured_image || null,
  seo_title: form.value.seo_title || null,
  seo_description: form.value.seo_description || null,
})

const handleSubmit = async () => {
  const ok = await createArticle(buildFormData())
  if (ok) navigateTo('/console/articles')
}

const handleSaveAndPublish = async () => {
  const data = buildFormData()
  const api = useAdminApi()
  saving.value = true
  try {
    const res = await api.post<{ id: string }>('/admin/articles', data)
    if (res.data?.id) {
      await publishArticle(res.data.id)
      toast.success(tc('feedback.articleCreatedAndPublished'))
      navigateTo('/console/articles')
    }
  } catch (err: any) {
    toast.error(err?.data?.errors?.message || tc('feedback.articleCreateFailed'))
  } finally {
    saving.value = false
  }
}

// AI modal state
const aiTopic = ref('')
const aiKeywords = ref('')
const aiTone = ref('professional')
const aiLanguage = ref('id')
const aiWordCount = ref(1000)
const aiCategory = ref('general')
const aiAutoImage = ref(false)

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
    <ConsolePageHeader
      :kicker="tc('articles.kicker')"
      icon="lucide:file-pen-line"
      :title="tc('articles.createTitle')"
      :description="tc('articles.createDescription')"
      back-to="/console/articles"
    />

    <form class="mx-auto max-w-5xl" @submit.prevent="handleSubmit">
      <div class="ca-card p-4 sm:p-6">
        <!-- Actions bar -->
        <div class="mb-6 flex flex-wrap gap-2">
          <button type="button" class="ca-btn-secondary text-sm" @click="showAIModal = true">
            <Icon name="lucide:sparkles" class="h-4 w-4" />
            {{ tc('articles.generateAI') }}
          </button>
        </div>

        <div class="space-y-4">
          <BaseInput id="title" v-model="form.title" :label="tc('articles.titleField')" placeholder="Judul artikel" required />
          <BaseInput id="slug" v-model="form.slug" :label="tc('articles.slugField')" placeholder="judul-artikel" required />

          <BaseTextarea id="description" v-model="form.description" :label="tc('articles.descriptionField')" placeholder="Ringkasan singkat untuk meta description" rows="2" required />

          <!-- Content WYSIWYG editor -->
          <RichEditor
            id="content"
            v-model="form.content"
            :label="tc('articles.content')"
            placeholder="Tulis konten artikel di sini..."
            min-height="400px"
            required
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput id="category" v-model="form.category" :label="tc('articles.categoryField')" placeholder="general" required />
            <BaseInput id="tags" v-model="form.tags" :label="tc('articles.tagsField')" placeholder="seo, web, bisnis" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput id="author" v-model="form.author" :label="tc('articles.authorField')" placeholder="Tim CoreAsia" />
            <BaseInput id="read_time" v-model.number="form.read_time" :label="tc('articles.readTimeField')" type="number" />
          </div>

          <!-- Featured Image -->
          <BaseFileInput
            id="featured-image"
            :label="tc('articles.featuredImage')"
            accept="image/jpeg,image/png,image/webp"
            :helper-text="tc('articles.featuredImageHelp')"
            :button-text="tc('common.chooseFile')"
            :loading="uploading"
            :preview-url="form.featured_image || null"
            preview-alt="Featured image preview"
            @select="handleImageUpload"
          />

          <!-- SEO -->
          <details class="rounded-xl border border-[color:var(--ca-border)] p-4">
            <summary class="cursor-pointer text-sm font-semibold text-[var(--ca-muted)]">{{ tc('articles.seoOptional') }}</summary>
            <div class="mt-3 space-y-3">
              <BaseInput id="seo_title" v-model="form.seo_title" label="SEO Title" placeholder="Override title untuk search engine" />
              <BaseTextarea id="seo_description" v-model="form.seo_description" label="SEO Description" placeholder="Override meta description" rows="2" />
            </div>
          </details>
        </div>

        <p v-if="error" class="mt-3 text-sm text-rose-400">{{ error }}</p>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <NuxtLink to="/console/articles" class="ca-btn-secondary">{{ tc('common.cancel') }}</NuxtLink>
          <button type="submit" class="ca-btn-secondary" :disabled="saving">
            <Icon name="lucide:save" class="h-4 w-4" />
            {{ saving ? tc('articles.savingDraft') : tc('articles.saveDraft') }}
          </button>
          <button type="button" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600" :disabled="saving" @click="handleSaveAndPublish">
            <Icon name="lucide:globe" class="h-4 w-4" />
            {{ saving ? tc('articles.publishing') : tc('articles.saveAndPublish') }}
          </button>
        </div>
      </div>
    </form>

    <!-- AI Generate Modal -->
    <Teleport to="body">
      <div v-if="showAIModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showAIModal = false">
        <div class="ca-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:sparkles" class="mr-2 inline h-5 w-5 ca-tone-gold" />
            {{ tc('articles.aiTitle') }}
          </h3>

          <!-- Topic Suggestions -->
          <div class="mt-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">
              <Icon name="lucide:lightbulb" class="mr-1 inline h-3.5 w-3.5 text-amber-400" />
              {{ tc('articles.topicSuggestions') }}
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
            <BaseInput id="ai-topic" v-model="aiTopic" :label="tc('articles.topic')" placeholder="Apa topik artikel yang ingin digenerate?" required />
            <BaseInput id="ai-keywords" v-model="aiKeywords" :label="tc('articles.keywords')" placeholder="seo, web monitoring, bisnis digital" />
            <div class="grid gap-3 sm:grid-cols-2">
              <SearchSelect
                id="ai-tone"
                v-model="aiTone"
                :label="tc('articles.tone')"
                :options="[
                  { label: tc('tones.professional'), value: 'professional' },
                  { label: tc('tones.casual'), value: 'casual' },
                  { label: tc('tones.informative'), value: 'informative' },
                ]"
              />
              <SearchSelect
                id="ai-language"
                v-model="aiLanguage"
                :label="tc('articles.language')"
                :options="[
                  { label: tc('languages.id'), value: 'id' },
                  { label: tc('languages.en'), value: 'en' },
                ]"
              />
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <BaseInput id="ai-wordcount" v-model.number="aiWordCount" :label="tc('articles.wordCount')" type="number" />
              <BaseInput id="ai-category" v-model="aiCategory" :label="tc('articles.categoryField')" placeholder="general" />
            </div>

            <!-- Auto Image Toggle -->
            <BaseSwitch
              id="ai-auto-image"
              v-model="aiAutoImage"
              :label="tc('articles.autoImageTitle')"
              :description="tc('articles.autoImageDesc')"
            />

            <!-- Featured Image Manual Upload -->
            <div v-if="!aiAutoImage">
              <BaseFileInput
                id="ai-featured-image"
                :label="tc('articles.manualImage')"
                :helper-text="tc('articles.manualImageDesc')"
                accept="image/jpeg,image/png,image/webp"
                :button-text="tc('common.chooseFile')"
                :loading="aiImageUploading"
                :preview-url="form.featured_image || null"
                preview-alt="AI image preview"
                @select="handleAIImageUpload"
              />
            </div>
          </div>

          <p v-if="aiError" class="mt-3 text-sm text-rose-400">{{ aiError }}</p>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showAIModal = false">{{ tc('common.cancel') }}</button>
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
                auto_image: aiAutoImage,
              })"
            >
              <Icon v-if="generating" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
              {{ generating ? tc('articles.generating') : tc('articles.generateAI') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
