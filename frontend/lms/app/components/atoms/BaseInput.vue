<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: string | number
  id: string
  label?: string
  type?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const value = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-xs font-black uppercase tracking-widest text-content-subtle mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="id"
        :type="type || 'text'"
        v-model="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="w-full bg-core-800/50 border rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 transition-all font-medium placeholder:text-content-subtle/50"
        :class="[
          error 
            ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
            : 'border-core-700 focus:ring-brand/50 focus:border-brand/50',
          disabled ? 'opacity-50 cursor-not-allowed bg-core-900/50' : ''
        ]"
      />
      <!-- Slot for icons if needed -->
      <slot name="icon" />
    </div>
    
    <p v-if="error" class="mt-2 text-xs font-medium text-red-400">{{ error }}</p>
  </div>
</template>
