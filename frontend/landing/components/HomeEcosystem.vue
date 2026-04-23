<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core'

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()

const productsHeader = useReveal('fadeUp')
const roadmapHeader = useReveal('fadeUp')
const engagementHeader = useReveal('fadeUp')

const products = computed(() => (t('home.products.items') as Array<Record<string, any>>) || [])
const roadmapProducts = computed(() => (t('home.products.comingSoon') as Array<Record<string, any>>) || [])
const engagementModels = computed(() => (t('home.engagementModels.items') as Array<Record<string, any>>) || [])
const roadmapIcons = ['lucide:graduation-cap', 'lucide:briefcase-business']

const productMousePositions = ref(
  Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
)
const engagementMousePositions = ref(
  Array.from({ length: 3 }, () => ({ x: 0, y: 0 })),
)

const productCardsRef = ref<HTMLElement[]>([])
const engagementCardsRef = ref<HTMLElement[]>([])

const registerCard = (
  list: HTMLElement[],
  elementLike: Element | any | null,
  effect: string,
  delay: number,
  index: number,
) => {
  if (!elementLike) {
    return
  }

  const element = elementLike.$el || (elementLike as HTMLElement)
  list[index] = element
  revealRef(effect as any, delay)(element)
}

const setProductCardRef = (el: Element | any | null, index: number) => {
  registerCard(productCardsRef.value, el, 'fadeUp', index * 120, index)
}

const setEngagementCardRef = (el: Element | any | null, index: number) => {
  registerCard(engagementCardsRef.value, el, 'fadeUp', index * 120, index)
}

const updateSpotlight = useThrottleFn((
  cards: HTMLElement[],
  positions: Array<{ x: number; y: number }>,
  index: number,
  event: MouseEvent,
) => {
  const card = cards[index]
  if (!card || !positions[index]) {
    return
  }

  const rect = card.getBoundingClientRect()
  positions[index] = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}, 16)

const resetSpotlight = (positions: Array<{ x: number; y: number }>, index: number) => {
  positions[index] = { x: 0, y: 0 }
}
</script>

<template>
  <section id="products" class="ca-section">
    <div class="ca-container">
      <div ref="productsHeader" class="mb-8">
        <span class="ca-kicker">{{ t('home.products.kicker') }}</span>
        <h2 class="ca-title mt-4">{{ t('home.products.title') }}</h2>
        <p class="ca-copy mt-3 max-w-3xl">{{ t('home.products.subtitle') }}</p>
      </div>

      <div class="mx-auto grid max-w-3xl gap-4 md:grid-cols-2" :class="products.length >= 3 ? 'md:grid-cols-3 max-w-none' : ''">
        <NuxtLink
          v-for="(product, index) in products"
          :key="product.name"
          :ref="(el) => setProductCardRef(el, index)"
          :to="product.to"
          class="ca-card-soft group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:shadow-lg"
          @mousemove="updateSpotlight(productCardsRef, productMousePositions, index, $event)"
          @mouseleave="resetSpotlight(productMousePositions, index)"
        >
          <div
            class="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
            :style="{
              background: `radial-gradient(420px circle at ${productMousePositions[index].x}px ${productMousePositions[index].y}px, var(--ca-spotlight), transparent 42%)`,
            }"
          />

          <div class="relative z-10 flex items-start justify-between gap-3">
            <div
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
            >
              <Icon :name="index === 0 ? 'lucide:bar-chart-3' : index === 1 ? 'lucide:code-2' : 'lucide:box'" class="h-5 w-5 ca-tone-gold" />
            </div>
            <span class="ca-pill-gold px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]">
              {{ product.badge }}
            </span>
          </div>

          <div class="relative z-10 mt-5">
            <h3 class="text-lg font-display font-semibold text-[var(--ca-text)]">
              {{ product.name }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ product.description }}
            </p>

            <ul class="mt-4 space-y-2">
              <li
                v-for="feature in product.features"
                :key="feature"
                class="flex items-start gap-2 text-sm text-[var(--ca-muted)]"
              >
                <Icon name="lucide:check" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 ca-tone-emerald" />
                <span>{{ feature }}</span>
              </li>
            </ul>

            <span class="mt-5 inline-flex items-center gap-1 text-sm font-semibold ca-tone-gold">
              {{ product.ctaLabel }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </span>
          </div>
        </NuxtLink>
      </div>

      <div v-if="roadmapProducts.length" class="mt-10">
        <div ref="roadmapHeader" class="mb-6">
          <span class="ca-kicker">{{ t('home.products.roadmapKicker') }}</span>
          <h3 class="mt-4 text-balance font-display text-2xl font-bold text-[var(--ca-text)] sm:text-3xl">
            {{ t('home.products.roadmapTitle') }}
          </h3>
          <p class="ca-copy mt-3 max-w-3xl">{{ t('home.products.roadmapSubtitle') }}</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <NuxtLink
            v-for="(product, index) in roadmapProducts"
            :key="product.name"
            :to="product.to"
            class="ca-card group relative overflow-hidden border-dashed p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)]"
          >
            <div class="flex items-start justify-between gap-3">
              <div
                class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
              >
                <Icon :name="roadmapIcons[index] || 'lucide:box'" class="h-5 w-5 ca-tone-emerald" />
              </div>
              <span class="shrink-0 rounded-full border border-[color:var(--ca-border)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-muted)]">
                {{ product.badge }}
              </span>
            </div>

            <h4 class="mt-5 text-lg font-display font-semibold text-[var(--ca-text)]">
              {{ product.name }}
            </h4>
            <p class="mt-1 text-sm font-medium ca-tone-gold">
              {{ product.tagline }}
            </p>
            <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ product.description }}
            </p>
            <span class="mt-5 inline-flex items-center gap-1 text-sm font-semibold ca-tone-gold">
              {{ product.ctaLabel }}
              <Icon name="lucide:arrow-right" class="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>

  <section id="engagement-models" class="ca-section pt-0">
    <div class="ca-container">
      <div ref="engagementHeader" class="mb-8">
        <span class="ca-kicker">{{ t('home.engagementModels.kicker') }}</span>
        <h2 class="ca-title mt-4">{{ t('home.engagementModels.title') }}</h2>
        <p class="ca-copy mt-3 max-w-3xl">{{ t('home.engagementModels.subtitle') }}</p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <NuxtLink
          v-for="(model, index) in engagementModels"
          :key="model.name"
          :ref="(el) => setEngagementCardRef(el, index)"
          :to="model.to"
          class="ca-card group relative overflow-hidden p-5 transition hover:-translate-y-0.5"
          @mousemove="updateSpotlight(engagementCardsRef, engagementMousePositions, index, $event)"
          @mouseleave="resetSpotlight(engagementMousePositions, index)"
        >
          <div
            class="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
            :style="{
              background: `radial-gradient(420px circle at ${engagementMousePositions[index].x}px ${engagementMousePositions[index].y}px, var(--ca-spotlight), transparent 42%)`,
            }"
          />

          <div class="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
            <Icon :name="index === 0 ? 'lucide:package-check' : index === 1 ? 'lucide:handshake' : 'lucide:building-2'" class="h-5 w-5 ca-tone-emerald" />
          </div>

          <div class="relative z-10 mt-5">
            <h3 class="text-lg font-display font-semibold text-[var(--ca-text)]">
              {{ model.name }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ model.description }}
            </p>

            <ul class="mt-4 space-y-2">
              <li
                v-for="feature in model.features"
                :key="feature"
                class="flex items-start gap-2 text-sm text-[var(--ca-muted)]"
              >
                <Icon name="lucide:check-circle-2" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 ca-tone-emerald" />
                <span>{{ feature }}</span>
              </li>
            </ul>

            <span class="mt-5 inline-flex items-center gap-1 text-sm font-semibold ca-tone-gold">
              {{ model.ctaLabel }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
