<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import BaseInput from '~/components/atoms/BaseInput.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { Save } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()

const form = reactive({
    fullName: user.value?.fullName || '',
    email: user.value?.email || '',
    phoneNumber: '',
})
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div>
                    <h1 class="text-xl font-bold text-content">Pengaturan Akun</h1>
                    <p class="text-[10px] text-brand font-black uppercase tracking-widest mt-1">Profil asesi</p>
                </div>
            </div>
        </template>

        <div class="max-w-3xl mx-auto w-full py-6">
            <section class="ca-card p-6 md:p-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <BaseInput
                        id="settings-full-name"
                        v-model="form.fullName"
                        label="Nama Lengkap"
                        placeholder="Nama sesuai identitas"
                    />

                    <BaseInput
                        id="settings-email"
                        v-model="form.email"
                        type="email"
                        label="Email"
                        placeholder="nama@email.com"
                        disabled
                    />

                    <div class="md:col-span-2">
                        <BaseInput
                            id="settings-phone"
                            v-model="form.phoneNumber"
                            type="tel"
                            label="Nomor WhatsApp"
                            placeholder="Contoh: 08123456789"
                        />
                    </div>
                </div>

                <div class="mt-8 flex justify-end">
                    <CaButton variant="primary">
                        <Save class="w-4 h-4" />
                        Simpan Perubahan
                    </CaButton>
                </div>
            </section>
        </div>
    </DashboardLayout>
</template>
