<script setup lang="ts">
import TheSidebar from '../organisms/TheSidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-core-950 flex text-content">
    <!-- Sidebar -->
    <TheSidebar />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0">
      <header class="h-16 border-b border-core-800 bg-core-900/50 backdrop-blur-md flex items-center px-8 sticky top-0 z-10 transition-all duration-300">
        <slot name="header" />
      </header>

      <div class="p-8 flex-1 overflow-y-auto">
        <slot />
      </div>
    </main>
  </div>
</template>
