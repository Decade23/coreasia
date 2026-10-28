<script setup lang="ts">
import type { BriefDelivery } from '~/composables/useBriefs'
import { briefConsoleCopy } from '~/utils/brief-console-copy'
defineProps<{ deliveries: BriefDelivery[]; expanded?: boolean }>()
const { locale } = useCoreI18n()
const copy = computed(() => briefConsoleCopy[locale.value === 'en' ? 'en' : 'id'])
const { formatDateTime } = useConsoleDateTime()
const statusLabel = (status: string) => copy.value.states[status as keyof typeof copy.value.states] || copy.value.states.unknown
</script>

<template>
    <div v-if="deliveries.length" class="flex flex-wrap gap-2" :class="{ 'flex-col': expanded }">
        <div v-for="delivery in deliveries" :key="delivery.channel" :class="expanded ? 'ca-card-soft p-4' : ''">
            <span class="ca-pill" :class="delivery.status === 'sent' ? 'ca-pill-emerald' : ['pending', 'processing', 'retry'].includes(delivery.status) ? 'ca-pill-muted' : 'ca-pill-danger'">
                {{ delivery.channel === 'email' ? copy.teamEmail : copy.crm }}: {{ statusLabel(delivery.status) }}
            </span>
            <p v-if="expanded" class="mt-2 text-xs text-[var(--ca-muted)]">
                {{ copy.attempts }}: {{ delivery.attempts }}
                <template v-if="delivery.delivered_at"> · {{ copy.sentAt }}: {{ formatDateTime(delivery.delivered_at) }}</template>
            </p>
        </div>
    </div>
    <p v-else class="text-xs text-[var(--ca-muted)]">{{ copy.missingDelivery }}</p>
</template>
