<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { FileBarChart, Award, Users, BookOpen, Layers, FileDown } from 'lucide-vue-next'
import { useReports } from '~/composables/useReports'

const { summary, loading, error, fetchSummary } = useReports()

onMounted(() => fetchSummary())
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <FileBarChart class="w-5 h-5 text-brand" />
                </div>
                <div class="flex-1">
                    <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white">Laporan & Export</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Ringkasan data dan export laporan BNSP.</p>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat ringkasan..." />
            </div>

            <template v-else-if="summary">
                <!-- Summary Cards -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-5 rounded-2xl bg-core-800 border border-white/5 shadow-xl">
                        <Award class="w-5 h-5 text-brand mb-3" />
                        <div class="text-3xl font-black text-white mb-1">{{ summary.totalCertificatesIssued }}</div>
                        <p class="text-xs font-bold text-content-subtle uppercase tracking-widest">Sertifikat Terbit</p>
                    </div>
                    <div class="p-5 rounded-2xl bg-core-800 border border-white/5 shadow-xl">
                        <BookOpen class="w-5 h-5 text-brand-secondary mb-3" />
                        <div class="text-3xl font-black text-white mb-1">{{ summary.totalAssessments }}</div>
                        <p class="text-xs font-bold text-content-subtle uppercase tracking-widest">Total Asesmen</p>
                    </div>
                    <div class="p-5 rounded-2xl bg-core-800 border border-white/5 shadow-xl">
                        <Users class="w-5 h-5 text-purple-400 mb-3" />
                        <div class="text-3xl font-black text-white mb-1">{{ summary.totalAssessees }}</div>
                        <p class="text-xs font-bold text-content-subtle uppercase tracking-widest">Total Asesi</p>
                    </div>
                    <div class="p-5 rounded-2xl bg-core-800 border border-white/5 shadow-xl">
                        <Layers class="w-5 h-5 text-amber-400 mb-3" />
                        <div class="text-3xl font-black text-white mb-1">{{ summary.totalSchemes }}</div>
                        <p class="text-xs font-bold text-content-subtle uppercase tracking-widest">Skema Aktif</p>
                    </div>
                </div>

                <!-- Export Actions -->
                <div class="ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-white/5">
                        <h2 class="text-lg font-bold text-white">Export Laporan</h2>
                        <p class="text-sm text-content-subtle mt-1">Unduh data untuk pelaporan ke BNSP.</p>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <NuxtLink to="/admin/reports/bnsp-export" class="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-brand/20 transition-all group cursor-pointer">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                                        <FileDown class="w-6 h-6 text-brand" />
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-white group-hover:text-brand transition-colors">Export Data BNSP</h3>
                                        <p class="text-xs text-content-subtle mt-0.5">Export data sertifikasi sesuai format standar BNSP</p>
                                    </div>
                                </div>
                            </NuxtLink>
                            <div class="p-5 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                                <p class="text-sm text-content-subtle text-center">Laporan lainnya segera hadir</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Period Info -->
                <div class="text-xs text-content-subtle text-center">
                    Data periode: {{ summary.periodStart }} s/d {{ summary.periodEnd }}
                </div>
            </template>
        </div>
    </DashboardLayout>
</template>
