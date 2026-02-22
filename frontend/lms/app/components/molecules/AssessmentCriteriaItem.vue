<script setup lang="ts">
import type { PerformanceCriteria } from '~/types/assessment'

const props = defineProps<{
  kuk: PerformanceCriteria
  claimStatus?: 'K' | 'BK' | null
}>()

const emit = defineEmits<{
  (e: 'update:status', status: 'K' | 'BK'): void
}>()
</script>

<template>
  <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 rounded-2xl bg-core-900/40 border border-white/5 hover:border-brand/30 hover:bg-core-900/60 transition-all duration-300 group/item">
    <div class="flex gap-5">
      <span class="text-xs font-black text-content-subtle uppercase shrink-0 mt-1 group-hover/item:text-brand transition-colors">{{ kuk.id }}</span>
      <p class="text-sm text-content-muted leading-relaxed group-hover/item:text-content transition-colors">{{ kuk.text }}</p>
    </div>
    
    <CompetencyToggle 
      class="self-end xl:self-auto shrink-0"
      :model-value="claimStatus"
      @update:model-value="(status: 'K' | 'BK' | null) => emit('update:status', status as 'K' | 'BK')"
    />
  </div>
</template>
