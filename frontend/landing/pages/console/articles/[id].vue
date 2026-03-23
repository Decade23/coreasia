<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const route = useRoute()
const id = route.params.id as string
const { currentItem, loading, saving, error, fetchArticle, updateArticle, publishArticle, unpublishArticle } = useArticles()
const { uploadImage, uploading } = useImageUpload()
const toast = useToast()
const { tc, dateLocale } = useConsoleI18n()

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

const handleImageUpload = async (file: File) => {
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
    toast.success(tc('feedback.articleUpdated'))
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
  if (status === 'published') return tc('articles.previewStatusPublished')
  return tc('articles.previewStatusDraft')
}

const formatDate = (d: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleString(dateLocale.value, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('articles.kicker')"
      icon="lucide:file-pen-line"
      :title="tc('articles.editTitle')"
      :description="currentItem?.title || tc('articles.listDescription')"
      back-to="/console/articles"
    />

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <template v-else-if="currentItem">
      <!-- Status Bar -->
      <div class="mx-auto mb-4 max-w-5xl">
        <div class="ca-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase" :class="statusColor(currentItem.status)">
              {{ statusLabel(currentItem.status) }}
            </span>
            <span v-if="currentItem.published_at" class="text-xs text-[var(--ca-muted)]">
              {{ tc('articles.publishedAt', { date: formatDate(currentItem.published_at) }) }}
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
              {{ tc('common.publish') }}
            </button>
            <button
              v-if="currentItem.status === 'published'"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--ca-border)] px-3 py-1.5 text-sm font-semibold text-[var(--ca-muted)] transition hover:bg-[var(--ca-panel-bg-strong)]"
              :disabled="saving"
              @click="showUnpublishConfirm = true"
            >
              <Icon name="lucide:eye-off" class="h-3.5 w-3.5" />
              {{ tc('common.unpublish') }}
            </button>
          </div>
        </div>
      </div>

      <form class="mx-auto max-w-5xl" @submit.prevent="handleSubmit">
        <div class="ca-card p-4 sm:p-6">
          <div class="space-y-4">
            <BaseInput id="title" v-model="form.title" :label="tc('articles.titleField')" placeholder="Judul artikel" required />
            <BaseInput id="slug" v-model="form.slug" :label="tc('articles.slugField')" placeholder="judul-artikel" required />
            <BaseTextarea id="description" v-model="form.description" :label="tc('articles.descriptionField')" rows="2" required />

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
              <BaseInput id="category" v-model="form.category" :label="tc('articles.categoryField')" required />
              <BaseInput id="tags" v-model="form.tags" :label="tc('articles.tagsField')" placeholder="seo, web, bisnis" />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <BaseInput id="author" v-model="form.author" :label="tc('articles.authorField')" />
              <BaseInput id="read_time" v-model.number="form.read_time" :label="tc('articles.readTimeField')" type="number" />
            </div>

            <BaseFileInput
              id="featured-image-edit"
              :label="tc('articles.featuredImage')"
              accept="image/jpeg,image/png,image/webp"
              :helper-text="tc('articles.featuredImageHelp')"
              :button-text="tc('common.chooseFile')"
              :loading="uploading"
              :preview-url="form.featured_image || null"
              preview-alt="Featured image preview"
              @select="handleImageUpload"
            />

            <details class="rounded-xl border border-[color:var(--ca-border)] p-4">
              <summary class="cursor-pointer text-sm font-semibold text-[var(--ca-muted)]">{{ tc('articles.seoTitle') }}</summary>
              <div class="mt-3 space-y-3">
                <BaseInput id="seo_title" v-model="form.seo_title" label="SEO Title" />
                <BaseTextarea id="seo_description" v-model="form.seo_description" label="SEO Description" rows="2" />
              </div>
            </details>
          </div>

          <p v-if="error" class="mt-3 text-sm text-rose-400">{{ error }}</p>

          <div class="mt-6 flex justify-end gap-3">
            <NuxtLink to="/console/articles" class="ca-btn-secondary">{{ tc('common.cancel') }}</NuxtLink>
            <button type="submit" class="ca-btn-primary" :disabled="saving">
              {{ saving ? tc('common.processing') : tc('common.saveChanges') }}
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
            {{ tc('articles.publishTitle') }}
          </h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">
            {{ tc('articles.publishDescription', { title: currentItem?.title || '-' }) }}
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showPublishConfirm = false">{{ tc('common.cancel') }}</button>
            <button type="button" class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600" :disabled="saving" @click="handlePublish">
              {{ saving ? tc('articles.publishing') : tc('common.publish') }}
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
            {{ tc('articles.unpublishTitle') }}
          </h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">
            {{ tc('articles.unpublishDescription', { title: currentItem?.title || '-' }) }}
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showUnpublishConfirm = false">{{ tc('common.cancel') }}</button>
            <button type="button" class="ca-btn-primary" :disabled="saving" @click="handleUnpublish">
              {{ saving ? tc('common.processing') : tc('common.unpublish') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
