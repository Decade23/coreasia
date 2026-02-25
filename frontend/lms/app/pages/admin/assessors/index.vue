<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import AssessorFormModal from '~/components/organisms/AssessorFormModal.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import EmptyState from '~/components/atoms/EmptyState.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { Plus, Shield, Mail, Phone, ChevronRight, Award } from 'lucide-vue-next'
import { useAssessors } from '~/composables/useAssessors'
import type { AssessorProfileDomain, AssessorFormData } from '~/types/assessor-profile'

const {
    assessors, loading, saving, error, searchQuery,
    fetchAssessors, createAssessor, updateAssessor, deleteAssessor,
    getLicenseStatusColor, getLicenseStatusLabel,
} = useAssessors()

const showFormModal = ref(false)
const editingAssessor = ref<AssessorProfileDomain | null>(null)
const showDeleteConfirm = ref(false)
const deletingAssessor = ref<AssessorProfileDomain | null>(null)

onMounted(() => fetchAssessors())

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        fetchAssessors(1, val)
    }, 300)
})

const handleCreate = () => {
    editingAssessor.value = null
    showFormModal.value = true
}

const handleEdit = (assessor: AssessorProfileDomain) => {
    editingAssessor.value = assessor
    showFormModal.value = true
}

const handleSubmitForm = async (data: AssessorFormData) => {
    let success: boolean
    if (editingAssessor.value) {
        success = await updateAssessor(editingAssessor.value.id, data)
    } else {
        success = await createAssessor(data)
    }
    if (success) showFormModal.value = false
}

const handleDeleteClick = (assessor: AssessorProfileDomain) => {
    deletingAssessor.value = assessor
    showDeleteConfirm.value = true
}

const handleConfirmDelete = async () => {
    if (!deletingAssessor.value) return
    const success = await deleteAssessor(deletingAssessor.value.id)
    if (success) {
        showDeleteConfirm.value = false
        deletingAssessor.value = null
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div>
                    <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white">Manajemen Asesor</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola daftar asesor, lisensi, dan penugasan skema.</p>
                </div>
                <div class="flex items-center gap-4 shrink-0">
                    <div class="relative hidden lg:block w-64 xl:w-80 mr-2">
                        <CaInputSearch v-model="searchQuery" placeholder="Cari asesor..." />
                    </div>
                    <CaButton variant="primary" class="rounded-full px-6 py-3 flex items-center gap-2 transition-all hover:scale-105" @click="handleCreate">
                        <Plus class="w-4 h-4" />
                        <span class="hidden sm:inline">Asesor Baru</span>
                    </CaButton>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-8">
            <!-- Mobile Search -->
            <div class="lg:hidden">
                <CaInputSearch v-model="searchQuery" placeholder="Cari nama atau email asesor..." />
            </div>

            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat data asesor..." />
            </div>

            <EmptyState
                v-else-if="assessors.length === 0 && !loading"
                title="Belum ada asesor"
                description="Mulai dengan menambahkan asesor pertama untuk LSP Anda."
            >
                <template #action>
                    <CaButton variant="primary" @click="handleCreate">
                        <Plus class="w-4 h-4 mr-2" />
                        Tambah Asesor
                    </CaButton>
                </template>
            </EmptyState>

            <!-- Assessor Cards -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div
                    v-for="assessor in assessors"
                    :key="assessor.id"
                    class="ca-card p-0 overflow-hidden group hover:border-white/10 transition-all duration-300"
                >
                    <!-- Card Header -->
                    <div class="p-5 border-b border-white/5">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/20 to-brand-secondary/20 flex items-center justify-center text-brand font-black text-lg shrink-0">
                                    {{ assessor.fullName.charAt(0) }}
                                </div>
                                <div>
                                    <h3 class="font-bold text-white text-base group-hover:text-brand transition-colors">{{ assessor.fullName }}</h3>
                                    <p class="text-xs text-content-subtle">{{ assessor.specialization }}</p>
                                </div>
                            </div>
                            <span
                                class="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                                :class="assessor.isActive ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-red-500/50'"
                                :title="assessor.isActive ? 'Aktif' : 'Nonaktif'"
                            />
                        </div>
                    </div>

                    <!-- Card Body -->
                    <div class="p-5 space-y-3">
                        <div class="flex items-center gap-2 text-sm text-content-muted">
                            <Mail class="w-4 h-4 text-content-subtle shrink-0" />
                            <span class="truncate">{{ assessor.email }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-content-muted">
                            <Phone class="w-4 h-4 text-content-subtle shrink-0" />
                            <span>{{ assessor.phoneNumber }}</span>
                        </div>

                        <!-- License -->
                        <div v-if="assessor.license" class="flex items-center gap-2">
                            <Shield class="w-4 h-4 text-content-subtle shrink-0" />
                            <span class="text-sm text-content-muted font-mono">{{ assessor.license.licenseNumber }}</span>
                            <span
                                class="ml-auto px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border"
                                :class="getLicenseStatusColor(assessor.license.status)"
                            >
                                {{ getLicenseStatusLabel(assessor.license.status) }}
                            </span>
                        </div>
                        <div v-else class="flex items-center gap-2 text-sm text-content-subtle italic">
                            <Shield class="w-4 h-4 shrink-0" />
                            <span>Belum ada lisensi</span>
                        </div>

                        <!-- Stats -->
                        <div class="flex items-center gap-4 pt-2">
                            <div class="flex items-center gap-1.5">
                                <Award class="w-3.5 h-3.5 text-brand" />
                                <span class="text-xs text-content-muted">
                                    <strong class="text-white">{{ assessor.completedAssessments }}</strong>/{{ assessor.totalAssessments }} asesmen
                                </span>
                            </div>
                            <div class="text-xs text-content-subtle">
                                {{ assessor.assignedSchemes.length }} skema
                            </div>
                        </div>
                    </div>

                    <!-- Card Footer -->
                    <div class="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                        <div class="flex gap-2">
                            <button
                                class="text-xs text-content-subtle hover:text-brand transition-colors font-bold"
                                @click="handleEdit(assessor)"
                            >
                                Edit
                            </button>
                            <span class="text-content-subtle/30">|</span>
                            <button
                                class="text-xs text-content-subtle hover:text-red-400 transition-colors font-bold"
                                @click="handleDeleteClick(assessor)"
                            >
                                Hapus
                            </button>
                        </div>
                        <NuxtLink :to="`/admin/assessors/${assessor.id}`" class="text-xs text-brand hover:text-brand-secondary transition-colors font-bold flex items-center gap-1">
                            Detail
                            <ChevronRight class="w-3.5 h-3.5" />
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <AssessorFormModal
            :open="showFormModal"
            :assessor="editingAssessor"
            :saving="saving"
            @close="showFormModal = false"
            @submit="handleSubmitForm"
        />

        <ConfirmDialog
            :open="showDeleteConfirm"
            variant="danger"
            title="Hapus Asesor"
            :message="`Apakah Anda yakin ingin menghapus asesor '${deletingAssessor?.fullName}'? Tindakan ini tidak dapat dibatalkan.`"
            confirm-label="Hapus"
            :loading="saving"
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </DashboardLayout>
</template>
