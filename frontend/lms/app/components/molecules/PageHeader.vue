<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  eyebrow?: string
}>()
</script>

<template>
  <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div class="min-w-0">
      <p v-if="eyebrow" class="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-brand/80">
        {{ eyebrow }}
      </p>
      <h1 class="text-2xl font-black tracking-tight text-content md:text-3xl xl:text-[2rem]">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="mt-2 max-w-3xl text-sm leading-relaxed text-content-subtle md:text-[15px]">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
