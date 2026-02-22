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
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost'
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
    <div v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
    <slot v-else />
  </button>
</template>
