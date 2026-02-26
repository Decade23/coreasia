<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CertificatePreview from '~/components/organisms/CertificatePreview.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft, Edit, Star } from 'lucide-vue-next'
import { useCertificateTemplates } from '~/composables/useCertificateTemplates'

const route = useRoute()
const id = route.params.id as string

const {
    currentTemplate: template, loading, error,
    fetchTemplate,
} = useCertificateTemplates()

onMounted(() => fetchTemplate(id))
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <NuxtLink to="/admin/templates" class="w-10 h-10 rounded-xl bg-tint flex items-center justify-center text-content-subtle hover:text-content hover:bg-tint-hover transition-all shrink-0">
                    <ArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <h1 class="text-xl md:text-3xl font-black tracking-tight text-content truncate">
                            {{ template?.name || 'Detail Template' }}
                        </h1>
                        <span v-if="template?.isDefault" class="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/30 shrink-0">
                            <Star class="w-3 h-3" />
                            Default
                        </span>
                    </div>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Preview dan konfigurasi field template sertifikat.</p>
                </div>
                <CaButton v-if="template" variant="outline" class="shrink-0">
                    <Edit class="w-4 h-4 mr-1.5" />
                    Edit
                </CaButton>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat template..." />
            </div>

            <template v-else-if="template">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Info Card -->
                    <div class="ca-card p-0 overflow-hidden">
                        <div class="p-6 border-b border-divider">
                            <h2 class="text-sm font-bold text-content-subtle uppercase tracking-widest">Informasi Template</h2>
                        </div>
                        <div class="p-6 space-y-4">
                            <div>
                                <p class="text-xs text-content-subtle">Nama Template</p>
                                <p class="text-sm font-bold text-content">{{ template.name }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-content-subtle">Deskripsi</p>
                                <p class="text-sm text-content-muted">{{ template.description }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-content-subtle">Skema</p>
                                <p class="text-sm font-bold text-content">{{ template.schemeName }}</p>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <p class="text-xs text-content-subtle">Dibuat</p>
                                    <p class="text-sm text-content">{{ template.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-content-subtle">Diperbarui</p>
                                    <p class="text-sm text-content">{{ template.updatedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Preview -->
                    <div class="lg:col-span-2 ca-card p-0 overflow-hidden">
                        <div class="p-6 border-b border-divider">
                            <h2 class="text-sm font-bold text-content-subtle uppercase tracking-widest">Preview & Fields</h2>
                        </div>
                        <div class="p-6">
                            <CertificatePreview :template="template" />
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </DashboardLayout>
</template>
