<template>
  <section class="ca-console-header-card mb-6 overflow-hidden rounded-[1.75rem] p-5 sm:p-6">
    <div class="relative z-[1] flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            v-if="backTo"
            :to="backTo"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] text-[var(--ca-muted)] transition hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]"
          >
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
          </NuxtLink>

          <span v-if="kicker" class="ca-kicker">
            <Icon v-if="icon" :name="icon" class="h-3.5 w-3.5" />
            {{ kicker }}
          </span>
        </div>

        <h1 class="mt-4 text-2xl font-bold tracking-tight text-[var(--ca-text)] sm:text-[2rem]">
          {{ title }}
        </h1>
        <p v-if="description" class="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--ca-muted)] sm:text-[0.95rem]">
          {{ description }}
        </p>

        <div v-if="$slots.meta" class="mt-4 flex flex-wrap gap-2">
          <slot name="meta" />
        </div>
      </div>

      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <div class="ca-console-header-orb ca-console-header-orb-primary" />
    <div class="ca-console-header-orb ca-console-header-orb-secondary" />
  </section>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  kicker?: string
  icon?: string
  backTo?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
  kicker: '',
  icon: '',
  backTo: '',
})
</script>
