<script setup lang="ts">
import { briefConsoleCopy } from '~/utils/brief-console-copy'
import BriefDeliveries from '~/components/console/BriefDeliveries.vue'
import { briefCopy } from '~/utils/brief-copy'
definePageMeta({ layout: 'console', middleware: 'console' })
const route = useRoute()
const { can } = usePermissions()
const { locale, t } = useCoreI18n()
const language = computed(() => locale.value === 'en' ? 'en' : 'id')
const copy = computed(() => briefConsoleCopy[language.value])
const { formatDateTime } = useConsoleDateTime()
const { detail, loading, failed, loadDetail } = useBriefs()
const fetchBrief = () => { if (can('briefs:view')) return loadDetail(String(route.params.id)) }
useConsoleRemah().pasang(computed(() => [
    { label: copy.value.title, to: '/console/briefs' },
    { label: detail.value?.reference || copy.value.open },
]))
const fields = computed(() => {
    const b = detail.value
    if (!b) return []
    const subjects = t('contact.form.subjects') as Record<string, string>
    const budgets = t('contact.form.budgetRanges') as Record<string, string>
    const timelines = briefCopy[language.value].timelines as Record<string, string>
    return [
        [copy.value.received, formatDateTime(b.created_at)],
        [copy.value.subject, subjects[b.subject] || b.subject],
        [copy.value.preferred, b.preferred_contact === 'whatsapp' ? 'WhatsApp' : 'Email'],
        [copy.value.email, b.email], [copy.value.phone, b.phone],
        [copy.value.company, b.organization], [copy.value.budget, budgets[b.budget_range || ''] || b.budget_range],
        [copy.value.timeline, timelines[b.timeline || ''] || b.timeline],
        [copy.value.plan, b.selected_plan], [copy.value.consent, b.consented_at ? formatDateTime(b.consented_at) : ''],
    ]
})
onMounted(fetchBrief)
watch(() => route.params.id, fetchBrief)
</script>

<template>
    <div>
        <ConsolePageHeader :title="detail?.name || copy.open" :description="detail?.reference" :back-to="'/console/briefs'" :back-label="copy.back" icon="lucide:inbox" :kicker="copy.title">
            <template #actions><button v-if="can('briefs:view')" class="ca-btn-secondary" :disabled="loading" @click="fetchBrief">{{ copy.refresh }}</button></template>
        </ConsolePageHeader>
        <p v-if="!can('briefs:view')" role="alert" class="ca-status-danger">{{ copy.denied }}</p>
        <p v-else-if="loading" class="ca-card p-6" role="status">{{ copy.loading }}</p>
        <div v-else-if="failed" role="alert" class="ca-card p-6"><p>{{ copy.failed }}</p><button class="ca-btn-secondary mt-4" @click="fetchBrief">{{ copy.retry }}</button></div>
        <div v-else-if="detail" class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <section class="ca-card min-w-0 p-5 sm:p-6">
                <h2 class="text-lg font-semibold">{{ copy.contact }}</h2>
                <dl class="mt-5 space-y-4">
                    <div v-for="[label, value] in fields" :key="label">
                        <dt class="text-xs text-[var(--ca-muted)]">{{ label }}</dt>
                        <dd class="mt-1 break-words text-sm text-[var(--ca-text)]">{{ value || copy.none }}</dd>
                    </div>
                </dl>
            </section>
            <div class="min-w-0 space-y-5">
                <section class="ca-card p-5 sm:p-6">
                    <h2 class="text-lg font-semibold">{{ copy.message }}</h2>
                    <p class="mt-5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--ca-text)]">{{ detail.message }}</p>
                </section>
                <section class="ca-card p-5 sm:p-6">
                    <h2 class="mb-4 text-lg font-semibold">{{ copy.deliveries }}</h2>
                    <BriefDeliveries :deliveries="detail.deliveries" expanded />
                </section>
            </div>
        </div>
    </div>
</template>
