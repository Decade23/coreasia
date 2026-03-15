<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'

const { t } = useCoreI18n()

const partners = [
    { name: 'SertifikasiPro', initials: 'SP' },
    { name: 'AfraTraining', initials: 'AT' },
]
</script>

<template>
    <section :aria-label="t('components.trustedBy.ariaLabel')" class="relative overflow-hidden border-y border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] py-10">
        <div class="ca-container mb-8 text-center">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                {{ t('components.trustedBy.title') }}
            </p>
        </div>

        <!-- Infinite Marquee Container -->
        <div class="relative flex w-full overflow-hidden">
            <!-- Gradient Masks for Fade Effect -->
            <div class="trusted-mask-left absolute left-0 top-0 z-10 h-full w-20"></div>
            <div class="trusted-mask-right absolute right-0 top-0 z-10 h-full w-20"></div>

            <div class="flex animate-marquee items-center gap-12 whitespace-nowrap py-2 hover:[animation-play-state:paused]">
                <!-- First Set -->
                <div 
                    v-for="partner in partners" 
                    :key="partner.name"
                    class="group relative flex h-12 w-40 items-center justify-center gap-2 rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-4 opacity-70 transition duration-300 hover:border-amber-300/20 hover:opacity-100"
                >
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-[10px] font-bold text-amber-300">{{ partner.initials }}</span>
                    <span class="text-xs font-semibold text-[var(--ca-muted)] transition group-hover:text-[var(--ca-text)]">{{ partner.name }}</span>
                </div>

                <!-- Duplicate Set for Seamless Loop -->
                <div 
                    v-for="partner in partners" 
                    :key="`${partner.name}-duplicate`"
                    class="group relative flex h-12 w-40 items-center justify-center gap-2 rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-4 opacity-70 transition duration-300 hover:border-amber-300/20 hover:opacity-100"
                >
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-[10px] font-bold text-amber-300">{{ partner.initials }}</span>
                    <span class="text-xs font-semibold text-[var(--ca-muted)] transition group-hover:text-[var(--ca-text)]">{{ partner.name }}</span>
                </div>

                <!-- Triplicate Set for Seamless Loop on Wide Screens -->
                <div 
                    v-for="partner in partners" 
                    :key="`${partner.name}-triplicate`"
                    class="group relative flex h-12 w-40 items-center justify-center gap-2 rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-4 opacity-70 transition duration-300 hover:border-amber-300/20 hover:opacity-100"
                >
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-[10px] font-bold text-amber-300">{{ partner.initials }}</span>
                    <span class="text-xs font-semibold text-[var(--ca-muted)] transition group-hover:text-[var(--ca-text)]">{{ partner.name }}</span>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.trusted-mask-left {
    background: linear-gradient(to right, var(--ca-bg) 0%, transparent 100%);
}

.trusted-mask-right {
    background: linear-gradient(to left, var(--ca-bg) 0%, transparent 100%);
}

.animate-marquee {
    animation: marquee 40s linear infinite;
    will-change: transform;
}

@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-33.33%); } /* Adjusted for 3 sets */
}
</style>
