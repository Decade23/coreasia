<script setup lang="ts">
defineProps<{
  title: string
  category: string
}>()

const { t } = useCoreI18n()
</script>

<template>
  <div class="relative flex aspect-[16/9] w-full overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,rgba(245,158,11,0.18),transparent_50%),linear-gradient(135deg,color-mix(in_srgb,var(--ca-panel-bg)_94%,transparent),color-mix(in_srgb,var(--ca-panel-bg-strong)_96%,transparent))]">
    <div class="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.06))]" />
    <div class="absolute -right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-[color:var(--ca-gold-border)]/35 bg-[radial-gradient(circle,rgba(245,158,11,0.22),transparent_68%)] blur-2xl" />

    <div class="relative flex h-full w-full flex-col justify-between p-5 sm:p-6">
      <div class="flex items-start justify-between gap-3">
        <span class="inline-flex rounded-full border border-[color:var(--ca-gold-border)]/45 bg-[var(--ca-kicker-bg)] px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-brand-primary">
          {{ category }}
        </span>
        <img
          src="/logo-coreasia-mark.svg"
          alt="CoreAsia"
          class="h-8 w-8 opacity-85"
        >
      </div>

      <div class="max-w-xs space-y-3">
        <p class="text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-[var(--ca-subtle)]">
          {{ t('blog.coverEyebrow') }}
        </p>
        <h3 class="font-display text-xl font-bold leading-tight text-[var(--ca-text)] line-clamp-3 sm:text-2xl">
          {{ title }}
        </h3>
        <p class="max-w-[28ch] text-xs leading-relaxed text-[var(--ca-muted)] sm:text-sm">
          {{ t('blog.coverTagline') }}
        </p>
      </div>
    </div>
  </div>
</template>
