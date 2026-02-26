<script setup lang="ts">
import { ShieldCheck, ExternalLink, Download, Calendar } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'
import type { IssuedCertificateDomain } from '~/types/certificate'

const props = defineProps<{
    certificate: IssuedCertificateDomain
    statusColor: string
    statusLabel: string
}>()

const emit = defineEmits<{
    (e: 'view', cert: IssuedCertificateDomain): void
}>()
</script>

<template>
    <div class="ca-card p-0 overflow-hidden group hover:border-divider-hover transition-all duration-300">
        <!-- Status Strip -->
        <div
            class="h-1"
            :class="{
                'bg-emerald-500': certificate.status === 'active',
                'bg-amber-500': certificate.status === 'expired',
                'bg-red-500': certificate.status === 'revoked',
            }"
        />

        <div class="p-5 space-y-4">
            <!-- Header -->
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                        <ShieldCheck class="w-5 h-5 text-brand" />
                    </div>
                    <div>
                        <h3 class="font-bold text-content text-sm group-hover:text-brand transition-colors">{{ certificate.schemeName }}</h3>
                        <p class="text-[10px] font-mono text-content-subtle mt-0.5">{{ certificate.certificateNumber }}</p>
                    </div>
                </div>
                <span
                    class="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shrink-0"
                    :class="statusColor"
                >
                    {{ statusLabel }}
                </span>
            </div>

            <!-- Details -->
            <div class="grid grid-cols-2 gap-3">
                <div class="p-2.5 rounded-lg bg-tint">
                    <p class="text-[10px] text-content-subtle uppercase tracking-widest">Diterbitkan</p>
                    <p class="text-xs font-bold text-content mt-0.5">
                        {{ certificate.issuedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                    </p>
                </div>
                <div class="p-2.5 rounded-lg bg-tint">
                    <p class="text-[10px] text-content-subtle uppercase tracking-widest">Berlaku Hingga</p>
                    <p class="text-xs font-bold mt-0.5" :class="certificate.status === 'active' ? 'text-content' : 'text-amber-400'">
                        {{ certificate.expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                    </p>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 pt-1">
                <CaButton
                    variant="primary"
                    size="sm"
                    class="flex-1"
                    @click="emit('view', certificate)"
                >
                    <ExternalLink class="w-3.5 h-3.5 mr-1.5" />
                    Lihat Detail
                </CaButton>
                <CaButton variant="outline" size="sm" class="px-3">
                    <Download class="w-3.5 h-3.5" />
                </CaButton>
            </div>
        </div>
    </div>
</template>
