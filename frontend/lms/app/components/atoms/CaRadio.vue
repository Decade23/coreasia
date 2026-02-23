<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: any
  value: any
  label?: string
  id?: string
  name?: string
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => props.modelValue === props.value)

const selectRadio = () => {
  if (!props.disabled) {
    emit('update:modelValue', props.value)
  }
}
</script>

<template>
  <label class="flex items-center gap-3 cursor-pointer group" :class="{'opacity-50 cursor-not-allowed grayscale': disabled}">
    <div class="relative flex items-center justify-center">
      <input
        :id="id"
        type="radio"
        :name="name"
        :checked="isChecked"
        :disabled="disabled"
        :value="value"
        @change="selectRadio"
        class="peer sr-only"
      />
      <div 
        class="w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center border-none peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-500/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#050814]"
        :class="[
          isChecked ? 'bg-cyan-500 shadow-glow-cyan' : 'bg-[#1A2235] shadow-inset-light group-hover:bg-[#1E273C]'
        ]"
      >
        <div 
          class="w-2 h-2 rounded-full bg-slate-950 transition-transform duration-200"
          :class="isChecked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'"
        ></div>
      </div>
    </div>
    <span v-if="label" class="text-sm font-bold text-slate-200 select-none">{{ label }}</span>
  </label>
</template>
