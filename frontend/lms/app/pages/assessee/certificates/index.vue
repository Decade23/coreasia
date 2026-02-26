<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CertificateCard from '~/components/organisms/CertificateCard.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import EmptyState from '~/components/atoms/EmptyState.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ShieldCheck } from 'lucide-vue-next'
import { useCertificates } from '~/composables/useCertificates'
import type { IssuedCertificateDomain } from '~/types/certificate'

const {
    certificates, loading, error,
    fetchCertificates, getStatusColor, getStatusLabel,
} = useCertificates()

onMounted(() => fetchCertificates())

const handleViewCert = (cert: IssuedCertificateDomain) => {
    navigateTo(`/assessee/certificates/${cert.id}`)
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <ShieldCheck class="w-5 h-5 text-brand" />
                </div>
                <div>
                    <h1 class="text-2xl md:text-3xl font-black tracking-tight text-content">Sertifikat Saya</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Daftar sertifikat kompetensi yang telah Anda peroleh.</p>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat sertifikat..." />
            </div>

            <EmptyState
                v-else-if="certificates.length === 0 && !loading"
                title="Belum ada sertifikat"
                description="Selesaikan proses sertifikasi untuk mendapatkan sertifikat kompetensi Anda."
            />

            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <CertificateCard
                    v-for="cert in certificates"
                    :key="cert.id"
                    :certificate="cert"
                    :status-color="getStatusColor(cert.status)"
                    :status-label="getStatusLabel(cert.status)"
                    @view="handleViewCert"
                />
            </div>
        </div>
    </DashboardLayout>
</template>
