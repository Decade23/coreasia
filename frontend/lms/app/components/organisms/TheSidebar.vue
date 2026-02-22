<script setup lang="ts">
import { LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-vue-next'

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Sertifikasi', icon: FileText, to: '/certification' },
  { label: 'User Management', icon: Users, to: '/users' },
  { label: 'Pengaturan', icon: Settings, to: '/settings' },
]
</script>

<template>
  <aside class="w-64 border-r border-core-800 bg-core-900 flex flex-col sticky top-0 h-screen transition-all duration-300">
    <div class="p-6">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-black text-slate-950 text-xl">
          C
        </div>
        <span class="font-bold text-xl tracking-tight text-white uppercase">CoreAsia</span>
      </div>
    </div>

    <nav class="flex-1 px-4 py-4 space-y-1">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-brand/10"
        active-class="bg-brand/10 !text-brand"
      >
        <component :is="item.icon" class="w-5 h-5 text-content-muted group-hover:text-brand transition-colors" />
        <span class="font-medium text-content-muted group-hover:text-content">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="p-4 border-t border-core-800">
      <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-medium">
        <LogOut class="w-5 h-5 text-red-500" />
        <span>Keluar</span>
      </button>
    </div>
  </aside>
</template>
