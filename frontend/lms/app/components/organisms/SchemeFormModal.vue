<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'
import type { SchemeDomain, SchemeFormData } from '~/types/scheme'
import { useFormValidation, required, minLength, maxLength, numericOnly } from '~/composables/useFormValidation'

const props = defineProps<{
    open: boolean
    scheme?: SchemeDomain | null
    saving?: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', data: SchemeFormData): void
}>()

const isEditing = computed(() => !!props.scheme)

const form = reactive<SchemeFormData>({
    code: '',
    name: '',
    description: '',
    validityYears: 3,
    isActive: true,
    unitIds: [],
})

const { errors, validate, resetErrors, clearFieldError } = useFormValidation(form, {
    code: [required('Kode Skema'), minLength('Kode Skema', 2), maxLength('Kode Skema', 10)],
    name: [required('Nama Skema'), minLength('Nama Skema', 3)],
    description: [required('Deskripsi')],
    validityYears: [required('Masa Berlaku')],
})

watch(() => props.open, (val) => {
    if (val && props.scheme) {
        form.code = props.scheme.code
        form.name = props.scheme.name
        form.description = props.scheme.description
        form.validityYears = props.scheme.validityYears
        form.isActive = props.scheme.isActive
        form.unitIds = props.scheme.units.map(u => u.id)
    } else if (val) {
        form.code = ''
        form.name = ''
        form.description = ''
        form.validityYears = 3
        form.isActive = true
        form.unitIds = []
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
                <div class="absolute inset-0 bg-[#050814]/80 backdrop-blur-sm" @click="emit('close')" />

                <div class="relative w-full max-w-2xl ca-card p-0 z-10 max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-white/5">
                        <h2 class="text-xl font-bold text-white">
                            {{ isEditing ? 'Edit Skema' : 'Tambah Skema Baru' }}
                        </h2>
                        <button
                            class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-content-subtle hover:text-white hover:bg-white/10 transition-all"
                            @click="emit('close')"
                        >
                            <X class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="p-6 space-y-5 overflow-y-auto flex-1">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <BaseInput
                                    id="scheme-code"
                                    label="Kode Skema"
                                    v-model="form.code"
                                    placeholder="Contoh: JWD"
                                    required
                                    :error="errors.code"
                                    @update:model-value="clearFieldError('code')"
                                />
                            </div>
                            <div>
                                <BaseInput
                                    id="scheme-validity"
                                    label="Masa Berlaku (Tahun)"
                                    type="number"
                                    v-model="form.validityYears"
                                    placeholder="3"
                                    required
                                    :error="errors.validityYears"
                                    @update:model-value="clearFieldError('validityYears')"
                                />
                            </div>
                        </div>

                        <BaseInput
                            id="scheme-name"
                            label="Nama Skema"
                            v-model="form.name"
                            placeholder="Contoh: Junior Web Developer"
                            required
                            :error="errors.name"
                            @update:model-value="clearFieldError('name')"
                        />

                        <BaseTextarea
                            id="scheme-desc"
                            label="Deskripsi"
                            v-model="form.description"
                            placeholder="Deskripsi singkat tentang skema sertifikasi ini..."
                            required
                            :error="errors.description"
                            @update:model-value="clearFieldError('description')"
                        />

                        <!-- Status Toggle -->
                        <div class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                                <p class="text-sm font-bold text-white">Status Skema</p>
                                <p class="text-xs text-content-subtle mt-0.5">Skema aktif dapat digunakan untuk pendaftaran</p>
                            </div>
                            <button
                                type="button"
                                class="relative w-12 h-7 rounded-full transition-colors duration-200"
                                :class="form.isActive ? 'bg-brand' : 'bg-white/10'"
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
                    <div class="flex items-center justify-end gap-3 p-6 border-t border-white/5">
                        <CaButton variant="outline" :disabled="saving" @click="emit('close')">
                            Batal
                        </CaButton>
                        <CaButton variant="primary" :loading="saving" @click="handleSubmit">
                            {{ isEditing ? 'Simpan Perubahan' : 'Buat Skema' }}
                        </CaButton>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
