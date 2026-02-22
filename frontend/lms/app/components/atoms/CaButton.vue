<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
})

const variants = {
  primary: 'bg-brand text-slate-950 hover:bg-brand-400 font-extrabold shadow-lg shadow-brand/20',
  secondary: 'bg-brand-secondary text-slate-950 hover:bg-emerald-400 font-extrabold',
  outline: 'border-2 border-brand text-brand hover:bg-brand/10',
  ghost: 'text-content-muted hover:text-content hover:bg-core-800'
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-4 text-base rounded-2xl'
}
</script>

<template>
  <button
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[variants[variant], sizes[size]]"
  >
    <div v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
    <slot v-else />
  </button>
</template>
