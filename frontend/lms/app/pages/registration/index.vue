<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import FormStepIndicator from '~/components/molecules/FormStepIndicator.vue'
import RegistrationPersonalTab from '~/components/organisms/RegistrationPersonalTab.vue'
import RegistrationCompetencyTab from '~/components/organisms/RegistrationCompetencyTab.vue'
import RegistrationUploadTab from '~/components/organisms/RegistrationUploadTab.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-vue-next'
import type { PersonalData, CompetencyData } from '~/types/registration'
import { RegistrationAdapter } from '~/adapters/RegistrationAdapter'
import {
    useFormValidation,
    required,
    email as emailRule,
    exactLength,
    numericOnly,
    phoneNumber,
} from '~/composables/useFormValidation'

definePageMeta({
    layout: false,
})

const steps = ['Data Pribadi', 'Kompetensi', 'Unggah Berkas', 'Selesai']
const currentStep = ref(0)
const isFinished = ref(false)
const isLoadingSubmit = ref(false)
const submitError = ref<string | null>(null)

const personalData = ref<PersonalData>({
    fullName: '',
    nik: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: 'L',
    address: '',
    phoneNumber: '',
    email: '',
    lastEducation: '',
})

const competencyData = ref<CompetencyData>({
    schemeId: '',
    purpose: 'sertifikasi',
})

// Validation for personal data step
const { errors: personalErrors, validate: validatePersonal, clearFieldError } = useFormValidation(personalData.value, {
    fullName: [required('Nama lengkap')],
    nik: [required('NIK'), numericOnly('NIK'), exactLength('NIK', 16)],
    placeOfBirth: [required('Tempat lahir')],
    dateOfBirth: [required('Tanggal lahir')],
    email: [required('Email'), emailRule()],
    phoneNumber: [required('Nomor WhatsApp'), phoneNumber()],
    address: [required('Alamat')],
})

const nextStep = () => {
    // Validate current step before advancing
    if (currentStep.value === 0) {
        if (!validatePersonal()) return
    }

    if (currentStep.value < steps.length - 1) {
        currentStep.value++
    }
}

const prevStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--
    }
}

const finishRegistration = async () => {
    isLoadingSubmit.value = true
    submitError.value = null
    try {
        const payload = RegistrationAdapter.toDTO(personalData.value, competencyData.value)
        console.log('[Registration] Sending Payload to API:', payload)
        await new Promise((resolve) => setTimeout(resolve, 800))

        isFinished.value = true
        currentStep.value = 3
    } catch (error: any) {
        submitError.value = error?.message || 'Gagal mengirim pendaftaran. Silakan coba lagi.'
        console.error('Submit Registration Failed', error)
    } finally {
        isLoadingSubmit.value = false
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <h1 class="text-lg md:text-xl font-bold text-content truncate mr-2">Pendaftaran Mandiri (APL-01)</h1>
                <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 shrink-0">
                    <div class="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    <span class="text-[10px] font-black text-brand uppercase tracking-widest hidden md:inline"
                        >Sesi Aktif</span
                    >
                    <span class="text-[10px] font-black text-brand uppercase tracking-widest md:hidden">Aktif</span>
                </div>
            </div>
        </template>

        <div class="max-w-4xl mx-auto py-4 lg:py-8">
            <FormStepIndicator :steps="steps" :current-step="currentStep" />

            <div class="mt-8 md:mt-12 transition-all duration-500">
                <!-- Submission Error -->
                <ErrorAlert v-if="submitError" :message="submitError" class="mb-6" @dismiss="submitError = null" />

                <!-- Step 0: Personal -->
                <RegistrationPersonalTab
                    v-if="currentStep === 0"
                    v-model="personalData"
                    :errors="personalErrors"
                    @clear-error="clearFieldError"
                />

                <!-- Step 1: Competency -->
                <RegistrationCompetencyTab v-else-if="currentStep === 1" v-model="competencyData" />

                <!-- Step 2: Upload -->
                <RegistrationUploadTab v-else-if="currentStep === 2" />

                <!-- Step 3: Finished -->
                <div v-else-if="currentStep === 3" class="text-center py-20 animate-fade-in">
                    <div
                        class="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-emerald-500/20"
                    >
                        <CheckCircle class="w-12 h-12 text-emerald-500" />
                    </div>
                    <h2 class="text-3xl font-bold text-content mb-4">Pendaftaran Berhasil!</h2>
                    <p class="text-content-muted max-w-md mx-auto mb-10">
                        Data Anda telah kami terima dan akan segera diverifikasi oleh tim admin LSP. Silakan cek email
                        secara berkala.
                    </p>
                    <CaButton variant="primary" @click="navigateTo('/')"> Kembali ke Dashboard </CaButton>
                </div>
            </div>

            <!-- Navigation Buttons -->
            <div
                v-if="!isFinished"
                class="flex items-center justify-between mt-8 pt-6 md:mt-12 md:pt-8 border-t border-core-800 gap-4"
            >
                <CaButton variant="outline" @click="prevStep" :disabled="currentStep === 0" size="md" class="px-4">
                    <ChevronLeft class="w-4 h-4" />
                    <span class="hidden md:inline">Sebelumnya</span>
                </CaButton>

                <CaButton
                    v-if="currentStep < steps.length - 2"
                    variant="primary"
                    @click="nextStep"
                    size="md"
                    class="flex-1 md:flex-none justify-center px-8"
                >
                    <span class="md:hidden">Lanjut</span>
                    <span class="hidden md:inline">Lanjut ke {{ steps[currentStep + 1] }}</span>
                    <ChevronRight class="w-4 h-4" />
                </CaButton>

                <CaButton
                    v-else
                    variant="secondary"
                    @click="finishRegistration"
                    :loading="isLoadingSubmit"
                    class="bg-emerald-500! hover:bg-emerald-400! flex-1 md:flex-none justify-center px-8"
                >
                    <span class="md:hidden">Kirim</span>
                    <span class="hidden md:inline">Kirim Pendaftaran</span>
                    <CheckCircle v-if="!isLoadingSubmit" class="w-4 h-4" />
                </CaButton>
            </div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
