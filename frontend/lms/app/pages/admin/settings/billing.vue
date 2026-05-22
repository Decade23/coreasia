<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import { CreditCard, ArrowLeft } from 'lucide-vue-next'

const { t } = useI18n()

// Dummy state for demonstration
const subscription = ref({
    planName: 'Pro',
    status: 'active',
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    price: 'Rp 250.000',
    features: ['Unlimited asesi', '5 skema sertifikasi', 'CBT Online', 'WhatsApp Notifikasi']
})
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="hidden text-lg font-bold text-content lg:block">{{ t('nav.settings') }} - Billing</h1>
        </template>

        <div class="space-y-6 py-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('nav.settings'), to: '/admin/settings' }, { label: 'Billing' }]" />
                <div class="flex items-center justify-between">
                    <PageHeader
                        eyebrow="Billing"
                        title="Subscription & Billing"
                        subtitle="Kelola paket langganan dan tagihan Anda."
                    />
                    <NuxtLink to="/admin/settings" class="flex items-center gap-2 text-sm text-content-subtle hover:text-content">
                        <ArrowLeft class="h-4 w-4" />
                        Kembali ke Settings
                    </NuxtLink>
                </div>
            </div>

            <div class="ca-card p-6">
                <div class="flex items-center gap-3 border-b border-divider pb-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <CreditCard class="h-6 w-6" />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-content">Paket Saat Ini: {{ subscription.planName }}</h2>
                        <p class="text-sm text-content-subtle">
                            Status: <span class="font-bold text-emerald-400 capitalize">{{ subscription.status }}</span>
                        </p>
                    </div>
                </div>

                <div class="mt-6 grid gap-6 md:grid-cols-2">
                    <div class="rounded-2xl border border-divider bg-tint-subtle p-5">
                        <h3 class="text-sm font-bold text-content">Detail Tagihan</h3>
                        <dl class="mt-4 space-y-3 text-sm">
                            <div class="flex justify-between">
                                <dt class="text-content-subtle">Biaya Bulanan</dt>
                                <dd class="font-bold text-content">{{ subscription.price }}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-content-subtle">Siklus Berikutnya</dt>
                                <dd class="font-bold text-content">{{ subscription.periodEnd }}</dd>
                            </div>
                        </dl>
                        <div class="mt-6 flex gap-3">
                            <button class="ca-btn-primary w-full justify-center">Upgrade Paket</button>
                            <button class="ca-btn-secondary w-full justify-center">Riwayat Tagihan</button>
                        </div>
                    </div>

                    <div class="rounded-2xl border border-divider bg-tint-subtle p-5">
                        <h3 class="text-sm font-bold text-content">Fitur Paket {{ subscription.planName }}</h3>
                        <ul class="mt-4 space-y-2">
                            <li v-for="feature in subscription.features" :key="feature" class="flex items-center gap-2 text-sm text-content-muted">
                                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                {{ feature }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>
