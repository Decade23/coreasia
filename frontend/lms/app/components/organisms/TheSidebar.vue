<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { LayoutDashboard, Users, FileText, Settings, LogOut, X, Box, BookOpen, Layers, CheckCircle, Calendar } from 'lucide-vue-next'
import { computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { user, logout } = useAuth()

const menuItems = computed(() => {
  const role = user.value?.role
  
  if (role === 'admin' || role === 'super_admin') {
    return [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
      { label: 'Manajemen Skema', icon: Layers, to: '/admin/schemes' },
      { label: 'Bank Soal', icon: BookOpen, to: '/admin/questions' },
      { label: 'Verifikasi Berkas', icon: CheckCircle, to: '/admin/verifications' },
      { label: 'Penjadwalan', icon: Calendar, to: '/admin/schedules' },
      { label: 'Log Aktivitas', icon: FileText, to: '/admin/audit' },
      { label: 'Pengaturan Tenant', icon: Settings, to: '/admin/settings' },
    ]
  }
  
  if (role === 'assessee') {
    return [
      { label: 'Portal Asesi', icon: LayoutDashboard, to: '/assessee' },
      { label: 'Pendaftaran Ujian', icon: Box, to: '/registration' },
      { label: 'Sertifikat Saya', icon: FileText, to: '/assessee/certificates' },
      { label: 'Pengaturan Akun', icon: Settings, to: '/assessee/settings' },
    ]
  }

  // Fallback
  return [
    { label: 'Beranda', icon: LayoutDashboard, to: '/' },
  ]
})
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 w-72 glass border-r border-white/5 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) lg:translate-x-0 lg:static lg:h-screen lg:shadow-none shadow-2xl flex flex-col"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Logo Area -->
    <div class="h-24 flex items-center justify-between px-8 border-b border-white/5">
      <div class="flex items-center gap-4 group cursor-pointer">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform duration-300">
          C
        </div>
        <div>
          <span class="font-bold text-xl tracking-tight text-white uppercase block leading-none">CoreAsia</span>
          <span class="text-[10px] text-content-subtle font-bold uppercase tracking-widest">LMS Platform</span>
        </div>
      </div>
      <!-- Mobile Close Button -->
      <button 
        @click="emit('close')"
        class="lg:hidden p-2 rounded-xl text-content-muted hover:bg-white/5 hover:text-white transition-all"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        @click="emit('close')"
        class="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden"
        active-class="bg-white/5 !text-white font-bold shadow-lg shadow-black/20"
      >
        <!-- Active Indicator -->
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-brand opacity-0 transition-opacity duration-300 group-[.router-link-active]:opacity-100" />
        
        <component 
          :is="item.icon" 
          class="w-5 h-5 text-content-subtle group-hover:text-brand transition-colors duration-300 group-[.router-link-active]:text-brand" 
        />
        <span class="font-medium text-content-muted group-hover:text-content group-[.router-link-active]:text-white relative z-10">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="p-6 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent">
      <button @click="logout" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-medium group">
        <LogOut class="w-5 h-5 text-red-500/70 group-hover:text-red-400 transition-colors" />
        <span>Keluar</span>
      </button>
      
      <div class="mt-6 text-center">
        <p class="text-[10px] text-content-subtle">v1.0.0 &copy; 2024 CoreAsia</p>
      </div>
    </div>
  </aside>
</template>
