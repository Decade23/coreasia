<script setup lang="ts">
import { Home, AlertCircle } from 'lucide-vue-next'
import type { NuxtError } from '#app'

const props = defineProps({
  error: {
    type: Object as () => NuxtError,
    required: true
  }
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen bg-core-950 flex relative overflow-hidden items-center justify-center font-sans">
    
    <!-- Background Decorators -->
    <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
    <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
    
    <!-- Grid Overlay -->
    <div class="absolute inset-0 bg-[url('/img/grid.svg')] bg-center opacity-10 pointer-events-none" />

    <!-- Main Content -->
    <div class="relative z-10 w-full max-w-2xl px-6 text-center">
      
      <!-- Big Error Number -->
      <div class="mb-8 relative">
        <h1 class="text-[12rem] md:text-[18rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white/10 to-transparent leading-none select-none drop-shadow-2xl">
          {{ error.statusCode }}
        </h1>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="ca-card p-6 md:p-8 backdrop-blur-2xl bg-core-900/40 border-divider-strong shadow-2xl mb-12">
            <AlertCircle class="w-12 h-12 md:w-16 md:h-16 text-brand mx-auto mb-4" />
            <h2 class="text-2xl md:text-3xl font-bold text-content mb-2 font-display">
              <template v-if="error.statusCode === 404">Halaman Tidak Ditemukan</template>
              <template v-else>Terjadi Kesalahan</template>
            </h2>
            <p class="text-content-muted text-sm md:text-base font-medium max-w-sm mx-auto">
              <template v-if="error.statusCode === 404">
                Maaf, rute atau halaman yang Anda tuju sepertinya tidak ada di platform ini, atau Anda tidak memiliki akses.
              </template>
              <template v-else>
                {{ error.message || 'Kami mengalami kendala sistem. Silakan coba beberapa saat lagi.' }}
              </template>
            </p>
          </div>
        </div>
      </div>

      <!-- Action -->
      <button 
        @click="handleError"
        class="ca-btn-primary mx-auto shadow-brand-glow text-base px-8 py-4"
      >
        <Home class="w-5 h-5 mr-1" />
        Kembali ke Beranda
      </button>

      <!-- Watermark -->
      <div class="mt-16 text-content-subtle text-xs font-bold tracking-widest uppercase">
        CoreAsia LMS
      </div>
    </div>
  </div>
</template>
