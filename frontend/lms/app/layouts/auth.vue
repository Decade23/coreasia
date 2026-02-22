<script setup lang="ts">
import { Hexagon } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-core-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <!-- Abstract Background Elements -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 rounded-full blur-[120px]" />
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      
      <!-- Grid Pattern -->
      <div class="absolute inset-0 bg-[url('~/assets/grid.svg')] bg-center opacity-[0.02]" />
    </div>

    <!-- Header Logo -->
    <div class="absolute top-8 left-8 flex items-center gap-3 z-20">
      <div class="w-10 h-10 rounded-xl bg-linear-to-br from-brand to-emerald-400 p-px">
        <div class="w-full h-full bg-core-950 rounded-[11px] flex items-center justify-center">
          <Hexagon class="w-5 h-5 text-brand" />
        </div>
      </div>
      <div>
        <h2 class="text-white font-bold text-lg tracking-tight leading-none">CoreAsia</h2>
        <span class="text-[10px] text-content-subtle uppercase tracking-widest font-black">LMS Platform</span>
      </div>
    </div>

    <!-- Page Content (Login Form) -->
    <slot />
    
    <!-- Footer -->
    <div class="absolute bottom-6 text-center z-20">
      <p class="text-[11px] text-content-subtle/50 font-medium">
        &copy; {{ new Date().getFullYear() }} CoreAsia Teknologi. All rights reserved.
      </p>
    </div>
  </div>
</template>
