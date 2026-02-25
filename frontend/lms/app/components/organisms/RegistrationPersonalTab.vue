<script setup lang="ts">
import type { PersonalData } from '../../types/registration'

const props = defineProps<{
    modelValue: PersonalData
    errors?: Record<string, string>
}>()

const emit = defineEmits(['update:modelValue', 'clearError'])

const updateData = (key: keyof PersonalData, value: string) => {
    emit('update:modelValue', { ...props.modelValue, [key]: value })
    emit('clearError', key)
}
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-10 rounded-[2.5rem] glass-card">
        <div class="space-y-2">
            <BaseInput
                id="reg-nama"
                label="Nama Lengkap"
                :model-value="modelValue.fullName"
                @update:model-value="(val: string | number) => updateData('fullName', val as string)"
                placeholder="Sesuai KTP"
                required
                :error="errors?.fullName"
            />
        </div>

        <div class="space-y-2">
            <BaseInput
                id="reg-nik"
                label="NIK (Nomor Induk Kependudukan)"
                :model-value="modelValue.nik"
                @update:model-value="(val: string | number) => updateData('nik', val as string)"
                placeholder="16 Digit Angka"
                required
                :error="errors?.nik"
            />
        </div>

        <div class="space-y-2">
            <BaseInput
                id="reg-pob"
                label="Tempat Lahir"
                :model-value="modelValue.placeOfBirth"
                @update:model-value="(val: string | number) => updateData('placeOfBirth', val as string)"
                placeholder="Kota Kelahiran"
                required
                :error="errors?.placeOfBirth"
            />
        </div>

        <div class="space-y-2">
            <BaseInput
                id="reg-dob"
                type="date"
                label="Tanggal Lahir"
                :model-value="modelValue.dateOfBirth"
                @update:model-value="(val: string | number) => updateData('dateOfBirth', val as string)"
                required
                :error="errors?.dateOfBirth"
            />
        </div>

        <div class="space-y-2">
            <BaseInput
                id="reg-email"
                type="email"
                label="Email"
                :model-value="modelValue.email"
                @update:model-value="(val: string | number) => updateData('email', val as string)"
                placeholder="nama@email.com"
                required
                :error="errors?.email"
            />
        </div>

        <div class="space-y-2">
            <BaseInput
                id="reg-phone"
                type="tel"
                label="Nomor WhatsApp"
                :model-value="modelValue.phoneNumber"
                @update:model-value="(val: string | number) => updateData('phoneNumber', val as string)"
                placeholder="Contoh: 08123456789"
                required
                :error="errors?.phoneNumber"
            />
        </div>

        <div class="md:col-span-2 space-y-2">
            <BaseTextarea
                id="reg-address"
                label="Alamat Lengkap"
                :model-value="modelValue.address"
                @update:model-value="(val: string | number) => updateData('address', val as string)"
                placeholder="Alamat domisili saat ini"
                required
                :error="errors?.address"
            />
        </div>
    </div>
</template>
