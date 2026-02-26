<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import EmptyState from '~/components/atoms/EmptyState.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
import { Plus, FileText, Star, ChevronRight, Trash2 } from 'lucide-vue-next'
import { useCertificateTemplates } from '~/composables/useCertificateTemplates'
import type { CertificateTemplateDomain } from '~/types/certificate'

const {
    templates, loading, saving, error,
    fetchTemplates, deleteTemplate,
} = useCertificateTemplates()

const showDeleteConfirm = ref(false)
const deletingTemplate = ref<CertificateTemplateDomain | null>(null)

onMounted(() => fetchTemplates())

const handleDeleteClick = (tpl: CertificateTemplateDomain) => {
    deletingTemplate.value = tpl
    showDeleteConfirm.value = true
}

const handleConfirmDelete = async () => {
    if (!deletingTemplate.value) return
    const success = await deleteTemplate(deletingTemplate.value.id)
    if (success) {
        showDeleteConfirm.value = false
        deletingTemplate.value = null
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div>
                    <h1 class="text-2xl md:text-3xl font-black tracking-tight text-content">Template Sertifikat</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola template untuk penerbitan sertifikat kompetensi.</p>
                </div>
                <NuxtLink to="/admin/templates/new">
                    <CaButton variant="primary" class="rounded-full px-6 py-3 flex items-center gap-2 transition-all hover:scale-105">
                        <Plus class="w-4 h-4" />
                        <span class="hidden sm:inline">Template Baru</span>
                    </CaButton>
                </NuxtLink>
            </div>
        </template>

        <div class="py-6 space-y-8">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat template..." />
            </div>

            <EmptyState
                v-else-if="templates.length === 0 && !loading"
                title="Belum ada template"
                description="Buat template sertifikat pertama untuk skema Anda."
            >
                <template #action>
                    <NuxtLink to="/admin/templates/new">
                        <CaButton variant="primary">
                            <Plus class="w-4 h-4 mr-2" />
                            Buat Template
                        </CaButton>
                    </NuxtLink>
                </template>
            </EmptyState>

            <!-- Template Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div
                    v-for="tpl in templates"
                    :key="tpl.id"
                    class="ca-card p-0 overflow-hidden group hover:border-divider-hover transition-all duration-300"
                >
                    <!-- Thumbnail -->
                    <div class="relative aspect-[16/10] bg-tint border-b border-divider flex items-center justify-center overflow-hidden">
                        <div class="text-center p-6">
                            <FileText class="w-12 h-12 text-brand/30 mx-auto mb-2" />
                            <p class="text-xs text-content-subtle">Preview Template</p>
                        </div>

                        <!-- Default Badge -->
                        <div v-if="tpl.isDefault" class="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
                            <Star class="w-3 h-3" />
                            Default
                        </div>

                        <!-- Field Count -->
                        <div class="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 text-[10px] font-bold text-content-muted">
                            {{ tpl.fields.length }} field
                        </div>
                    </div>

                    <!-- Info -->
                    <div class="p-5">
                        <h3 class="font-bold text-content text-base mb-1 group-hover:text-brand transition-colors">{{ tpl.name }}</h3>
                        <p class="text-sm text-content-muted line-clamp-2 mb-3">{{ tpl.description }}</p>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-tint text-content-muted border border-divider">
                                {{ tpl.schemeName }}
                            </span>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-5 py-3 border-t border-divider flex items-center justify-between">
                        <button
                            class="text-xs text-content-subtle hover:text-red-400 transition-colors font-bold flex items-center gap-1"
                            @click="handleDeleteClick(tpl)"
                        >
                            <Trash2 class="w-3 h-3" />
                            Hapus
                        </button>
                        <NuxtLink :to="`/admin/templates/${tpl.id}`" class="text-xs text-brand hover:text-brand-secondary transition-colors font-bold flex items-center gap-1">
                            Detail
                            <ChevronRight class="w-3.5 h-3.5" />
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <ConfirmDialog
            :open="showDeleteConfirm"
            variant="danger"
            title="Hapus Template"
            :message="`Apakah Anda yakin ingin menghapus template '${deletingTemplate?.name}'?`"
            confirm-label="Hapus"
            :loading="saving"
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </DashboardLayout>
</template>
