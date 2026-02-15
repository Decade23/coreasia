<script setup lang="ts">
const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()
const sectionHeader = useReveal('fadeUp')

const solutions = computed(() => [
    {
        title: t('solutions.lms.title'),
        description: t('solutions.lms.description'),
        icon: 'lucide:monitor',
        features: t('solutions.lms.features'),
        to: '/solutions/lms',
    },
    {
        title: t('solutions.venture.title'),
        description: t('solutions.venture.description'),
        icon: 'lucide:handshake',
        features: t('solutions.venture.features'),
        to: '/solutions/venture',
    },
    {
        title: t('solutions.enterprise.title'),
        description: t('solutions.enterprise.description'),
        icon: 'lucide:building-2',
        features: t('solutions.enterprise.features'),
        to: '/contact',
    },
])

// Per-card spotlight effect
const mousePositions = ref([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 }
])

const cardsRef = ref<HTMLElement[]>([])

const handleMouseMove = (index: number, e: MouseEvent) => {
    const card = cardsRef.value?.[index]
    if (!card) return

    const rect = card.getBoundingClientRect()
    if (mousePositions.value[index]) {
        mousePositions.value[index] = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }
}

const handleMouseLeave = (index: number) => {
    mousePositions.value[index] = { x: 0, y: 0 }
}
</script>

<template>
    <section class="ca-section">
        <div class="ca-container">
            <div ref="sectionHeader" class="mb-8">
                <span class="ca-kicker">{{ t('solutions.kicker') }}</span>
                <h2 class="ca-title mt-4">
                    {{ t('solutions.subtitle') }}
                </h2>
            </div>

            <div
                class="group/grid grid gap-4 md:grid-cols-3"
            >
                <NuxtLink
                    v-for="(solution, index) in solutions"
                    :key="solution.title"
                    :ref="(el) => {
                        if (el && cardsRef && cardsRef.value) {
                            cardsRef.value[index] = el as HTMLElement
                            revealRef('fadeUp', index * 120)(el)
                        }
                    }"
                    :to="solution.to"
                    class="ca-card-soft group relative overflow-hidden p-5 transition hover:border-white/20"
                    @mousemove="handleMouseMove(index, $event)"
                    @mouseleave="handleMouseLeave(index)"
                    v-motion
                    :initial="{ opacity: 0, y: 50 }"
                    :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: index * 100 } }"
                >
                    <!-- Spotlight Effect Layer -->
                    <div
                        class="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                        :style="{
                            background: `radial-gradient(600px circle at ${mousePositions[index].x}px ${mousePositions[index].y}px, rgba(255,255,255,0.06), transparent 40%)`
                        }"
                    />

                    <div
                        class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]"
                    >
                        <Icon
                            :name="solution.icon"
                            class="h-5 w-5 text-amber-300"
                        />
                    </div>

                    <h3
                        class="mt-4 text-lg font-display font-semibold text-white"
                    >
                        {{ solution.title }}
                        <span 
                            v-if="index === 2" 
                            class="ml-2 inline-flex items-center rounded-full bg-fuchsia-400/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-fuchsia-400 ring-1 ring-inset ring-fuchsia-400/20"
                        >
                            Future-Ready
                        </span>
                    </h3>

                    <p class="mt-2 text-sm leading-relaxed text-slate-300">
                        {{ solution.description }}
                    </p>

                    <ul class="mt-4 space-y-1.5">
                        <li
                            v-for="feature in (solution.features || [])"
                            :key="feature"
                            class="flex items-center gap-2 text-sm text-slate-400"
                        >
                            <Icon
                                name="lucide:check"
                                class="h-3.5 w-3.5 text-emerald-300"
                            />
                            {{ feature }}
                        </li>
                    </ul>

                    <span
                        class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-amber-300 transition md:opacity-0 md:group-hover:opacity-100"
                    >
                        Pelajari lebih lanjut
                        <Icon name="lucide:arrow-right" class="h-4 w-4" />
                    </span>
                </NuxtLink>
            </div>
        </div>
    </section>
</template>
