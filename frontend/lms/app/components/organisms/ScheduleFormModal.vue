<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'
import type { ScheduleDomain, ScheduleFormData, ScheduleType } from '~/types/schedule'
import { useFormValidation, required } from '~/composables/useFormValidation'

const props = defineProps<{
    open: boolean
    schedule?: ScheduleDomain | null
    saving?: boolean
    schemeOptions?: { value: string; label: string }[]
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', data: ScheduleFormData): void
}>()

const isEditing = computed(() => !!props.schedule)

const form = reactive<ScheduleFormData>({
    title: '',
    schemeId: '',
    type: 'cbt_online',
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: 30,
    assessorIds: [],
})

const { errors, validate, resetErrors, clearFieldError } = useFormValidation(form, {
    title: [required('Nama Jadwal')],
    schemeId: [required('Skema')],
    startDate: [required('Tanggal Mulai')],
    endDate: [required('Tanggal Selesai')],
    location: [required('Lokasi')],
    maxParticipants: [required('Kuota Peserta')],
})

const typeOptions: { value: ScheduleType; label: string }[] = [
    { value: 'cbt_online', label: 'CBT Online' },
    { value: 'lab_offline', label: 'Lab Offline' },
    { value: 'hybrid', label: 'Hybrid' },
]

watch(() => props.open, (val) => {
    if (val && props.schedule) {
        form.title = props.schedule.title
        form.schemeId = props.schedule.schemeId
        form.type = props.schedule.type
        form.startDate = props.schedule.startDate.toISOString().split('T')[0]!
        form.endDate = props.schedule.endDate.toISOString().split('T')[0]!
        form.location = props.schedule.location
        form.maxParticipants = props.schedule.maxParticipants
        form.assessorIds = props.schedule.assessors.map(a => a.id)
    } else if (val) {
        form.title = ''
        form.schemeId = ''
        form.type = 'cbt_online'
        form.startDate = ''
        form.endDate = ''
        form.location = ''
        form.maxParticipants = 30
        form.assessorIds = []
    }
    resetErrors()
})

const handleSubmit = () => {
    if (!validate()) return
    emit('submit', { ...form })
}
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 backdrop-blur-sm" :style="{ background: 'var(--th-overlay)' }" @click="emit('close')" />

                <div class="relative w-full max-w-2xl ca-card p-0 z-10 max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-divider">
                        <h2 class="text-xl font-bold text-content">
                            {{ isEditing ? 'Edit Jadwal' : 'Buat Jadwal Baru' }}
                        </h2>
                        <button
                            class="w-10 h-10 rounded-xl bg-tint flex items-center justify-center text-content-subtle hover:text-content hover:bg-tint-hover transition-all"
                            @click="emit('close')"
                        >
                            <X class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="p-6 space-y-5 overflow-y-auto flex-1">
                        <BaseInput
                            id="sched-title"
                            label="Nama Jadwal"
                            v-model="form.title"
                            placeholder="Contoh: Ujian JWD Gelombang 1"
                            required
                            :error="errors.title"
                            @update:model-value="clearFieldError('title')"
                        />

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CaSelect
                                id="sched-scheme"
                                label="Skema Sertifikasi"
                                :options="schemeOptions || []"
                                v-model="form.schemeId"
                                placeholder="Pilih skema..."
                            />
                            <CaSelect
                                id="sched-type"
                                label="Metode Ujian"
                                :options="typeOptions"
                                v-model="form.type"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <BaseInput
                                id="sched-start"
                                type="date"
                                label="Tanggal Mulai"
                                v-model="form.startDate"
                                required
                                :error="errors.startDate"
                                @update:model-value="clearFieldError('startDate')"
                            />
                            <BaseInput
                                id="sched-end"
                                type="date"
                                label="Tanggal Selesai"
                                v-model="form.endDate"
                                required
                                :error="errors.endDate"
                                @update:model-value="clearFieldError('endDate')"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <BaseInput
                                id="sched-location"
                                label="Lokasi"
                                v-model="form.location"
                                placeholder="Contoh: LMS CoreAsia"
                                required
                                :error="errors.location"
                                @update:model-value="clearFieldError('location')"
                            />
                            <BaseInput
                                id="sched-max"
                                type="number"
                                label="Kuota Peserta"
                                v-model="form.maxParticipants"
                                required
                                :error="errors.maxParticipants"
                                @update:model-value="clearFieldError('maxParticipants')"
                            />
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-end gap-3 p-6 border-t border-divider">
                        <CaButton variant="outline" :disabled="saving" @click="emit('close')">
                            Batal
                        </CaButton>
                        <CaButton variant="primary" :loading="saving" @click="handleSubmit">
                            {{ isEditing ? 'Simpan Perubahan' : 'Buat Jadwal' }}
                        </CaButton>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
