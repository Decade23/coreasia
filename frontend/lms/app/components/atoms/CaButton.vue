<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false
})

const variants = {
  primary: 'ca-btn-primary',
  secondary: 'ca-btn-secondary',
  outline: 'bg-[#1A2235]/50 text-white font-bold hover:bg-[#1A2235] hover:text-cyan-400 transition-all duration-300',
  ghost: 'bg-transparent text-content-subtle font-bold hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300'
}

const sizes = {
  sm: 'px-4 py-2 text-xs rounded-lg',
  md: 'px-6 py-3 text-sm rounded-xl',
  lg: 'px-8 py-4 text-base rounded-2xl'
}
</script>

<template>
  <button
    :disabled="disabled || loading"
    class="btn"
    :class="[
      variants[variant], 
      sizes[size],
      fullWidth ? 'w-full' : ''
    ]"
  >
    <div v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
    <slot v-else />
  </button>
</template>
