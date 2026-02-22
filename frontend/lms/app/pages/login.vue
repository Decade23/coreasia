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
  <div class="w-full max-w-md p-8 md:p-12 rounded-[2.5rem] bg-core-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden z-10 transition-all duration-500 hover:border-brand/30 group">
    <!-- Glow Effect -->
    <div class="absolute -top-32 -right-32 w-64 h-64 bg-brand/20 rounded-full blur-[80px] group-hover:bg-brand/30 transition-colors duration-700 pointer-events-none" />
    <div class="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-colors duration-700 pointer-events-none" />

    <div class="relative z-10">
      <div class="w-16 h-16 rounded-2xl bg-linear-to-br from-core-800 to-core-900 border border-white/10 flex items-center justify-center mb-8 shadow-xl shadow-black/50">
        <Play class="w-8 h-8 text-brand fill-brand" />
      </div>

      <h1 class="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-white">Selamat Datang</h1>
      <p class="text-content-muted text-sm mb-10 leading-relaxed font-medium">Masuk untuk mengelola sertifikasi dan kompetensi Anda.</p>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div v-if="error" class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
             <span class="text-red-500 font-bold text-xs">!</span>
          </div>
          <p class="text-red-400 text-sm font-medium">{{ error.message || 'Gagal login. Periksa kembali email dan kata sandi Anda.' }}</p>
        </div>

        <div class="space-y-5">
          <BaseInput 
            v-model="email"
            id="email" 
            type="email" 
            label="Email Pribadi / SSO" 
            placeholder="nama@perusahaan.com" 
            required 
            :disabled="pending"
          />
          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-xs font-black uppercase tracking-widest text-content-subtle">Kata Sandi</label>
              <a href="#" class="text-xs font-bold text-brand hover:text-white transition-colors">Lupa sandi?</a>
            </div>
            <div class="relative">
              <input 
                v-model="password"
                type="password" 
                id="password" 
                placeholder="••••••••" 
                required 
                :disabled="pending"
                class="w-full bg-core-800/50 border border-core-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all font-medium placeholder:text-content-subtle/50"
              />
            </div>
          </div>
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
