<script setup lang="ts">
import { resolveArticleCover } from '~/utils/article-assets'
const props = withDefaults(defineProps<{ slug: string; title: string; image?: string | null; priority?: boolean }>(), {
    image: null,
    priority: false,
})
const failed = ref(false)
watch(
    () => [props.slug, props.image],
    () => {
        failed.value = false
    },
)
const cover = computed(() =>
    resolveArticleCover({ slug: props.slug, title: props.title, featured_image: failed.value ? null : props.image }),
)
</script>
<template>
    <img
        :src="cover.src"
        :srcset="cover.srcset"
        sizes="(max-width: 699px) 100vw, (max-width: 1099px) 50vw, 800px"
        :alt="cover.alt"
        width="1200"
        height="630"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        decoding="async"
        class="aspect-[1200/630] w-full object-cover"
        :data-illustration="cover.generated ? 'true' : undefined"
        @error="failed = true"
    >
</template>
