<script setup lang="ts">
import { ref } from 'vue'
import { Menu } from 'lucide-vue-next'
import TheSidebar from '../organisms/TheSidebar.vue'

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen flex text-slate-300 relative overflow-hidden bg-[#050814]">
    <!-- Optional Subtle Background Effect -->
    <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

    <!-- Mobile Backdrop -->
    <div 
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-[#050814]/80 backdrop-blur-sm lg:hidden transition-opacity duration-500"
      @click="closeSidebar"
    />

    <!-- Sidebar -->
    <TheSidebar 
      :is-open="isSidebarOpen" 
      @close="closeSidebar"
    />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 transition-all duration-500 relative z-10">
      <header class="h-20 lg:h-24 bg-transparent flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all duration-300">
        <!-- Mobile Menu Toggle -->
        <button 
          @click="toggleSidebar"
          class="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <Menu class="w-6 h-6" />
        </button>

        <div class="flex-1 flex items-center justify-end lg:justify-between w-full">
          <slot name="header" />
        </div>
      </header>

      <div class="p-4 lg:p-8 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div class="max-w-7xl mx-auto w-full">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>

<style>
/* Custom Scrollbar for Webkit */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>
