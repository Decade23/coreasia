<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import SchemeCard from '~/components/organisms/SchemeCard.vue'
import SchemeFormModal from '~/components/organisms/SchemeFormModal.vue'
import SchemeDetailPanel from '~/components/organisms/SchemeDetailPanel.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import EmptyState from '~/components/atoms/EmptyState.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { Plus, Filter } from 'lucide-vue-next'
import { useSchemes } from '~/composables/useSchemes'
import type { SchemeDomain, SchemeFormData } from '~/types/scheme'

const {
    schemes, loading, saving, error, searchQuery,
    fetchSchemes, createScheme, updateScheme, deleteScheme,
} = useSchemes()

// Modal state
const showFormModal = ref(false)
const editingScheme = ref<SchemeDomain | null>(null)
const showDetailPanel = ref(false)
const selectedScheme = ref<SchemeDomain | null>(null)
const showDeleteConfirm = ref(false)
const deletingScheme = ref<SchemeDomain | null>(null)

// Fetch on mount
onMounted(() => fetchSchemes())

// Search with debounce
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        fetchSchemes(1, val)
    }, 300)
})

// CRUD handlers
const handleCreate = () => {
    editingScheme.value = null
    showFormModal.value = true
}

const handleEdit = (scheme: SchemeDomain) => {
    editingScheme.value = scheme
    showDetailPanel.value = false
    showFormModal.value = true
}

const handleManage = (scheme: SchemeDomain) => {
    selectedScheme.value = scheme
    showDetailPanel.value = true
}

const handleSubmitForm = async (data: SchemeFormData) => {
    let success: boolean
    if (editingScheme.value) {
        success = await updateScheme(editingScheme.value.id, data)
    } else {
        success = await createScheme(data)
    }
    if (success) {
        showFormModal.value = false
    }
}

const handleDeleteClick = (scheme: SchemeDomain) => {
    deletingScheme.value = scheme
    showDeleteConfirm.value = true
}

const handleConfirmDelete = async () => {
    if (!deletingScheme.value) return
    const success = await deleteScheme(deletingScheme.value.id)
    if (success) {
        showDeleteConfirm.value = false
        deletingScheme.value = null
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div>
                    <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white">Manajemen Skema</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola daftar sertifikasi dan unit kompetensi aktif.</p>
                </div>

                <div class="flex items-center gap-4 shrink-0">
                    <div class="relative hidden lg:block w-64 xl:w-80 mr-2">
                        <CaInputSearch v-model="searchQuery" placeholder="Cari skema..." />
                    </div>

                    <CaButton variant="primary" class="rounded-full px-6 py-3 flex items-center gap-2 transition-all hover:scale-105" @click="handleCreate">
                        <Plus class="w-4 h-4" />
                        <span class="hidden sm:inline">Skema Baru</span>
                    </CaButton>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-8">
            <!-- Mobile Search -->
            <div class="lg:hidden flex gap-3">
                <CaInputSearch v-model="searchQuery" placeholder="Cari kode atau nama skema..." />
                <button class="shrink-0 w-14 h-14 rounded-xl bg-[#1A2235] flex items-center justify-center text-cyan-400 hover:text-white hover:bg-cyan-500 transition-all">
                    <Filter class="w-5 h-5" />
                </button>
            </div>

            <!-- Error State -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat skema..." />
            </div>

            <!-- Empty State -->
            <EmptyState
                v-else-if="schemes.length === 0 && !loading"
                title="Belum ada skema"
                description="Mulai dengan menambahkan skema sertifikasi pertama Anda."
            >
                <template #action>
                    <CaButton variant="primary" @click="handleCreate">
                        <Plus class="w-4 h-4 mr-2" />
                        Buat Skema
                    </CaButton>
                </template>
            </EmptyState>

            <!-- Data Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SchemeCard
                    v-for="scheme in schemes"
                    :key="scheme.id"
                    :scheme="scheme"
                    @manage="handleManage"
                />
            </div>
        </div>

        <!-- Form Modal -->
        <SchemeFormModal
            :open="showFormModal"
            :scheme="editingScheme"
            :saving="saving"
            @close="showFormModal = false"
            @submit="handleSubmitForm"
        />

        <!-- Detail Slide-over -->
        <SchemeDetailPanel
            :open="showDetailPanel"
            :scheme="selectedScheme"
            @close="showDetailPanel = false"
            @edit="handleEdit"
        />

        <!-- Delete Confirmation -->
        <ConfirmDialog
            :open="showDeleteConfirm"
            variant="danger"
            title="Hapus Skema"
            :message="`Apakah Anda yakin ingin menghapus skema '${deletingScheme?.name}'? Tindakan ini tidak dapat dibatalkan.`"
            confirm-label="Hapus"
            :loading="saving"
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </DashboardLayout>
</template>
