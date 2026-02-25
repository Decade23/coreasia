<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ChevronRight } from 'lucide-vue-next'
import { useVerifications } from '~/composables/useVerifications'

const {
    verifications, summary, loading, error,
    fetchVerifications, fetchSummary, getStatusColor, getStatusLabel,
} = useVerifications()

const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'SUBMITTED', label: 'Menunggu Verifikasi' },
    { value: 'UNDER_REVIEW', label: 'Sedang Direview' },
    { value: 'REVISION_NEEDED', label: 'Butuh Revisi' },
    { value: 'VERIFIED', label: 'Terverifikasi' },
    { value: 'REJECTED', label: 'Ditolak' },
]

const schemeFilter = ref('')

onMounted(async () => {
    await Promise.all([
        fetchVerifications(),
        fetchSummary(),
    ])
})

watch(statusFilter, () => {
    fetchVerifications({ status: statusFilter.value })
})

const filteredVerifications = computed(() => {
    if (!searchQuery.value) return verifications.value
    const q = searchQuery.value.toLowerCase()
    return verifications.value.filter(v =>
        v.assesseeName.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
    )
})
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div>
                    <h1 class="text-xl md:text-3xl font-bold truncate mr-4 text-white">Verifikasi Berkas</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Review kelengkapan dokumen APL-01 dan APL-02 asesi.</p>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <!-- Summary Cards -->
            <div v-if="summary" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="p-4 rounded-2xl bg-core-800 border border-white/5 shadow-xl">
                    <div class="text-3xl font-black text-white mb-1">{{ summary.total_queue }}</div>
                    <p class="text-xs font-bold text-content-subtle uppercase tracking-widest">Total Antrean</p>
                </div>
                <div class="p-4 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/20 shadow-xl">
                    <div class="text-3xl font-black text-brand-secondary mb-1">{{ summary.needs_review }}</div>
                    <p class="text-xs font-bold text-brand-secondary/70 uppercase tracking-widest">Perlu Direview</p>
                </div>
                <div class="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-xl">
                    <div class="text-3xl font-black text-orange-400 mb-1">{{ summary.awaiting_revision }}</div>
                    <p class="text-xs font-bold text-orange-400/70 uppercase tracking-widest">Menunggu Revisi</p>
                </div>
                <div class="p-4 rounded-2xl bg-brand/5 border border-brand/20 shadow-xl shadow-brand/5">
                    <div class="text-3xl font-black text-brand mb-1">{{ summary.completed_this_month }}</div>
                    <p class="text-xs font-bold text-brand/70 uppercase tracking-widest">Selesai (Bulan Ini)</p>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="flex flex-col lg:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-[#0F1423] shadow-xl glass-card">
                <div class="w-full lg:w-96">
                    <CaInputSearch v-model="searchQuery" placeholder="Cari nama asesi atau No. Registrasi..." />
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <CaSelect
                        id="filter-status"
                        :options="statusOptions"
                        v-model="statusFilter"
                        class="w-full sm:w-56"
                    />
                </div>
            </div>

            <!-- Error -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat data verifikasi..." />
            </div>

            <!-- Table -->
            <div v-else class="ca-card overflow-hidden !rounded-[2rem] p-0">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-core-900/80 border-b border-white/5">
                                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest whitespace-nowrap pl-6">No. Registrasi</th>
                                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Asesi</th>
                                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Skema Sertifikasi</th>
                                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest whitespace-nowrap">Tanggal Submit</th>
                                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Status</th>
                                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest pr-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <tr v-for="item in filteredVerifications" :key="item.id" class="hover:bg-core-800 transition-colors group">
                                <td class="p-4 font-mono text-xs text-brand pl-6">{{ item.id }}</td>
                                <td class="p-4 font-bold text-white whitespace-nowrap">{{ item.assesseeName }}</td>
                                <td class="p-4 text-sm text-content-muted">{{ item.schemeName }}</td>
                                <td class="p-4 text-sm text-content-muted whitespace-nowrap">
                                    {{ item.submittedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                                </td>
                                <td class="p-4">
                                    <span
                                        class="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border whitespace-nowrap inline-block"
                                        :class="getStatusColor(item.status)"
                                    >
                                        {{ getStatusLabel(item.status) }}
                                    </span>
                                </td>
                                <td class="p-4 pr-6 text-right">
                                    <NuxtLink :to="`/admin/verifications/${item.id}`">
                                        <CaButton
                                            variant="outline"
                                            size="sm"
                                            class="px-3"
                                            :disabled="item.status === 'DRAFT'"
                                        >
                                            <span class="mr-1">Review</span>
                                            <ChevronRight class="w-4 h-4" />
                                        </CaButton>
                                    </NuxtLink>
                                </td>
                            </tr>
                            <tr v-if="filteredVerifications.length === 0">
                                <td colspan="6" class="p-8 text-center text-content-subtle text-sm">
                                    Tidak ada data yang sesuai filter.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>
