<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'

const { t } = useCoreI18n()

const partners = [
    { name: 'SertifikasiPro', initials: 'SP' },
    { name: 'AfraTraining', initials: 'AT' },
]
</script>

<template>
    <section aria-label="Trusted by partners" class="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-10">
        <div class="ca-container mb-8 text-center">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {{ t('components.trustedBy.title') }}
            </p>
        </div>

        <!-- Infinite Marquee Container -->
        <div class="relative flex w-full overflow-hidden">
            <!-- Gradient Masks for Fade Effect -->
            <div class="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#04050a] to-transparent"></div>
            <div class="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#04050a] to-transparent"></div>

            <div class="flex animate-marquee items-center gap-12 whitespace-nowrap py-2 hover:[animation-play-state:paused]">
                <!-- First Set -->
                <div 
                    v-for="partner in partners" 
                    :key="partner.name"
                    class="group relative flex h-12 w-40 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 opacity-50 transition duration-300 hover:border-white/20 hover:opacity-100"
                >
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-[10px] font-bold text-amber-300">{{ partner.initials }}</span>
                    <span class="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition">{{ partner.name }}</span>
                </div>

                <!-- Duplicate Set for Seamless Loop -->
                <div 
                    v-for="partner in partners" 
                    :key="`${partner.name}-duplicate`"
                    class="group relative flex h-12 w-40 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 opacity-50 transition duration-300 hover:border-white/20 hover:opacity-100"
                >
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-[10px] font-bold text-amber-300">{{ partner.initials }}</span>
                    <span class="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition">{{ partner.name }}</span>
                </div>

                <!-- Triplicate Set for Seamless Loop on Wide Screens -->
                <div 
                    v-for="partner in partners" 
                    :key="`${partner.name}-triplicate`"
                    class="group relative flex h-12 w-40 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 opacity-50 transition duration-300 hover:border-white/20 hover:opacity-100"
                >
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-[10px] font-bold text-amber-300">{{ partner.initials }}</span>
                    <span class="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition">{{ partner.name }}</span>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.animate-marquee {
    animation: marquee 40s linear infinite;
    will-change: transform;
}

@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-33.33%); } /* Adjusted for 3 sets */
}
</style>
