<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft, Download, Share2, ShieldCheck, Calendar, User, Building2, QrCode, Copy, Check } from 'lucide-vue-next'
import { useCertificates } from '~/composables/useCertificates'

const route = useRoute()
const id = route.params.id as string

const {
    currentCertificate: cert, loading, error,
    fetchCertificate, getStatusColor, getStatusLabel,
} = useCertificates()

const copied = ref(false)

onMounted(() => fetchCertificate(id))

const handleCopyLink = () => {
    if (cert.value) {
        navigator.clipboard.writeText(cert.value.verificationUrl)
        copied.value = true
        setTimeout(() => { copied.value = false }, 2000)
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <NuxtLink to="/assessee" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-content-subtle hover:text-white hover:bg-white/10 transition-all shrink-0">
                    <ArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div class="flex-1 min-w-0">
                    <h1 class="text-xl md:text-3xl font-black tracking-tight text-white truncate">Detail Sertifikat</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Informasi lengkap dan verifikasi sertifikat.</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <CaButton variant="outline" size="sm" @click="handleCopyLink" class="hidden sm:flex">
                        <component :is="copied ? Check : Copy" class="w-4 h-4 mr-1.5" />
                        {{ copied ? 'Tersalin!' : 'Salin Link' }}
                    </CaButton>
                    <CaButton variant="primary" size="sm">
                        <Download class="w-4 h-4 mr-1.5" />
                        Unduh PDF
                    </CaButton>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat sertifikat..." />
            </div>

            <template v-else-if="cert">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Main Info -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Certificate Card -->
                        <div class="ca-card p-0 overflow-hidden">
                            <!-- Status Strip -->
                            <div
                                class="h-1.5"
                                :class="{
                                    'bg-emerald-500': cert.status === 'active',
                                    'bg-amber-500': cert.status === 'expired',
                                    'bg-red-500': cert.status === 'revoked',
                                }"
                            />
                            <div class="p-6 space-y-6">
                                <div class="flex items-start justify-between">
                                    <div>
                                        <p class="text-xs font-mono text-brand mb-1">{{ cert.certificateNumber }}</p>
                                        <h2 class="text-2xl font-black text-white">{{ cert.schemeName }}</h2>
                                    </div>
                                    <span
                                        class="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border"
                                        :class="getStatusColor(cert.status)"
                                    >
                                        {{ getStatusLabel(cert.status) }}
                                    </span>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div class="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                                        <User class="w-5 h-5 text-content-subtle shrink-0" />
                                        <div>
                                            <p class="text-xs text-content-subtle">Pemegang</p>
                                            <p class="text-sm font-bold text-white">{{ cert.holderName }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                                        <Building2 class="w-5 h-5 text-content-subtle shrink-0" />
                                        <div>
                                            <p class="text-xs text-content-subtle">LSP Penerbit</p>
                                            <p class="text-sm font-bold text-white">{{ cert.lspName }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                                        <Calendar class="w-5 h-5 text-content-subtle shrink-0" />
                                        <div>
                                            <p class="text-xs text-content-subtle">Tanggal Terbit</p>
                                            <p class="text-sm font-bold text-white">{{ cert.issuedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                                        <Calendar class="w-5 h-5 text-content-subtle shrink-0" />
                                        <div>
                                            <p class="text-xs text-content-subtle">Berlaku Hingga</p>
                                            <p class="text-sm font-bold" :class="cert.status === 'active' ? 'text-white' : 'text-amber-400'">
                                                {{ cert.expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                                    <ShieldCheck class="w-5 h-5 text-content-subtle shrink-0" />
                                    <div>
                                        <p class="text-xs text-content-subtle">Asesor</p>
                                        <p class="text-sm font-bold text-white">{{ cert.assessorName }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- QR & Share Sidebar -->
                    <div class="space-y-6">
                        <!-- QR Code -->
                        <div class="ca-card p-0 overflow-hidden">
                            <div class="p-6 border-b border-white/5">
                                <h3 class="text-sm font-bold text-content-subtle uppercase tracking-widest">QR Verifikasi</h3>
                            </div>
                            <div class="p-6 flex flex-col items-center">
                                <div class="w-40 h-40 rounded-2xl bg-white flex items-center justify-center mb-4">
                                    <QrCode class="w-24 h-24 text-gray-800" />
                                </div>
                                <p class="text-xs text-content-subtle text-center">Scan QR code ini untuk memverifikasi keaslian sertifikat.</p>
                            </div>
                        </div>

                        <!-- Share -->
                        <div class="ca-card p-0 overflow-hidden">
                            <div class="p-6 border-b border-white/5">
                                <h3 class="text-sm font-bold text-content-subtle uppercase tracking-widest">Bagikan</h3>
                            </div>
                            <div class="p-6 space-y-3">
                                <div class="p-3 rounded-xl bg-white/5 text-xs text-content-muted font-mono break-all">
                                    {{ cert.verificationUrl }}
                                </div>
                                <CaButton variant="outline" class="w-full" @click="handleCopyLink">
                                    <component :is="copied ? Check : Share2" class="w-4 h-4 mr-1.5" />
                                    {{ copied ? 'Link Tersalin!' : 'Salin Link Verifikasi' }}
                                </CaButton>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </DashboardLayout>
</template>
