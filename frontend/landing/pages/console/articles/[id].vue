<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const route = useRoute()
const id = route.params.id as string
const { currentItem, loading, saving, error, fetchArticle, updateArticle } = useArticles()
const { uploadImage, uploading } = useImageUpload()

const form = ref({
  title: '',
  slug: '',
  description: '',
  content: '',
  category: '',
  tags: '',
  author: '',
  read_time: 5,
  featured_image: '',
  seo_title: '',
  seo_description: '',
})

onMounted(async () => {
  await fetchArticle(id)
  if (currentItem.value) {
    form.value = {
      title: currentItem.value.title,
      slug: currentItem.value.slug,
      description: currentItem.value.description,
      content: currentItem.value.content,
      category: currentItem.value.category,
      tags: currentItem.value.tags?.join(', ') || '',
      author: currentItem.value.author,
      read_time: currentItem.value.read_time,
      featured_image: currentItem.value.featured_image || '',
      seo_title: currentItem.value.seo_title || '',
      seo_description: currentItem.value.seo_description || '',
    }
  }
})

const handleImageUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const url = await uploadImage(file)
  if (url) form.value.featured_image = url
}

const handleSubmit = async () => {
  const data = {
    ...form.value,
    tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    featured_image: form.value.featured_image || null,
    seo_title: form.value.seo_title || null,
    seo_description: form.value.seo_description || null,
  }
  const ok = await updateArticle(id, data)
  if (ok) navigateTo('/console/articles')
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <NuxtLink to="/console/articles" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]">
        <Icon name="lucide:arrow-left" class="h-5 w-5" />
      </NuxtLink>
      <div>
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Edit Artikel</h1>
        <p v-if="currentItem" class="mt-1 text-sm text-[var(--ca-muted)]">{{ currentItem.title }}</p>
      </div>
    </div>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <form v-else class="mx-auto max-w-4xl" @submit.prevent="handleSubmit">
      <div class="ca-card p-6">
        <div class="space-y-4">
          <BaseInput id="title" v-model="form.title" label="Judul" placeholder="Judul artikel" required />
          <BaseInput id="slug" v-model="form.slug" label="Slug" placeholder="judul-artikel" required />
          <BaseTextarea id="description" v-model="form.description" label="Deskripsi" rows="2" required />

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
            <BaseInput id="category" v-model="form.category" label="Kategori" required />
            <BaseInput id="tags" v-model="form.tags" label="Tags" placeholder="seo, web, bisnis" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput id="author" v-model="form.author" label="Penulis" />
            <BaseInput id="read_time" v-model.number="form.read_time" label="Waktu Baca (menit)" type="number" />
          </div>

          <div>
            <label class="ca-field-label">Featured Image</label>
            <div class="flex items-center gap-3">
              <input type="file" accept="image/jpeg,image/png,image/webp" class="ca-field-control border-[color:var(--ca-border)] text-sm" @change="handleImageUpload" />
              <span v-if="uploading" class="text-xs text-[var(--ca-muted)]">Mengupload...</span>
            </div>
            <img v-if="form.featured_image" :src="form.featured_image" class="mt-2 h-32 rounded-lg object-cover" />
          </div>

          <details class="rounded-xl border border-[color:var(--ca-border)] p-4">
            <summary class="cursor-pointer text-sm font-semibold text-[var(--ca-muted)]">SEO Settings</summary>
            <div class="mt-3 space-y-3">
              <BaseInput id="seo_title" v-model="form.seo_title" label="SEO Title" />
              <BaseTextarea id="seo_description" v-model="form.seo_description" label="SEO Description" rows="2" />
            </div>
          </details>
        </div>

        <p v-if="error" class="mt-3 text-sm text-rose-400">{{ error }}</p>

        <div class="mt-6 flex justify-end gap-3">
          <NuxtLink to="/console/articles" class="ca-btn-secondary">Batal</NuxtLink>
          <button type="submit" class="ca-btn-primary" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
