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
    <div class="p-6 rounded-2xl bg-core-800 border border-core-700 shadow-xl">
      <div class="flex items-start gap-4 mb-6">
        <span class="flex-shrink-0 w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold">
          ?
        </span>
        <h2 class="text-xl font-medium leading-relaxed text-white">{{ question.text }}</h2>
      </div>

      <div v-if="question.type === 'multiple_choice'" class="grid grid-cols-1 gap-3">
        <button
          v-for="opt in question.options"
          :key="opt.id"
          @click="onOptionSelect(opt.id)"
          class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group"
          :class="modelValue === opt.id 
            ? 'border-brand bg-brand/5 ring-1 ring-brand' 
            : 'border-core-700 bg-core-900/50 hover:border-brand/50 hover:bg-core-800'"
        >
          <div 
            class="w-6 h-6 rounded-lg border-2 flex items-center justify-center font-bold text-xs"
            :class="modelValue === opt.id 
              ? 'border-brand bg-brand text-slate-950' 
              : 'border-core-600 group-hover:border-brand/50 text-content-muted'"
          >
            {{ opt.id }}
          </div>
          <span :class="modelValue === opt.id ? 'text-white' : 'text-content-muted group-hover:text-content'">
            {{ opt.text }}
          </span>
        </button>
      </div>

      <div v-else-if="question.type === 'essay'">
        <textarea
          class="w-full h-40 bg-core-900 border-2 border-core-700 rounded-2xl p-4 text-content focus:border-brand outline-none transition-all"
          placeholder="Tuliskan jawaban Anda di sini..."
          :value="modelValue as string"
          @input="e => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)"
        />
      </div>
    </div>
  </div>
</template>
