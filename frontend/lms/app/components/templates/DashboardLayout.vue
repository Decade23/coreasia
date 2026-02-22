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
  <div class="min-h-screen flex text-content relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-core-900 via-core-950 to-black">
    <!-- Mobile Backdrop -->
    <div 
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-500"
      @click="closeSidebar"
    />

    <!-- Sidebar -->
    <TheSidebar 
      :is-open="isSidebarOpen" 
      @close="closeSidebar"
    />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 transition-all duration-500">
      <header class="h-20 lg:h-24 border-b border-white/5 bg-core-950/40 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all duration-300">
        <!-- Mobile Menu Toggle -->
        <button 
          @click="toggleSidebar"
          class="lg:hidden p-2 -ml-2 text-content-muted hover:text-white hover:bg-white/5 rounded-xl transition-all"
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
