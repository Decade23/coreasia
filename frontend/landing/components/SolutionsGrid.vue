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
        to: '/products/lms',
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

const setCardRef = (el: Element | ComponentPublicInstance | null, index: number) => {
    if (el) {
        // Handle NuxtLink which might be a component or element
        const element = (el as ComponentPublicInstance).$el || el as HTMLElement
        cardsRef.value[index] = element
        revealRef('fadeUp', index * 120)(element)
    }
}

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
                    :ref="(el) => setCardRef(el, index)"
                    :to="solution.to"
                    class="ca-card-soft group relative overflow-hidden p-5 transition hover:border-amber-300/25"
                    @mousemove="handleMouseMove(index, $event)"
                    @mouseleave="handleMouseLeave(index)"
                >
                    <!-- Spotlight Effect Layer -->
                    <div
                        class="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                        :style="{
                            background: `radial-gradient(600px circle at ${mousePositions[index].x}px ${mousePositions[index].y}px, rgba(255,255,255,0.06), transparent 40%)`
                        }"
                    />

                    <div
                        class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
                    >
                        <Icon
                            :name="solution.icon"
                            class="h-5 w-5 text-amber-300"
                        />
                    </div>

                    <h3
                        class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]"
                    >
                        {{ solution.title }}
                        <span 
                            v-if="index === 2" 
                            class="ml-2 inline-flex items-center rounded-full bg-fuchsia-400/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-fuchsia-400 ring-1 ring-inset ring-fuchsia-400/20"
                        >
                            {{ t('common.futureReady') }}
                        </span>
                    </h3>

                    <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                        {{ solution.description }}
                    </p>

                    <ul class="mt-4 space-y-1.5">
                        <li
                            v-for="feature in (solution.features || [])"
                            :key="feature"
                            class="flex items-center gap-2 text-sm text-[var(--ca-muted)]"
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
                        {{ t('common.learnMore') }}
                        <Icon name="lucide:arrow-right" class="h-4 w-4" />
                    </span>
                </NuxtLink>
            </div>
        </div>
    </section>
</template>
