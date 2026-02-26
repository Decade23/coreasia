<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'
import type { AssessorProfileDomain, AssessorFormData } from '~/types/assessor-profile'
import { useFormValidation, required, email, minLength, phoneNumber } from '~/composables/useFormValidation'

const props = defineProps<{
    open: boolean
    assessor?: AssessorProfileDomain | null
    saving?: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', data: AssessorFormData): void
}>()

const isEditing = computed(() => !!props.assessor)

const form = reactive<AssessorFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    isActive: true,
    licenseNumber: '',
    schemeIds: [],
})

const { errors, validate, resetErrors, clearFieldError } = useFormValidation(form, {
    fullName: [required('Nama Lengkap'), minLength('Nama Lengkap', 3)],
    email: [required('Email'), email()],
    phoneNumber: [required('No. Telepon'), phoneNumber()],
    specialization: [required('Spesialisasi')],
})

watch(() => props.open, (val) => {
    if (val && props.assessor) {
        form.fullName = props.assessor.fullName
        form.email = props.assessor.email
        form.phoneNumber = props.assessor.phoneNumber
        form.specialization = props.assessor.specialization
        form.isActive = props.assessor.isActive
        form.licenseNumber = props.assessor.license?.licenseNumber ?? ''
        form.schemeIds = props.assessor.assignedSchemes.map(s => s.schemeId)
    } else if (val) {
        form.fullName = ''
        form.email = ''
        form.phoneNumber = ''
        form.specialization = ''
        form.isActive = true
        form.licenseNumber = ''
        form.schemeIds = []
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
                            {{ isEditing ? 'Edit Asesor' : 'Tambah Asesor Baru' }}
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
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <BaseInput
                                id="assessor-name"
                                label="Nama Lengkap"
                                v-model="form.fullName"
                                placeholder="Contoh: Hendrik Kurniawan"
                                required
                                :error="errors.fullName"
                                @update:model-value="clearFieldError('fullName')"
                            />
                            <BaseInput
                                id="assessor-email"
                                label="Email"
                                type="email"
                                v-model="form.email"
                                placeholder="asesor@coreasia.id"
                                required
                                :error="errors.email"
                                @update:model-value="clearFieldError('email')"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <BaseInput
                                id="assessor-phone"
                                label="No. Telepon"
                                v-model="form.phoneNumber"
                                placeholder="081234567890"
                                required
                                :error="errors.phoneNumber"
                                @update:model-value="clearFieldError('phoneNumber')"
                            />
                            <BaseInput
                                id="assessor-license"
                                label="No. Lisensi BNSP"
                                v-model="form.licenseNumber"
                                placeholder="MET.000.001234"
                            />
                        </div>

                        <BaseInput
                            id="assessor-spec"
                            label="Spesialisasi"
                            v-model="form.specialization"
                            placeholder="Contoh: Web Development & Programming"
                            required
                            :error="errors.specialization"
                            @update:model-value="clearFieldError('specialization')"
                        />

                        <!-- Status Toggle -->
                        <div class="flex items-center justify-between p-4 rounded-xl bg-tint border border-divider">
                            <div>
                                <p class="text-sm font-bold text-content">Status Asesor</p>
                                <p class="text-xs text-content-subtle mt-0.5">Asesor aktif dapat ditugaskan untuk jadwal penilaian</p>
                            </div>
                            <button
                                type="button"
                                class="relative w-12 h-7 rounded-full transition-colors duration-200"
                                :class="form.isActive ? 'bg-brand' : 'bg-tint-strong'"
                                @click="form.isActive = !form.isActive"
                            >
                                <span
                                    class="absolute top-1 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                                    :class="form.isActive ? 'translate-x-6' : 'translate-x-1'"
                                />
                            </button>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-end gap-3 p-6 border-t border-divider">
                        <CaButton variant="outline" :disabled="saving" @click="emit('close')">
                            Batal
                        </CaButton>
                        <CaButton variant="primary" :loading="saving" @click="handleSubmit">
                            {{ isEditing ? 'Simpan Perubahan' : 'Tambah Asesor' }}
                        </CaButton>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
