<script setup lang="ts">
import PublicLayout from '~/components/templates/PublicLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { Search, ShieldCheck, ShieldAlert, Calendar, User, Building2 } from 'lucide-vue-next'
import { usePublicVerification } from '~/composables/usePublicVerification'

const {
    result, loading, error, searched,
    verifyCertificate, reset, getStatusColor, getStatusLabel,
} = usePublicVerification()

const searchInput = ref('')

const handleSearch = () => {
    const q = searchInput.value.trim()
    if (!q) return
    // Normalize: replace / with - for URL-safe format
    const normalized = q.replace(/\//g, '-')
    verifyCertificate(normalized)
}

const handleReset = () => {
    searchInput.value = ''
    reset()
}
</script>

<template>
    <PublicLayout>
        <div class="space-y-10">
            <!-- Hero -->
            <div class="text-center space-y-4">
                <div class="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
                    <ShieldCheck class="w-8 h-8 text-brand" />
                </div>
                <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight">Verifikasi Sertifikat</h1>
                <p class="text-base text-content-muted max-w-lg mx-auto">
                    Masukkan nomor sertifikat untuk memverifikasi keaslian dan status sertifikat kompetensi.
                </p>
            </div>

            <!-- Search Form -->
            <div class="max-w-xl mx-auto">
                <form @submit.prevent="handleSearch" class="flex gap-3">
                    <div class="flex-1 relative">
                        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle pointer-events-none" />
                        <input
                            v-model="searchInput"
                            type="text"
                            placeholder="Contoh: BNSP/JWD/2025/001234"
                            class="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#0F1423] border border-white/10 text-white placeholder-content-subtle focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-all text-sm font-medium"
                        />
                    </div>
                    <CaButton
                        variant="primary"
                        type="submit"
                        :loading="loading"
                        class="px-8 rounded-2xl"
                    >
                        Verifikasi
                    </CaButton>
                </form>
            </div>

            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-12">
                <LoadingSpinner size="lg" label="Memverifikasi sertifikat..." />
            </div>

            <!-- Result: Found -->
            <template v-else-if="searched && result">
                <div class="max-w-2xl mx-auto ca-card p-0 overflow-hidden">
                    <!-- Status Header -->
                    <div class="p-6 border-b border-white/5" :class="result.valid ? 'bg-emerald-500/5' : 'bg-red-500/5'">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="result.valid ? 'bg-emerald-500/20' : 'bg-red-500/20'">
                                <ShieldCheck v-if="result.valid" class="w-6 h-6 text-emerald-500" />
                                <ShieldAlert v-else class="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h2 class="text-lg font-bold" :class="result.valid ? 'text-emerald-500' : 'text-red-400'">
                                    {{ result.valid ? 'Sertifikat Terverifikasi' : 'Sertifikat Tidak Valid' }}
                                </h2>
                                <p class="text-sm text-content-muted font-mono">{{ result.certificateNumber }}</p>
                            </div>
                            <span
                                class="ml-auto px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border"
                                :class="getStatusColor(result.status)"
                            >
                                {{ getStatusLabel(result.status) }}
                            </span>
                        </div>
                    </div>

                    <!-- Details -->
                    <div class="p-6 space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <User class="w-4 h-4 text-content-subtle shrink-0" />
                                <div>
                                    <p class="text-xs text-content-subtle">Pemegang Sertifikat</p>
                                    <p class="text-sm font-bold text-white">{{ result.holderName }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <Building2 class="w-4 h-4 text-content-subtle shrink-0" />
                                <div>
                                    <p class="text-xs text-content-subtle">LSP Penerbit</p>
                                    <p class="text-sm font-bold text-white">{{ result.lspName }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="p-3 rounded-xl bg-white/5">
                            <p class="text-xs text-content-subtle">Skema Sertifikasi</p>
                            <p class="text-sm font-bold text-white">{{ result.schemeName }}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <Calendar class="w-4 h-4 text-content-subtle shrink-0" />
                                <div>
                                    <p class="text-xs text-content-subtle">Tanggal Terbit</p>
                                    <p class="text-sm font-bold text-white">
                                        {{ result.issuedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <Calendar class="w-4 h-4 text-content-subtle shrink-0" />
                                <div>
                                    <p class="text-xs text-content-subtle">Berlaku Hingga</p>
                                    <p class="text-sm font-bold" :class="result.status === 'active' ? 'text-white' : 'text-amber-400'">
                                        {{ result.expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-6 py-4 border-t border-white/5 flex justify-end">
                        <CaButton variant="outline" size="sm" @click="handleReset">
                            Verifikasi Lainnya
                        </CaButton>
                    </div>
                </div>
            </template>

            <!-- Result: Not Found -->
            <template v-else-if="searched && !result && !loading">
                <div class="max-w-md mx-auto text-center py-12">
                    <div class="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert class="w-8 h-8 text-red-400" />
                    </div>
                    <h2 class="text-xl font-bold text-white mb-2">Sertifikat Tidak Ditemukan</h2>
                    <p class="text-sm text-content-muted mb-6">Nomor sertifikat yang Anda masukkan tidak terdaftar dalam sistem kami. Periksa kembali nomor sertifikat.</p>
                    <CaButton variant="outline" @click="handleReset">
                        Coba Lagi
                    </CaButton>
                </div>
            </template>
        </div>
    </PublicLayout>
</template>
