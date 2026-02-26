<script setup lang="ts">
import { Play, CheckCircle2 } from 'lucide-vue-next'
import BaseInput from '~/components/atoms/BaseInput.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { useAuth } from '~/composables/useAuth'
import { useFormValidation, required, email as emailRule, minLength } from '~/composables/useFormValidation'

definePageMeta({
    layout: 'auth',
})

const form = reactive({
    email: '',
    password: '',
})

const { errors, validate, clearFieldError } = useFormValidation(form, {
    email: [required('Email'), emailRule()],
    password: [required('Kata sandi'), minLength('Kata sandi', 4)],
})

const { login, pending, loginError } = useAuth()

const handleLogin = async () => {
    if (!validate()) return
    await login(form.email, form.password)
}
</script>

<template>
    <div class="w-full max-w-md p-6 sm:p-8 md:p-12 ca-card group transition-all duration-700 mx-4">
        <!-- Glow Effect -->
        <div
            class="absolute -top-32 -right-32 w-64 h-64 bg-brand/10 rounded-full blur-[80px] group-hover:bg-brand/20 transition-colors duration-700 pointer-events-none"
        />
        <div
            class="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-300/10 rounded-full blur-[80px] group-hover:bg-brand-400/10 transition-colors duration-700 pointer-events-none"
        />

        <div class="relative z-10">
            <div
                class="w-16 h-16 rounded-2xl bg-tint border border-divider-strong flex items-center justify-center mb-8 shadow-inner shadow-black/50 mx-auto md:mx-0"
            >
                <Play class="w-8 h-8 text-brand fill-brand/20" />
            </div>

            <h1 class="text-3xl md:text-4xl font-black mb-3 tracking-tight text-content text-center md:text-left">
                Selamat Datang
            </h1>
            <p
                class="text-content-subtle font-sans text-sm md:text-base mb-10 leading-relaxed font-medium text-center md:text-left"
            >
                Masuk untuk mengelola sertifikasi dan kompetensi Anda.
            </p>

            <form @submit.prevent="handleLogin" class="space-y-6">
                <ErrorAlert v-if="loginError" :message="loginError" @dismiss="loginError = null" />

                <div class="space-y-6">
                    <BaseInput
                        v-model="form.email"
                        id="email"
                        type="email"
                        label="Email Pribadi / SSO"
                        placeholder="nama@perusahaan.com"
                        required
                        :disabled="pending"
                        :error="errors.email"
                        @update:model-value="clearFieldError('email')"
                    />
                    <BaseInput
                        v-model="form.password"
                        id="password"
                        type="password"
                        label="Kata Sandi"
                        placeholder="••••••••"
                        required
                        :disabled="pending"
                        :error="errors.password"
                        @update:model-value="clearFieldError('password')"
                    >
                        <template #label-right>
                            <a
                                href="#"
                                class="text-[10px] font-bold text-brand hover:text-content transition-colors absolute right-0 top-0"
                                >Lupa sandi?</a
                            >
                        </template>
                    </BaseInput>
                </div>

                <CaButton
                    type="submit"
                    variant="primary"
                    class="w-full mt-8 py-4 justify-center"
                    :disabled="pending || !form.email || !form.password"
                    :loading="pending"
                >
                    <span class="flex items-center gap-2">
                        Masuk ke Dashboard
                        <CheckCircle2 class="w-5 h-5" />
                    </span>
                </CaButton>
            </form>
        </div>
    </div>
</template>
