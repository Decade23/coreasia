<script setup lang="ts">
defineProps<{
  title?: string
  category?: string
}>()
</script>

<template>
  <div class="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,rgba(245,158,11,0.14),transparent_48%),linear-gradient(135deg,color-mix(in_srgb,var(--ca-panel-bg)_94%,transparent),color-mix(in_srgb,var(--ca-panel-bg-strong)_96%,transparent))]">
    <div class="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.06))]" />
    <div class="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--ca-gold-border)]/25 bg-[radial-gradient(circle,rgba(245,158,11,0.18),transparent_70%)] blur-3xl" />
    <div class="absolute inset-x-6 top-5 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ca-gold-border)_75%,transparent),transparent)] sm:inset-x-8 sm:top-6" />
    <div class="absolute inset-x-6 bottom-5 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ca-border)_82%,transparent),transparent)] sm:inset-x-8 sm:bottom-6" />

    <div class="relative flex items-center justify-center rounded-[1.4rem] border border-[color:var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-panel-bg)_78%,transparent)] px-6 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-sm sm:px-8 sm:py-5">
      <img
        src="/logo.svg"
        alt="CoreAsia"
        class="h-10 w-auto sm:h-12"
      >
    </div>
  </div>
</template>
