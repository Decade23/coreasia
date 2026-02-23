<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  label?: string
  id?: string
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <button
      :id="id"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      @click="toggle"
      class="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814]"
      :class="[
        modelValue ? 'bg-cyan-500 shadow-glow-cyan' : 'bg-[#1A2235] shadow-inset-light',
        disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''
      ]"
    >
      <span class="sr-only">Toggle {{ label }}</span>
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out"
        :class="modelValue ? 'translate-x-[22px]' : 'translate-x-0'"
      />
    </button>
    <label v-if="label" :for="id" class="text-sm font-bold text-slate-200 cursor-pointer select-none" @click="toggle" :class="{'opacity-50': disabled}">
      {{ label }}
    </label>
  </div>
</template>
