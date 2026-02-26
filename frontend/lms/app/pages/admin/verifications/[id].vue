<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import BaseBadge from '~/components/atoms/BaseBadge.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import DocumentViewer from '~/components/organisms/DocumentViewer.vue'
import VerificationActionBar from '~/components/organisms/VerificationActionBar.vue'
import { ArrowLeft, User, Mail, Phone, MapPin, FileText, Calendar } from 'lucide-vue-next'
import { useVerifications } from '~/composables/useVerifications'
import type { VerificationActionPayload } from '~/types/verification'

const route = useRoute()
const verificationId = route.params.id as string

const {
    currentVerification, loading, saving, error,
    fetchVerification, performAction, getStatusColor, getStatusLabel,
} = useVerifications()

onMounted(() => fetchVerification(verificationId))

const handleAction = async (payload: VerificationActionPayload) => {
    await performAction(verificationId, payload)
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <NuxtLink to="/admin/verifications" class="w-10 h-10 rounded-xl bg-tint flex items-center justify-center text-content-subtle hover:text-content hover:bg-tint-hover transition-all shrink-0">
                    <ArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div class="flex-1 min-w-0">
                    <h1 class="text-xl md:text-2xl font-bold text-content truncate">
                        Review Berkas {{ currentVerification?.id || '' }}
                    </h1>
                    <p v-if="currentVerification" class="text-sm text-content-subtle mt-0.5">{{ currentVerification.assesseeName }} — {{ currentVerification.schemeName }}</p>
                </div>
                <BaseBadge
                    v-if="currentVerification"
                    :text="getStatusLabel(currentVerification.status)"
                    variant="default"
                    class="px-3 py-1.5 border"
                    :class="getStatusColor(currentVerification.status)"
                />
            </div>
        </template>

        <div class="py-6 space-y-8">
            <!-- Error -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat data verifikasi..." />
            </div>

            <template v-else-if="currentVerification">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Left Column: Personal Data -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Personal Data (APL-01) -->
                        <div class="ca-card p-6">
                            <h3 class="text-xs font-black uppercase tracking-widest text-content-subtle mb-4 flex items-center gap-2">
                                <User class="w-3.5 h-3.5" />
                                Data Pribadi (APL-01)
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label class="text-[10px] font-black uppercase tracking-wider text-content-subtle">Nama Lengkap</label>
                                    <p class="text-sm font-bold text-content mt-1">{{ currentVerification.personalData.fullName }}</p>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black uppercase tracking-wider text-content-subtle">NIK</label>
                                    <p class="text-sm font-mono text-content mt-1">{{ currentVerification.personalData.nik }}</p>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black uppercase tracking-wider text-content-subtle">Tempat Lahir</label>
                                    <p class="text-sm text-content mt-1">{{ currentVerification.personalData.placeOfBirth }}</p>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black uppercase tracking-wider text-content-subtle">Tanggal Lahir</label>
                                    <p class="text-sm text-content mt-1">{{ currentVerification.personalData.dateOfBirth }}</p>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black uppercase tracking-wider text-content-subtle flex items-center gap-1">
                                        <Mail class="w-3 h-3" /> Email
                                    </label>
                                    <p class="text-sm text-content mt-1">{{ currentVerification.personalData.email }}</p>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black uppercase tracking-wider text-content-subtle flex items-center gap-1">
                                        <Phone class="w-3 h-3" /> Telepon
                                    </label>
                                    <p class="text-sm text-content mt-1">{{ currentVerification.personalData.phoneNumber }}</p>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="text-[10px] font-black uppercase tracking-wider text-content-subtle flex items-center gap-1">
                                        <MapPin class="w-3 h-3" /> Alamat
                                    </label>
                                    <p class="text-sm text-content mt-1">{{ currentVerification.personalData.address }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Documents (APL-02) -->
                        <div class="ca-card p-6">
                            <h3 class="text-xs font-black uppercase tracking-widest text-content-subtle mb-4 flex items-center gap-2">
                                <FileText class="w-3.5 h-3.5" />
                                Dokumen Pendukung (APL-02)
                            </h3>
                            <DocumentViewer :documents="currentVerification.documents" />
                        </div>
                    </div>

                    <!-- Right Column: Review & Actions -->
                    <div class="space-y-6">
                        <!-- Timeline / Meta -->
                        <div class="ca-card p-6 space-y-4">
                            <h3 class="text-xs font-black uppercase tracking-widest text-content-subtle">Riwayat</h3>
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <div class="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
                                    <div>
                                        <p class="text-xs font-bold text-content">Disubmit</p>
                                        <p class="text-xs text-content-subtle">{{ formatDate(currentVerification.submittedAt) }}</p>
                                    </div>
                                </div>
                                <div v-if="currentVerification.reviewedAt" class="flex items-start gap-3">
                                    <div class="w-2 h-2 rounded-full bg-brand-secondary mt-2 shrink-0" />
                                    <div>
                                        <p class="text-xs font-bold text-content">Direview oleh {{ currentVerification.reviewedBy }}</p>
                                        <p class="text-xs text-content-subtle">{{ formatDate(currentVerification.reviewedAt) }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Existing Review Notes -->
                            <div v-if="currentVerification.reviewNotes" class="pt-4 border-t border-divider">
                                <h4 class="text-[10px] font-black uppercase tracking-widest text-content-subtle mb-2">Catatan Review</h4>
                                <p class="text-sm text-content-muted leading-relaxed">{{ currentVerification.reviewNotes }}</p>
                            </div>
                        </div>

                        <!-- Action Bar -->
                        <VerificationActionBar
                            :status="currentVerification.status"
                            :saving="saving"
                            @action="handleAction"
                        />
                    </div>
                </div>
            </template>
        </div>
    </DashboardLayout>
</template>
