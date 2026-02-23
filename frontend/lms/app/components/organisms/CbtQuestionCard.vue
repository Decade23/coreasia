<script setup lang="ts">
import type { Question } from '../../types/exam'

const props = defineProps<{
  question: Question
  modelValue?: string | string[]
}>()

const emit = defineEmits(['update:modelValue'])

const onOptionSelect = (optionId: string) => {
  emit('update:modelValue', optionId)
}
</script>

<template>
  <div class="space-y-6">
    <div class="p-6 ca-card">
      <div class="flex items-start gap-4 mb-6">
        <span class="flex-shrink-0 w-8 h-8 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center font-bold">
          ?
        </span>
        <h2 class="text-xl font-bold leading-relaxed text-white">{{ question.text }}</h2>
      </div>

      <div v-if="question.type === 'multiple_choice'" class="grid grid-cols-1 gap-3">
        <button
          v-for="opt in question.options"
          :key="opt.id"
          @click="onOptionSelect(opt.id)"
          class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group"
          :class="modelValue === opt.id 
            ? 'border-brand bg-brand/5 shadow-glow-brand' 
            : 'border-white/5 bg-core-900/50 hover:border-brand/30 hover:bg-white/5'"
        >
          <div 
            class="w-6 h-6 rounded-lg border-2 flex items-center justify-center font-black text-[10px]"
            :class="modelValue === opt.id 
              ? 'border-brand bg-brand text-slate-950' 
              : 'border-white/10 group-hover:border-brand/50 text-content-subtle'"
          >
            {{ opt.id }}
          </div>
          <span class="font-medium" :class="modelValue === opt.id ? 'text-white' : 'text-content group-hover:text-white transition-colors'">
            {{ opt.text }}
          </span>
        </button>
      </div>

      <div v-else-if="question.type === 'essay'">
        <textarea
          class="w-full h-40 bg-core-900/50 border border-white/10 rounded-2xl p-4 text-white hover:border-white/20 focus:border-brand/50 focus:ring-1 focus:ring-brand/50 outline-none transition-all placeholder:text-content-subtle/50 resize-y"
          placeholder="Tuliskan jawaban Anda di sini..."
          :value="modelValue as string"
          @input="e => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)"
        />
      </div>
    </div>
  </div>
</template>
