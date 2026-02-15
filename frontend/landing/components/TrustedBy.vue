<script setup lang="ts">
const { useReveal, revealRef } = useScrollReveal()
const heading = useReveal('fadeIn')


const partners = [
    'SertifikasiPro',
    'AfraTraining',
]
</script>

<template>
    <section aria-label="Trusted by partners">
        <LiveTicker class="mb-10" />
        
        <div class="border-y border-white/10 bg-white/[0.02] py-10">
            <div class="ca-container">
                <p
                    ref="heading"
                    class="mb-6 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                    Trusted By
                </p>

                <div
                    class="flex flex-wrap items-center justify-center gap-8 opacity-70 md:gap-14"
                >
                    <div
                        v-for="(partner, index) in partners"
                        :key="partner"
                        :ref="revealRef('fadeUp', index * 100)"
                        class="flex cursor-default items-center gap-2 text-xl font-display font-bold text-slate-400 transition duration-300 hover:text-white"
                    >
                        <Icon name="lucide:shield-check" class="h-6 w-6" />
                        {{ partner }}
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
