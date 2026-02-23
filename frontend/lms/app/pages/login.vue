<script setup lang="ts">
import { Play, CheckCircle2 } from 'lucide-vue-next'
import BaseInput from '~/components/atoms/BaseInput.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

const email = ref('')
const password = ref('')
const { login, pending, error } = useAuth()

const handleLogin = async () => {
  if (!email.value || !password.value) return
  
  await login(email.value, password.value)
}
</script>

<template>
  <div class="w-full max-w-md p-8 md:p-12 ca-card group transition-all duration-700 mx-4">
    <!-- Glow Effect -->
    <div class="absolute -top-32 -right-32 w-64 h-64 bg-brand/10 rounded-full blur-[80px] group-hover:bg-brand/20 transition-colors duration-700 pointer-events-none" />
    <div class="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-300/10 rounded-full blur-[80px] group-hover:bg-brand-400/10 transition-colors duration-700 pointer-events-none" />

    <div class="relative z-10">
      <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-inner shadow-black/50 mx-auto md:mx-0">
        <Play class="w-8 h-8 text-brand fill-brand/20" />
      </div>

      <h1 class="text-3xl md:text-4xl font-black mb-3 tracking-tight text-white text-center md:text-left">Selamat Datang</h1>
      <p class="text-content-subtle font-sans text-sm md:text-base mb-10 leading-relaxed font-medium text-center md:text-left">Masuk untuk mengelola sertifikasi dan kompetensi Anda.</p>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div v-if="error" class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
             <span class="text-red-500 font-bold text-xs">!</span>
          </div>
          <p class="text-red-400 text-sm font-medium">{{ error.message || 'Gagal login. Periksa kembali email dan kata sandi Anda.' }}</p>
        </div>

        <div class="space-y-6">
          <BaseInput 
            v-model="email"
            id="email" 
            type="email" 
            label="Email Pribadi / SSO" 
            placeholder="nama@perusahaan.com" 
            required 
            :disabled="pending"
          />
          <BaseInput 
            v-model="password"
            id="password" 
            type="password" 
            label="Kata Sandi" 
            placeholder="••••••••" 
            required 
            :disabled="pending"
          >
            <!-- Slot override untuk Lupa Sandi karena base input tidak memiliki prop bawaan -->
            <template #label-right>
              <a href="#" class="text-[10px] font-bold text-brand hover:text-white transition-colors absolute right-0 top-0">Lupa sandi?</a>
            </template>
          </BaseInput>
        </div>

        <CaButton 
          type="submit" 
          variant="primary" 
          class="w-full mt-8 py-4 justify-center"
          :disabled="pending || !email || !password"
        >
          <span v-if="pending" class="flex items-center gap-2">
            <div class="w-4 h-4 border-2 border-core-900 border-t-white rounded-full animate-spin" />
            Memproses...
          </span>
          <span v-else class="flex items-center gap-2">
            Masuk ke Dashboard
            <CheckCircle2 class="w-5 h-5" />
          </span>
        </CaButton>
      </form>
    </div>
  </div>
</template>
