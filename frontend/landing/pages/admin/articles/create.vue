<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

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

const showPreview = ref(false)
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
  if (ok) navigateTo('/admin/articles')
}

// AI modal state
const aiTopic = ref('')
const aiKeywords = ref('')
const aiTone = ref('professional')
const aiLanguage = ref('id')
const aiWordCount = ref(1000)
const aiCategory = ref('general')
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <NuxtLink to="/admin/articles" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]">
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
          <button type="button" class="ca-btn-secondary text-sm" @click="showPreview = !showPreview">
            <Icon :name="showPreview ? 'lucide:edit-3' : 'lucide:eye'" class="h-4 w-4" />
            {{ showPreview ? 'Edit' : 'Preview' }}
          </button>
        </div>

        <div class="space-y-4">
          <BaseInput id="title" v-model="form.title" label="Judul" placeholder="Judul artikel" required />
          <BaseInput id="slug" v-model="form.slug" label="Slug" placeholder="judul-artikel" required />

          <BaseTextarea id="description" v-model="form.description" label="Deskripsi" placeholder="Ringkasan singkat untuk meta description" rows="2" required />

          <!-- Content editor / preview -->
          <div>
            <label class="ca-field-label">Konten <span class="ca-required">*</span></label>
            <div v-if="!showPreview">
              <textarea
                v-model="form.content"
                class="ca-field-control min-h-[400px] border-[color:var(--ca-border)] focus:border-amber-300/40 font-mono text-sm"
                placeholder="Tulis konten dalam Markdown..."
                required
              />
              <p class="mt-1 text-xs text-[var(--ca-subtle)]">Mendukung Markdown: ## Heading, **bold**, [link](url), - list</p>
            </div>
            <div v-else class="min-h-[400px] rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-5">
              <div class="prose-sm text-[var(--ca-muted)]" v-html="form.content.replace(/^### (.+)$/gm, '<h3 class=\'mt-4 mb-2 font-bold text-[var(--ca-text)]\'>$1</h3>').replace(/^## (.+)$/gm, '<h2 class=\'mt-6 mb-2 text-lg font-bold text-[var(--ca-text)]\'>$1</h2>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '<br><br>')" />
            </div>
          </div>

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
          <NuxtLink to="/admin/articles" class="ca-btn-secondary">Batal</NuxtLink>
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
          <div class="mt-4 space-y-3">
            <BaseInput id="ai-topic" v-model="aiTopic" label="Topik" placeholder="Apa topik artikel yang ingin digenerate?" required />
            <BaseInput id="ai-keywords" v-model="aiKeywords" label="Keywords" placeholder="seo, web monitoring, bisnis digital" />
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="ca-field-label">Gaya Penulisan</label>
                <select v-model="aiTone" class="ca-field-control border-[color:var(--ca-border)]">
                  <option value="professional">Profesional</option>
                  <option value="casual">Kasual</option>
                  <option value="informative">Informatif</option>
                </select>
              </div>
              <div>
                <label class="ca-field-label">Bahasa</label>
                <select v-model="aiLanguage" class="ca-field-control border-[color:var(--ca-border)]">
                  <option value="id">Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
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
