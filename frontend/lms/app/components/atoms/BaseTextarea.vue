<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue?: string | number
  id: string
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  rows?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const value = computed({
  get: () => props.modelValue ?? '',
  set: (val: string | number) => emit('update:modelValue', val)
})

const isFocused = ref(false)
</script>

<template>
  <div class="w-full">
    <div v-if="label || $slots['label-right']" class="flex items-center justify-between mb-2 relative">
      <label v-if="label" :for="id" class="block text-xs font-bold uppercase tracking-wider text-content-subtle">
        {{ label }}
        <span v-if="required" class="text-rose-500 ml-1">*</span>
      </label>
      <slot name="label-right" />
    </div>
    
    <div class="relative group">
      <textarea
        :id="id"
        v-model="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows || 4"
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="w-full bg-input rounded-xl px-4 py-3.5 min-h-[140px] text-content font-bold transition-all placeholder:text-content-subtle placeholder:font-medium focus:outline-none resize-y"
        :class="[
          error
            ? 'ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-input'
            : 'shadow-inset-light focus:ring-2 focus:ring-cyan-500/50 focus:shadow-glow-cyan focus:bg-input hover:bg-input-hover',
          disabled ? 'opacity-50 cursor-not-allowed grayscale hover:bg-input' : ''
        ]"
      ></textarea>
    </div>
    
    <p v-if="error" class="mt-2 text-xs font-bold text-rose-500">{{ error }}</p>
  </div>
</template>

<style scoped>
/* Dark mode scrollbar for textarea */
textarea::-webkit-scrollbar {
  width: 8px;
}
textarea::-webkit-scrollbar-track {
  background: transparent;
}
textarea::-webkit-scrollbar-thumb {
  background: var(--th-scrollbar-thumb);
  border-radius: 9999px;
  border: 2px solid var(--th-input-bg);
}
</style>
