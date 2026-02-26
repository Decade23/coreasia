<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean | any[]
  value?: any
  label?: string
  id?: string
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return props.modelValue
})

const toggleCheckbox = (event: Event) => {
  if (props.disabled) return
  const target = event.target as HTMLInputElement
  if (Array.isArray(props.modelValue)) {
    const newValue = [...props.modelValue]
    if (target.checked) {
      newValue.push(props.value)
    } else {
      const idx = newValue.indexOf(props.value)
      if (idx > -1) newValue.splice(idx, 1)
    }
    emit('update:modelValue', newValue)
  } else {
    emit('update:modelValue', target.checked)
  }
}
</script>

<template>
  <label class="flex items-center gap-3 cursor-pointer group" :class="{'opacity-50 cursor-not-allowed grayscale': disabled}">
    <div class="relative flex items-center justify-center">
      <input
        :id="id"
        type="checkbox"
        :checked="isChecked"
        :disabled="disabled"
        :value="value"
        @change="toggleCheckbox"
        class="peer sr-only"
      />
      <div 
        class="w-5 h-5 rounded-md transition-all duration-200 flex items-center justify-center border-none peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-500/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-(--th-ring-offset)"
        :class="[
          isChecked ? 'bg-cyan-500 shadow-glow-cyan' : 'bg-input shadow-inset-light group-hover:bg-input-hover'
        ]"
      >
        <svg 
          class="w-3.5 h-3.5 text-slate-900 pointer-events-none transition-transform duration-200" 
          :class="isChecked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <span v-if="label" class="text-sm font-bold text-content select-none">{{ label }}</span>
  </label>
</template>
