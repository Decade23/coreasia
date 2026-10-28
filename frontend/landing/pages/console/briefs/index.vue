<script setup lang="ts">
import { briefConsoleCopy } from '~/utils/brief-console-copy'
import BriefDeliveries from '~/components/console/BriefDeliveries.vue'
definePageMeta({ layout: 'console', middleware: 'console' })
const { can } = usePermissions()
const { locale, t } = useCoreI18n()
const copy = computed(() => briefConsoleCopy[locale.value === 'en' ? 'en' : 'id'])
const { formatDateTime } = useConsoleDateTime()
const { items, loading, failed, total, load } = useBriefs()
const search = ref('')
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / 25)))
const fetchBriefs = () => { if (can('briefs:list')) return load(page.value, search.value) }
const subject = (key: string) => (t('contact.form.subjects') as Record<string, string>)[key] || key
let timer: ReturnType<typeof setTimeout>
watch(search, () => { clearTimeout(timer); timer = setTimeout(() => { page.value = 1; void fetchBriefs() }, 300) })
const goPage = (number: number) => { clearTimeout(timer); page.value = number; void fetchBriefs() }
onMounted(fetchBriefs)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
    <div>
        <ConsolePageHeader :title="copy.title" :description="copy.subtitle" icon="lucide:inbox" kicker="CoreAsia">
            <template #actions><button v-if="can('briefs:list')" class="ca-btn-secondary" :disabled="loading" @click="fetchBriefs">{{ copy.refresh }}</button></template>
        </ConsolePageHeader>
        <p v-if="!can('briefs:list')" role="alert" class="ca-status-danger">{{ copy.denied }}</p>
        <template v-else>
            <BaseInput id="brief-search" v-model="search" type="search" :label="copy.search" :placeholder="copy.search" maxlength="200" autocomplete="off" />
            <div class="mt-5" :aria-busy="loading">
                <p v-if="loading" role="status" class="ca-card p-6 text-[var(--ca-muted)]">{{ copy.loading }}</p>
                <div v-else-if="failed" role="alert" class="ca-card p-6">
                    <p>{{ copy.failed }}</p><button class="ca-btn-secondary mt-4" @click="fetchBriefs">{{ copy.retry }}</button>
                </div>
                <p v-else-if="!items.length" class="ca-card p-6 text-[var(--ca-muted)]">{{ search ? copy.noResults : copy.empty }}</p>
                <ul v-else class="space-y-3">
                    <li v-for="brief in items" :key="brief.id" class="ca-card p-5 sm:p-6">
                        <div class="flex flex-col justify-between gap-4 sm:flex-row">
                            <div class="min-w-0">
                                <NuxtLink :to="`/console/briefs/${brief.id}`" class="font-semibold underline-offset-4 hover:underline break-words text-[var(--ca-text)]">{{ brief.reference }} · {{ brief.name }}</NuxtLink>
                                <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ subject(brief.subject) }}</p>
                                <p class="mt-2 break-words text-sm text-[var(--ca-muted)]">{{ brief.email || brief.phone }}<template v-if="brief.organization"> · {{ brief.organization }}</template></p>
                            </div>
                            <time :datetime="brief.created_at" class="shrink-0 text-xs text-[var(--ca-muted)]">{{ formatDateTime(brief.created_at) }}</time>
                        </div>
                        <div class="mt-4"><BriefDeliveries :deliveries="brief.deliveries" /></div>
                        <NuxtLink :to="`/console/briefs/${brief.id}`" class="ca-btn-secondary mt-4 text-sm">{{ copy.open }}<Icon name="lucide:arrow-right" class="h-4 w-4" /></NuxtLink>
                    </li>
                </ul>
            </div>
            <nav v-if="!failed" :aria-label="copy.title" class="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span class="text-sm text-[var(--ca-muted)]">{{ total }} {{ copy.total }} · {{ copy.page }} {{ page }} {{ copy.of }} {{ pageCount }}</span>
                <div class="flex gap-2">
                    <button class="ca-btn-secondary" :disabled="loading || page <= 1" @click="goPage(page - 1)">{{ copy.previous }}</button>
                    <button class="ca-btn-secondary" :disabled="loading || page >= pageCount" @click="goPage(page + 1)">{{ copy.next }}</button>
                </div>
            </nav>
        </template>
    </div>
</template>
