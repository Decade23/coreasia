<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
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

const { t, locale } = useI18n()

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
    const loc = locale.value === 'en' ? 'en-US' : 'id-ID'
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
    const s = start.toLocaleDateString(loc, opts)
    const e = end.toLocaleDateString(loc, opts)
    return s === e ? s : `${s} - ${e}`
}

const typeLabel = (type: string) => t(`admin.schedules.types.${type}`) || type

const statusVariant = (status: string): 'success' | 'warning' | 'default' => {
    switch (status) {
        case 'published': return 'success'
        case 'ongoing': return 'warning'
        default: return 'default'
    }
}

const statusLabel = (status: string) => t(`admin.schedules.status.${status}`) || status
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="text-lg font-bold text-content hidden lg:block">{{ t('admin.schedules.title') }}</h1>
        </template>

        <div class="py-6 space-y-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('admin.schedules.title') }]" />
                <PageHeader :title="t('admin.schedules.title')" :subtitle="t('admin.schedules.subtitle')">
                    <template #actions>
                        <CaButton variant="primary" @click="handleCreate">
                            <Plus class="w-4 h-4 mr-2" />
                            {{ t('admin.schedules.newSchedule') }}
                        </CaButton>
                    </template>
                </PageHeader>
            </div>

            <!-- Search -->
            <div class="max-w-md">
                <CaInputSearch v-model="searchQuery" :placeholder="t('admin.schedules.searchPlaceholder')" />
            </div>

            <!-- Error -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" :label="t('admin.schedules.loadingSchedules')" />
            </div>

            <!-- Empty State -->
            <EmptyState
                v-else-if="schedules.length === 0 && !loading"
                :title="t('admin.schedules.empty')"
                :description="t('admin.schedules.emptyDesc')"
            >
                <template #action>
                    <CaButton variant="primary" @click="handleCreate">
                        <Plus class="w-4 h-4 mr-2" />
                        {{ t('admin.schedules.newSchedule') }}
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
                            <p class="text-content-muted text-sm mt-1">{{ jadwal.schemeName }}</p>
                        </div>
                        <div class="relative">
                            <button
                                class="text-content-subtle hover:text-content transition-colors p-1.5 bg-tint rounded-lg border border-divider"
                                @click="toggleMenu(jadwal.id)"
                            >
                                <MoreVertical class="w-4 h-4" />
                            </button>
                            <div
                                v-if="openMenuId === jadwal.id"
                                class="absolute right-0 top-full mt-1 w-36 bg-surface border border-divider rounded-xl shadow-glass-lg z-20 py-1 overflow-hidden"
                            >
                                <button
                                    class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-content-subtle hover:text-content hover:bg-tint transition-colors"
                                    @click="handleEdit(jadwal)"
                                >
                                    <Edit3 class="w-3.5 h-3.5" /> {{ t('common.edit') }}
                                </button>
                                <button
                                    class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                    @click="handleDeleteClick(jadwal)"
                                >
                                    <Trash2 class="w-3.5 h-3.5" /> {{ t('common.delete') }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div class="flex items-start gap-3">
                            <div class="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                                <Calendar class="w-4 h-4 text-brand" />
                            </div>
                            <div>
                                <span class="text-[10px] font-black uppercase text-content-faint tracking-widest block mb-0.5">{{ t('admin.schedules.time') }}</span>
                                <span class="text-sm font-semibold text-content">{{ formatDateRange(jadwal.startDate, jadwal.endDate) }}</span>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                                <MapPin class="w-4 h-4 text-brand" />
                            </div>
                            <div>
                                <span class="text-[10px] font-black uppercase text-content-faint tracking-widest block mb-0.5">{{ t('admin.schedules.method') }}</span>
                                <span class="text-sm font-semibold text-content">{{ typeLabel(jadwal.type) }}</span>
                                <span class="text-content-muted block text-xs truncate">{{ jadwal.location }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-tint-subtle border border-divider">
                        <div class="flex items-center gap-2 w-full sm:w-auto">
                            <Users class="w-4 h-4 text-brand" />
                            <div class="flex-1">
                                <div class="flex justify-between w-full mb-1">
                                    <span class="text-xs font-bold text-content">
                                        {{ jadwal.currentParticipants }}
                                        <span class="text-content-faint font-medium text-[10px] uppercase">{{ t('admin.schedules.filledOf') }}</span>
                                        {{ jadwal.maxParticipants }}
                                        <span class="text-content-faint font-medium text-[10px] uppercase">{{ t('admin.schedules.filled') }}</span>
                                    </span>
                                </div>
                                <div class="w-full sm:w-32 h-1.5 bg-core-800 rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all"
                                        :class="jadwal.currentParticipants === jadwal.maxParticipants ? 'bg-brand-secondary' : 'bg-brand'"
                                        :style="{ width: `${(jadwal.currentParticipants / jadwal.maxParticipants) * 100}%` }"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="flex -space-x-2">
                            <div
                                v-for="assessor in jadwal.assessors"
                                :key="assessor.id"
                                class="w-8 h-8 rounded-full bg-linear-to-br from-core-700 to-core-800 border-2 border-surface flex items-center justify-center text-[10px] font-black text-brand shadow-sm"
                                :title="assessor.name"
                            >
                                {{ assessor.initials }}
                            </div>
                            <div class="w-8 h-8 rounded-full border-2 border-dashed border-divider-strong flex items-center justify-center group cursor-pointer hover:border-brand/40 transition-colors" :title="t('admin.schedules.addAssessor')">
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
            :title="t('admin.schedules.deleteTitle')"
            :message="t('admin.schedules.deleteMessage', { name: deletingSchedule?.title || '' })"
            :confirm-label="t('common.delete')"
            :loading="saving"
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </DashboardLayout>
</template>
