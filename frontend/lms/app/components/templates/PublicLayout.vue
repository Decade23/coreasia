<script setup lang="ts">
import ThemeToggle from '../atoms/ThemeToggle.vue'
</script>

<template>
    <div class="min-h-screen flex flex-col bg-core-950 text-content-muted relative overflow-hidden">
        <!-- Background Effect -->
        <div class="absolute top-0 right-0 w-200 h-200 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div class="absolute bottom-0 left-0 w-150 h-150 bg-emerald-500/3 blur-[100px] rounded-full pointer-events-none" />

        <!-- Header -->
        <header class="relative z-10 border-b border-divider">
            <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <NuxtLink to="/" class="flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-xl bg-linear-to-br from-brand to-brand-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-glow-cyan-card group-hover:scale-105 transition-transform duration-300">
                        C
                    </div>
                    <div>
                        <span class="font-bold text-lg tracking-tight text-content uppercase block leading-none">CoreAsia</span>
                        <span class="text-[9px] text-content-subtle font-bold uppercase tracking-widest">Verifikasi Sertifikat</span>
                    </div>
                </NuxtLink>

                <div class="flex items-center gap-4">
                    <ThemeToggle />
                    <NuxtLink to="/login" class="text-sm font-bold text-content-subtle hover:text-brand transition-colors">
                        Login
                    </NuxtLink>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 relative z-10">
            <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <slot />
            </div>
        </main>

        <!-- Footer -->
        <footer class="relative z-10 border-t border-divider py-8">
            <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p class="text-xs text-content-subtle">&copy; 2024 CoreAsia. Platform Sertifikasi & Kompetensi Nasional.</p>
            </div>
        </footer>
    </div>
</template>
