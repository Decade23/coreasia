<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const route = useRoute()
const id = route.params.id as string
const { currentItem, loading, saving, error, fetchArticle, updateArticle, publishArticle, unpublishArticle } = useArticles()
const { uploadImage, uploading } = useImageUpload()
const toast = useToast()

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

const showPublishConfirm = ref(false)
const showUnpublishConfirm = ref(false)

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
  if (ok) {
    await fetchArticle(id)
    toast.success('Perubahan berhasil disimpan')
  }
}

const handlePublish = async () => {
  showPublishConfirm.value = false
  const ok = await publishArticle(id)
  if (ok) await fetchArticle(id)
}

const handleUnpublish = async () => {
  showUnpublishConfirm.value = false
  const ok = await unpublishArticle(id)
  if (ok) await fetchArticle(id)
}

const statusColor = (status: string) => {
  if (status === 'published') return 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20'
  return 'bg-slate-500/10 text-[var(--ca-muted)] border-[var(--ca-border)]'
}

const statusLabel = (status: string) => {
  if (status === 'published') return 'Published'
  return 'Draft'
}

const formatDate = (d: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <NuxtLink to="/console/articles" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]">
        <Icon name="lucide:arrow-left" class="h-5 w-5" />
      </NuxtLink>
      <div class="flex-1">
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Edit Artikel</h1>
        <p v-if="currentItem" class="mt-1 text-sm text-[var(--ca-muted)]">{{ currentItem.title }}</p>
      </div>
    </div>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <template v-else-if="currentItem">
      <!-- Status Bar -->
      <div class="mx-auto max-w-4xl mb-4">
        <div class="ca-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase" :class="statusColor(currentItem.status)">
              {{ statusLabel(currentItem.status) }}
            </span>
            <span v-if="currentItem.published_at" class="text-xs text-[var(--ca-muted)]">
              Dipublikasikan: {{ formatDate(currentItem.published_at) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="currentItem.status === 'draft'"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              :disabled="saving"
              @click="showPublishConfirm = true"
            >
              <Icon name="lucide:globe" class="h-3.5 w-3.5" />
              Publish
            </button>
            <button
              v-if="currentItem.status === 'published'"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--ca-border)] px-3 py-1.5 text-sm font-semibold text-[var(--ca-muted)] transition hover:bg-[var(--ca-panel-bg-strong)]"
              :disabled="saving"
              @click="showUnpublishConfirm = true"
            >
              <Icon name="lucide:eye-off" class="h-3.5 w-3.5" />
              Unpublish
            </button>
          </div>
        </div>
      </div>

      <form class="mx-auto max-w-4xl" @submit.prevent="handleSubmit">
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
    </template>

    <!-- Publish Confirm Modal -->
    <Teleport to="body">
      <div v-if="showPublishConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showPublishConfirm = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:globe" class="mr-2 inline h-5 w-5 text-emerald-400" />
            Publish Artikel?
          </h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">
            Artikel <strong>{{ currentItem?.title }}</strong> akan ditampilkan di halaman publik dan bisa diakses oleh pengunjung.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showPublishConfirm = false">Batal</button>
            <button type="button" class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600" :disabled="saving" @click="handlePublish">
              {{ saving ? 'Publishing...' : 'Publish' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Unpublish Confirm Modal -->
    <Teleport to="body">
      <div v-if="showUnpublishConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showUnpublishConfirm = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:eye-off" class="mr-2 inline h-5 w-5 text-amber-400" />
            Unpublish Artikel?
          </h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">
            Artikel <strong>{{ currentItem?.title }}</strong> akan dikembalikan ke draft dan tidak tampil di halaman publik.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showUnpublishConfirm = false">Batal</button>
            <button type="button" class="ca-btn-primary" :disabled="saving" @click="handleUnpublish">
              {{ saving ? 'Processing...' : 'Unpublish' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
