<script setup lang="ts">
import { Hexagon, Sparkles, BookOpen, ShieldCheck } from 'lucide-vue-next'
import ThemeToggle from '~/components/atoms/ThemeToggle.vue'
import gridPattern from '~/assets/grid.svg'
</script>

<template>
  <div class="min-h-screen bg-core-950 flex relative overflow-hidden">
    
    <!-- Left Column: Hero & Illustration (Hidden on Mobile/Tablet, Visible on Desktop lg) -->
    <div class="hidden lg:flex flex-1 relative flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-core-800">
      <!-- Background Effects -->
      <div class="absolute inset-0 z-0 pointer-events-none">
        <div class="absolute top-[0%] left-[-20%] w-[70%] h-[70%] bg-brand/15 rounded-full blur-[150px]" />
        <div class="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/15 rounded-full blur-[150px]" />
        <div class="absolute inset-0 bg-center opacity-[0.03]" :style="{ backgroundImage: `url(${gridPattern})` }" />
      </div>

      <!-- Header Logo -->
      <div class="flex items-center gap-3 z-20">
        <div class="w-12 h-12 rounded-xl bg-linear-to-br from-brand to-emerald-400 p-[1.5px] shadow-glow-cyan">
          <div class="w-full h-full bg-core-950 rounded-[10.5px] flex items-center justify-center">
            <Hexagon class="w-6 h-6 text-brand" />
          </div>
        </div>
        <div>
          <h2 class="text-content font-bold text-2xl tracking-tight leading-none">CoreAsia</h2>
          <span class="text-xs text-brand uppercase tracking-widest font-black">LMS Platform</span>
        </div>
      </div>

      <!-- Hero Content & Abstract Illustration -->
      <div class="z-20 max-w-xl mt-[-10%]">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles class="w-4 h-4" />
          Platform Cerdas
        </div>
        <h1 class="text-5xl xl:text-6xl font-black text-content leading-[1.1] mb-6 tracking-tight">
          Tingkatkan <span class="text-transparent bg-clip-text bg-linear-to-r from-brand to-emerald-400">Kompetensi</span><br/>Tim Anda
        </h1>
        <p class="text-lg text-content-subtle mb-12 max-w-md leading-relaxed">
          Sistem manajemen pembelajaran dan sertifikasi terintegrasi yang dirancang untuk mempercepat pertumbuhan perusahaan di era digital.
        </p>

        <!-- Feature Cards -->
        <div class="grid grid-cols-2 gap-4">
          <div class="ca-card-glass p-5 rounded-2xl flex flex-col gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <BookOpen class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-content font-bold text-sm">Modul Terstruktur</h3>
              <p class="text-content-subtle text-xs mt-1">Materi terkurasi untuk efisiensi belajar.</p>
            </div>
          </div>
          <div class="ca-card-glass p-5 rounded-2xl flex flex-col gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-content font-bold text-sm">Sertifikasi Resmi</h3>
              <p class="text-content-subtle text-xs mt-1">Validasi keahlian berstandar industri.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="z-20">
        <p class="text-[12px] text-content-subtle/60 font-medium">
          &copy; {{ new Date().getFullYear() }} CoreAsia Teknologi. All rights reserved.
        </p>
      </div>
    </div>

    <!-- Right Column: Login Form & Mobile View -->
    <div class="flex-1 lg:flex-none lg:w-[520px] xl:w-[600px] relative flex flex-col justify-center items-center p-6 lg:p-12">
      
      <!-- Mobile Header Logo (Visible only on mobile/tablet) -->
      <div class="lg:hidden absolute top-8 left-6 flex items-center gap-3 z-20">
        <div class="w-10 h-10 rounded-xl bg-linear-to-br from-brand to-emerald-400 p-px shadow-glow-cyan">
          <div class="w-full h-full bg-core-950 rounded-[11px] flex items-center justify-center">
            <Hexagon class="w-5 h-5 text-brand" />
          </div>
        </div>
        <div>
          <h2 class="text-content font-bold text-lg tracking-tight leading-none">CoreAsia</h2>
          <span class="text-[10px] text-brand uppercase tracking-widest font-black">LMS Platform</span>
        </div>
      </div>

      <!-- Theme Toggle -->
      <div class="absolute top-8 right-6 lg:right-8 z-20">
        <div class="ca-card-glass rounded-xl p-1">
          <ThemeToggle />
        </div>
      </div>

      <!-- Page Content (Login Form) -->
      <div class="w-full max-w-[420px] z-20 relative">
        <slot />
      </div>

      <!-- Mobile Footer (Visible only on mobile/tablet) -->
      <div class="lg:hidden absolute bottom-6 text-center z-20 w-full left-0">
        <p class="text-[11px] text-content-subtle/50 font-medium">
          &copy; {{ new Date().getFullYear() }} CoreAsia.
        </p>
      </div>

    </div>
  </div>
</template>
