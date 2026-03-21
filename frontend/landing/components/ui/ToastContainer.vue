<script setup lang="ts">
const { toasts, removeToast } = useToast()

const iconMap: Record<string, string> = {
  success: 'lucide:circle-check-big',
  error: 'lucide:circle-x',
  info: 'lucide:info',
  warning: 'lucide:triangle-alert',
}

const styleMap: Record<string, { accent: string; bg: string; icon: string }> = {
  success: { accent: '#22c55e', bg: 'border-emerald-500/25', icon: 'text-emerald-400' },
  error: { accent: '#f43f5e', bg: 'border-rose-500/25', icon: 'text-rose-400' },
  info: { accent: '#3b82f6', bg: 'border-blue-500/25', icon: 'text-blue-400' },
  warning: { accent: '#f59e0b', bg: 'border-amber-500/25', icon: 'text-amber-400' },
}

const titleMap: Record<string, string> = {
  success: 'Berhasil',
  error: 'Gagal',
  info: 'Info',
  warning: 'Perhatian',
}
</script>

<template>
  <Teleport to="body">
    <div class="ca-toast-wrap">
      <TransitionGroup
        enter-active-class="ca-toast-in"
        enter-from-class="ca-toast-from"
        leave-active-class="ca-toast-out"
        leave-to-class="ca-toast-from"
        move-class="ca-toast-move"
      >
        <div v-for="t in toasts" :key="t.id" class="ca-toast" :class="styleMap[t.type].bg">
          <div class="ca-toast-bar" :style="{ background: styleMap[t.type].accent }" />
          <div class="ca-toast-inner">
            <Icon :name="iconMap[t.type]" class="h-5 w-5 shrink-0 mt-0.5" :class="styleMap[t.type].icon" />
            <div class="flex-1 min-w-0">
              <p class="text-[0.8125rem] font-bold text-[var(--ca-text)] leading-tight">{{ titleMap[t.type] }}</p>
              <p class="mt-0.5 text-xs text-[var(--ca-muted)] leading-relaxed">{{ t.message }}</p>
            </div>
            <button type="button" class="shrink-0 rounded-md p-1 text-[var(--ca-subtle)] hover:text-[var(--ca-text)] transition" @click="removeToast(t.id)">
              <Icon name="lucide:x" class="h-3.5 w-3.5" />
            </button>
          </div>
          <div class="ca-toast-track"><div class="ca-toast-progress" :style="{ background: styleMap[t.type].accent, animationDuration: t.duration + 'ms' }" /></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
.ca-toast-wrap { position: fixed; top: 1rem; right: 1rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; width: 21rem; max-width: calc(100vw - 2rem); pointer-events: none; }
.ca-toast { position: relative; display: flex; flex-direction: column; overflow: hidden; border-radius: 0.75rem; border: 1px solid; background: var(--ca-panel-bg-strong); box-shadow: 0 8px 32px -4px rgba(0,0,0,0.45); pointer-events: auto; }
.ca-toast-bar { position: absolute; top: 0; left: 0; bottom: 0; width: 3px; }
.ca-toast-inner { display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.75rem 0.875rem 0.625rem 1rem; }
.ca-toast-track { height: 2px; background: rgba(255,255,255,0.04); margin: 0 0.875rem 0.5rem 1rem; border-radius: 1px; overflow: hidden; }
.ca-toast-progress { height: 100%; border-radius: 1px; animation: ca-shrink linear forwards; }
@keyframes ca-shrink { from { width: 100%; } to { width: 0%; } }
.ca-toast-in { transition: all .3s cubic-bezier(.16,1,.3,1); }
.ca-toast-out { transition: all .2s ease-in; }
.ca-toast-from { opacity: 0; transform: translateX(1.5rem) scale(.97); }
.ca-toast-move { transition: transform .25s ease; }
</style>
