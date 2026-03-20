<script setup lang="ts">
const { toasts, removeToast } = useToast()

const iconMap: Record<string, string> = {
  success: 'lucide:circle-check-big',
  error: 'lucide:circle-x',
  info: 'lucide:info',
  warning: 'lucide:triangle-alert',
}

const accentMap: Record<string, string> = {
  success: '#22c55e',
  error: '#f43f5e',
  info: '#3b82f6',
  warning: '#f59e0b',
}

const bgMap: Record<string, string> = {
  success: 'border-emerald-500/30',
  error: 'border-rose-500/30',
  info: 'border-blue-500/30',
  warning: 'border-amber-500/30',
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
          :class="bgMap[toast.type]"
        >
          <!-- Accent left bar -->
          <div class="ca-toast-accent" :style="{ background: accentMap[toast.type] }" />

          <!-- Content -->
          <div class="ca-toast-body">
            <div class="flex items-start gap-3">
              <div class="ca-toast-icon" :style="{ color: accentMap[toast.type] }">
                <Icon :name="iconMap[toast.type]" class="h-5 w-5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="ca-toast-title">
                  {{ toast.type === 'success' ? 'Berhasil' : toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Perhatian' : 'Info' }}
                </p>
                <p class="ca-toast-message">{{ toast.message }}</p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-md p-1 text-[var(--ca-subtle)] hover:text-[var(--ca-text)] hover:bg-white/5 transition"
                @click="removeToast(toast.id)"
              >
                <Icon name="lucide:x" class="h-4 w-4" />
              </button>
            </div>

            <!-- Progress bar -->
            <div class="ca-toast-progress-track">
              <div
                class="ca-toast-progress-bar"
                :style="{ background: accentMap[toast.type], animationDuration: toast.duration + 'ms' }"
              />
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
.ca-toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 22rem;
  max-width: calc(100vw - 2rem);
  pointer-events: none;
}

.ca-toast-item {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 0.875rem;
  border: 1px solid;
  background: color-mix(in srgb, var(--ca-bg) 92%, white 8%);
  box-shadow:
    0 10px 30px -5px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03);
  pointer-events: auto;
  backdrop-filter: blur(16px) saturate(1.5);
}

.ca-toast-accent {
  width: 4px;
  min-height: 100%;
  flex-shrink: 0;
}

.ca-toast-body {
  flex: 1;
  padding: 0.875rem 1rem;
  min-width: 0;
}

.ca-toast-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.ca-toast-title {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--ca-text);
  line-height: 1.2;
}

.ca-toast-message {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: var(--ca-muted);
  line-height: 1.5;
}

.ca-toast-progress-track {
  margin-top: 0.625rem;
  height: 2px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.ca-toast-progress-bar {
  height: 100%;
  border-radius: 1px;
  animation: ca-toast-shrink linear forwards;
}

@keyframes ca-toast-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* Animations */
.ca-toast-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.ca-toast-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
}
.ca-toast-enter-from {
  opacity: 0;
  transform: translateX(2rem) scale(0.96);
}
.ca-toast-leave-to {
  opacity: 0;
  transform: translateX(2rem) scale(0.96);
}
.ca-toast-move {
  transition: transform 0.3s ease;
}
</style>
