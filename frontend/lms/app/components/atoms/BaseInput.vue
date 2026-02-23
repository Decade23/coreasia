<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

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
  set: (val: string | number) => emit('update:modelValue', val)
})

const isFocused = ref(false)
const showPassword = ref(false)

const actualType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type || 'text'
})

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
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
    
    <div class="relative flex items-center group">
      <!-- Left Icon Slot -->
      <div v-if="$slots.iconLeft" class="absolute left-4 text-content-muted transition-colors pointer-events-none z-10" :class="{'!text-cyan-400': isFocused, '!text-rose-400': error}">
        <slot name="iconLeft" />
      </div>

      <input
        :id="id"
        :type="actualType"
        v-model="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="w-full bg-[#1A2235] rounded-xl px-4 py-3.5 h-[52px] text-white font-bold transition-all placeholder:text-content-subtle placeholder:font-medium focus:outline-none relative z-0"
        :class="[
          error 
            ? 'ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-[#1A2235]' 
            : 'shadow-inset-light focus:ring-2 focus:ring-cyan-500/50 focus:shadow-glow-cyan focus:bg-[#1A2235] hover:bg-[#1E273C]',
          disabled ? 'opacity-50 cursor-not-allowed grayscale hover:bg-[#1A2235]' : '',
          $slots.iconLeft ? 'pl-11' : '',
          ($slots.iconRight || type === 'password') ? 'pr-11' : ''
        ]"
      />
      
      <!-- Right Icon Slot / Password Toggle -->
      <div v-if="type === 'password'" class="absolute right-4 cursor-pointer text-content-muted hover:text-cyan-400 transition-colors z-10 flex items-center justify-center p-1" @click="togglePassword">
        <Eye v-if="!showPassword" class="w-5 h-5" />
        <EyeOff v-else class="w-5 h-5" />
      </div>
      <div v-else-if="$slots.iconRight" class="absolute right-4 text-content-muted pointer-events-none z-10" :class="{'!text-cyan-400': isFocused, '!text-rose-400': error}">
        <slot name="iconRight" />
      </div>
      
      <!-- Legacy Icon Slot -->
      <div v-if="$slots.icon" class="absolute left-4 pointer-events-none z-10">
        <slot name="icon" />
      </div>
    </div>
    
    <p v-if="error" class="mt-2 text-xs font-bold text-rose-500">{{ error }}</p>
  </div>
</template>
