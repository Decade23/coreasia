<script setup lang="ts">
const { toasts, removeToast } = useToast()

const iconMap: Record<string, string> = {
  success: 'lucide:check-circle-2',
  error: 'lucide:alert-circle',
  info: 'lucide:info',
  warning: 'lucide:alert-triangle',
}

const colorMap: Record<string, string> = {
  success: 'text-emerald-400 border-emerald-400/20 bg-emerald-500/5',
  error: 'text-rose-400 border-rose-400/20 bg-rose-500/5',
  info: 'text-blue-400 border-blue-400/20 bg-blue-500/5',
  warning: 'text-amber-400 border-amber-400/20 bg-amber-500/5',
}

const iconColor: Record<string, string> = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-blue-400',
  warning: 'text-amber-400',
}
</script>

<template>
  <Teleport to="body">
    <div class="ca-toast-container">
      <TransitionGroup
        enter-active-class="ca-toast-enter-active"
        enter-from-class="ca-toast-enter-from"
        leave-active-class="ca-toast-leave-active"
        leave-to-class="ca-toast-leave-to"
        move-class="ca-toast-move"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="ca-toast-item"
          :class="colorMap[toast.type]"
        >
          <Icon :name="iconMap[toast.type]" class="h-4.5 w-4.5 shrink-0" :class="iconColor[toast.type]" />
          <p class="flex-1 text-sm text-[var(--ca-text)]">{{ toast.message }}</p>
          <button
            type="button"
            class="shrink-0 rounded p-0.5 text-[var(--ca-subtle)] hover:text-[var(--ca-muted)] transition"
            @click="removeToast(toast.id)"
          >
            <Icon name="lucide:x" class="h-3.5 w-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
.ca-toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 24rem;
  pointer-events: none;
}

.ca-toast-item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid;
  background: var(--ca-panel-bg-strong);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  backdrop-filter: blur(12px);
}

/* Animations */
.ca-toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.ca-toast-leave-active {
  transition: all 0.2s ease-in;
}
.ca-toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.ca-toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.ca-toast-move {
  transition: transform 0.25s ease;
}
</style>
