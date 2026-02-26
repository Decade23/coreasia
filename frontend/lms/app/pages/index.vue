<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'

const { t } = useI18n()

const { user: authUser, pending } = useAuth()

const user = computed(() => authUser.value ?? { fullName: 'Loading...', role: 'admin' })
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-xl md:text-3xl font-bold truncate mr-4 bg-clip-text text-transparent bg-gradient-to-r from-content to-content-muted">{{ t('common.welcome') }}</h1>
          <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola sistem sertifikasi dengan mudah dan efisien.</p>
        </div>
        
        <div class="flex items-center gap-3 md:gap-6 shrink-0">
          <div class="hidden md:flex flex-col items-end">
            <span class="text-base font-bold text-content">{{ user.fullName }}</span>
            <span class="text-[10px] text-brand uppercase font-black tracking-widest">{{ t(`roles.${user.role}`) }}</span>
          </div>
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-core-800 to-core-900 border border-divider-strong flex items-center justify-center text-brand font-bold shadow-xl shadow-black/20 ring-4 ring-black/20">
            SA
          </div>
        </div>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="p-8 rounded-[2rem] glass-card group relative overflow-hidden">
        <!-- Glow Effect -->
        <div class="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <div class="w-32 h-32 bg-brand/50 rounded-full blur-[60px] -mr-16 -mt-16" />
        </div>
        
        <div class="relative z-10">
          <div class="w-12 h-12 rounded-2xl bg-tint border border-divider flex items-center justify-center mb-6 group-hover:bg-brand/10 transition-colors duration-300">
             <span class="text-xl">📊</span>
          </div>

          <h3 class="font-bold text-xl mb-3 text-content group-hover:text-brand transition-colors">Statistik Utama {{ i }}</h3>
          <p class="text-content-muted text-sm mb-8 leading-relaxed">Pantau perkembangan data sertifikasi secara real-time dengan visualisasi modern.</p>
          
          <CaButton variant="outline" size="sm" class="w-full md:w-auto border-divider-strong hover:border-brand/50 text-content-muted hover:text-content">Lihat Detail</CaButton>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
