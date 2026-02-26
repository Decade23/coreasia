<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import ScheduleFormModal from '~/components/organisms/ScheduleFormModal.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import EmptyState from '~/components/atoms/EmptyState.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import BaseBadge from '~/components/atoms/BaseBadge.vue'
import { Plus, Calendar, MapPin, Users, MoreVertical, Edit3, Trash2 } from 'lucide-vue-next'
import { useSchedules } from '~/composables/useSchedules'
import { useSchemes } from '~/composables/useSchemes'
import type { ScheduleDomain, ScheduleFormData } from '~/types/schedule'

const {
    schedules, loading, saving, error,
    fetchSchedules, createSchedule, updateSchedule, deleteSchedule,
} = useSchedules()

const { schemes, fetchSchemes } = useSchemes()

const searchQuery = ref('')
const showFormModal = ref(false)
const editingSchedule = ref<ScheduleDomain | null>(null)
const showDeleteConfirm = ref(false)
const deletingSchedule = ref<ScheduleDomain | null>(null)
const openMenuId = ref<string | null>(null)

const schemeSelectOptions = computed(() =>
    schemes.value.map(s => ({ value: s.id, label: s.name }))
)

onMounted(async () => {
    await Promise.all([
        fetchSchedules(),
        fetchSchemes(),
    ])
})

const handleCreate = () => {
    editingSchedule.value = null
    showFormModal.value = true
}

const handleEdit = (schedule: ScheduleDomain) => {
    editingSchedule.value = schedule
    openMenuId.value = null
    showFormModal.value = true
}

const handleSubmitForm = async (data: ScheduleFormData) => {
    let success: boolean
    if (editingSchedule.value) {
        success = await updateSchedule(editingSchedule.value.id, data)
    } else {
        success = await createSchedule(data)
    }
    if (success) {
        showFormModal.value = false
    }
}

const handleDeleteClick = (schedule: ScheduleDomain) => {
    deletingSchedule.value = schedule
    openMenuId.value = null
    showDeleteConfirm.value = true
}

const handleConfirmDelete = async () => {
    if (!deletingSchedule.value) return
    const success = await deleteSchedule(deletingSchedule.value.id)
    if (success) {
        showDeleteConfirm.value = false
        deletingSchedule.value = null
    }
}

const toggleMenu = (id: string) => {
    openMenuId.value = openMenuId.value === id ? null : id
}

const formatDateRange = (start: Date, end: Date) => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
    const s = start.toLocaleDateString('id-ID', opts)
    const e = end.toLocaleDateString('id-ID', opts)
    return s === e ? s : `${s} - ${e}`
}

const typeLabel = (type: string) => {
    switch (type) {
        case 'cbt_online': return 'CBT Online'
        case 'lab_offline': return 'Lab Offline'
        case 'hybrid': return 'Hybrid'
        default: return type
    }
}

const statusVariant = (status: string): 'success' | 'warning' | 'default' => {
    switch (status) {
        case 'published': return 'success'
        case 'ongoing': return 'warning'
        default: return 'default'
    }
}

const statusLabel = (status: string) => {
    switch (status) {
        case 'draft': return 'Draft'
        case 'published': return 'Terpublikasi'
        case 'ongoing': return 'Berlangsung'
        case 'completed': return 'Selesai'
        case 'cancelled': return 'Dibatalkan'
        default: return status
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div>
                    <h1 class="text-xl md:text-3xl font-bold truncate mr-4 text-content">Penjadwalan Ujian</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Atur jadwal, kuota, dan plotting asesor ujian kompetensi.</p>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                    <CaButton variant="primary" size="sm" @click="handleCreate">
                        <Plus class="w-4 h-4 mr-2" />
                        Jadwal Baru
                    </CaButton>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <!-- Toolbar -->
            <div class="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-core-800 border border-divider shadow-xl glass-card">
                <div class="w-full sm:w-96">
                    <CaInputSearch v-model="searchQuery" placeholder="Cari nama jadwal..." />
                </div>
            </div>

            <!-- Error -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat jadwal..." />
            </div>

            <!-- Empty State -->
            <EmptyState
                v-else-if="schedules.length === 0 && !loading"
                title="Belum ada jadwal"
                description="Buat jadwal ujian pertama untuk memulai."
            >
                <template #action>
                    <CaButton variant="primary" @click="handleCreate">
                        <Plus class="w-4 h-4 mr-2" />
                        Jadwal Baru
                    </CaButton>
                </template>
            </EmptyState>

            <!-- Schedule Cards -->
            <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div v-for="jadwal in schedules" :key="jadwal.id" class="ca-card group p-6">
                    <div class="flex pb-4 border-b border-divider justify-between items-start mb-4">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-black text-brand uppercase tracking-widest">{{ jadwal.id }}</span>
                                <BaseBadge :text="statusLabel(jadwal.status)" :variant="statusVariant(jadwal.status)" />
                            </div>
                            <h3 class="text-lg font-bold text-content mt-1">{{ jadwal.title }}</h3>
                            <p class="text-content-muted text-sm mt-1 saturate-50">{{ jadwal.schemeName }}</p>
                        </div>
                        <div class="relative">
                            <button
                                class="text-content-subtle hover:text-content transition-colors p-1 bg-tint rounded-lg border border-divider-strong"
                                @click="toggleMenu(jadwal.id)"
                            >
                                <MoreVertical class="w-4 h-4" />
                            </button>
                            <div
                                v-if="openMenuId === jadwal.id"
                                class="absolute right-0 top-full mt-1 w-36 bg-core-800 border border-divider-strong rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                            >
                                <button
                                    class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-content-subtle hover:text-content hover:bg-tint transition-colors"
                                    @click="handleEdit(jadwal)"
                                >
                                    <Edit3 class="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                    class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                    @click="handleDeleteClick(jadwal)"
                                >
                                    <Trash2 class="w-3.5 h-3.5" /> Hapus
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-lg bg-tint border border-divider-strong flex items-center justify-center shrink-0">
                                <Calendar class="w-4 h-4 text-brand" />
                            </div>
                            <div>
                                <span class="text-[10px] font-black uppercase text-content-subtle tracking-widest block mb-0.5">Waktu</span>
                                <span class="text-sm font-medium text-content">{{ formatDateRange(jadwal.startDate, jadwal.endDate) }}</span>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-lg bg-tint border border-divider-strong flex items-center justify-center shrink-0">
                                <MapPin class="w-4 h-4 text-brand" />
                            </div>
                            <div>
                                <span class="text-[10px] font-black uppercase text-content-subtle tracking-widest block mb-0.5">Metode</span>
                                <span class="text-sm font-medium text-content">{{ typeLabel(jadwal.type) }}</span>
                                <span class="text-content-muted block text-xs truncate">{{ jadwal.location }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-core-900/50 border border-divider">
                        <div class="flex items-center gap-2 w-full sm:w-auto">
                            <Users class="w-4 h-4 text-cyan-400" />
                            <div class="flex-1">
                                <div class="flex justify-between w-full mb-1">
                                    <span class="text-xs font-bold text-content">
                                        {{ jadwal.currentParticipants }}
                                        <span class="text-content-subtle font-medium text-[10px] uppercase">dari</span>
                                        {{ jadwal.maxParticipants }}
                                        <span class="text-content-subtle font-medium text-[10px] uppercase">Terisi</span>
                                    </span>
                                </div>
                                <div class="w-full sm:w-32 h-1.5 bg-core-800 rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all"
                                        :class="jadwal.currentParticipants === jadwal.maxParticipants ? 'bg-brand-secondary' : 'bg-cyan-400'"
                                        :style="{ width: `${(jadwal.currentParticipants / jadwal.maxParticipants) * 100}%` }"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="flex -space-x-2">
                            <div
                                v-for="assessor in jadwal.assessors"
                                :key="assessor.id"
                                class="w-8 h-8 rounded-full bg-linear-to-br from-core-700 to-core-800 border-2 border-core-800 flex items-center justify-center text-[10px] font-black text-brand shadow-sm"
                                :title="assessor.name"
                            >
                                {{ assessor.initials }}
                            </div>
                            <div class="w-8 h-8 rounded-full bg-core-900 border-2 border-core-800 border-dashed flex items-center justify-center group cursor-pointer hover:border-brand/40 transition-colors" title="Tambah Asesor">
                                <Plus class="w-3 h-3 text-content-subtle group-hover:text-brand" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Form Modal -->
        <ScheduleFormModal
            :open="showFormModal"
            :schedule="editingSchedule"
            :saving="saving"
            :scheme-options="schemeSelectOptions"
            @close="showFormModal = false"
            @submit="handleSubmitForm"
        />

        <!-- Delete Confirmation -->
        <ConfirmDialog
            :open="showDeleteConfirm"
            variant="danger"
            title="Hapus Jadwal"
            :message="`Apakah Anda yakin ingin menghapus jadwal '${deletingSchedule?.title}'?`"
            confirm-label="Hapus"
            :loading="saving"
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </DashboardLayout>
</template>
