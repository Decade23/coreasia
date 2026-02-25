<script setup lang="ts">
import { reactive } from 'vue'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft, FileDown, Check, Download } from 'lucide-vue-next'
import { useReports, type BnspExportParams } from '~/composables/useReports'
import { useSchemes } from '~/composables/useSchemes'

const { exportResult, exporting, error, generateBnspExport } = useReports()
const { schemes, fetchSchemes } = useSchemes()

onMounted(() => fetchSchemes(1, ''))

const form = reactive<BnspExportParams>({
    schemeId: '',
    periodStart: '',
    periodEnd: '',
    format: 'xlsx',
})

const handleExport = async () => {
    if (!form.periodStart || !form.periodEnd) return
    await generateBnspExport({ ...form })
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <NuxtLink to="/admin/reports" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-content-subtle hover:text-white hover:bg-white/10 transition-all shrink-0">
                    <ArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div>
                    <h1 class="text-xl md:text-3xl font-black tracking-tight text-white">Export Data BNSP</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Generate file export sesuai format standar BNSP.</p>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Form -->
                <div class="lg:col-span-2 ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-white/5">
                        <h2 class="text-lg font-bold text-white">Parameter Export</h2>
                        <p class="text-sm text-content-subtle mt-1">Pilih skema dan periode data yang ingin diekspor.</p>
                    </div>
                    <div class="p-6 space-y-5">
                        <!-- Scheme Select -->
                        <div>
                            <label class="block text-sm font-bold text-content-muted mb-2">Skema Sertifikasi</label>
                            <select
                                v-model="form.schemeId"
                                class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-all"
                            >
                                <option value="">Semua Skema</option>
                                <option v-for="s in schemes" :key="s.id" :value="s.id">{{ s.name }}</option>
                            </select>
                        </div>

                        <!-- Period -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-sm font-bold text-content-muted mb-2">Periode Mulai</label>
                                <input
                                    v-model="form.periodStart"
                                    type="date"
                                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-all"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-content-muted mb-2">Periode Akhir</label>
                                <input
                                    v-model="form.periodEnd"
                                    type="date"
                                    class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-all"
                                />
                            </div>
                        </div>

                        <!-- Format -->
                        <div>
                            <label class="block text-sm font-bold text-content-muted mb-2">Format File</label>
                            <div class="flex gap-3">
                                <button
                                    v-for="fmt in ['xlsx', 'csv'] as const"
                                    :key="fmt"
                                    class="flex-1 p-3 rounded-xl border text-sm font-bold uppercase tracking-widest transition-all"
                                    :class="form.format === fmt
                                        ? 'bg-brand/10 border-brand/30 text-brand'
                                        : 'bg-white/5 border-white/10 text-content-muted hover:border-white/20'"
                                    @click="form.format = fmt"
                                >
                                    .{{ fmt }}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 border-t border-white/5 flex justify-end">
                        <CaButton
                            variant="primary"
                            :loading="exporting"
                            :disabled="!form.periodStart || !form.periodEnd"
                            @click="handleExport"
                        >
                            <FileDown class="w-4 h-4 mr-1.5" />
                            Generate Export
                        </CaButton>
                    </div>
                </div>

                <!-- Result -->
                <div class="ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-white/5">
                        <h2 class="text-sm font-bold text-content-subtle uppercase tracking-widest">Hasil Export</h2>
                    </div>
                    <div class="p-6">
                        <template v-if="exportResult">
                            <div class="text-center space-y-4">
                                <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                                    <Check class="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 class="font-bold text-white">Export Berhasil!</h3>
                                    <p class="text-sm text-content-muted mt-1">{{ exportResult.recordCount }} record diekspor</p>
                                </div>
                                <div class="p-3 rounded-xl bg-white/5 text-xs text-content-muted font-mono break-all">
                                    {{ exportResult.fileName }}
                                </div>
                                <CaButton variant="primary" class="w-full">
                                    <Download class="w-4 h-4 mr-1.5" />
                                    Unduh File
                                </CaButton>
                                <p class="text-[10px] text-content-subtle">
                                    Dibuat: {{ new Date(exportResult.generatedAt).toLocaleString('id-ID') }}
                                </p>
                            </div>
                        </template>
                        <template v-else>
                            <div class="text-center py-6">
                                <FileDown class="w-10 h-10 text-content-subtle mx-auto mb-3 opacity-30" />
                                <p class="text-sm text-content-subtle">Pilih parameter dan klik "Generate Export" untuk menghasilkan file.</p>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>
