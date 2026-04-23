<script setup lang="ts">
interface Props {
  show: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const emit = defineEmits<{
  close: []
}>()

const titleId = useId()

const sizeClass = computed(() => {
  const sizes: Record<NonNullable<Props['size']>, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return sizes[props.size]
})

const close = () => emit('close')

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !props.show) return
  event.preventDefault()
  close()
}

watch(() => props.show, (show) => {
  if (!import.meta.client) return

  if (show) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
        @click.self="close"
      >
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-2 scale-[0.98] opacity-0"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="translate-y-1 scale-[0.98] opacity-0"
        >
          <div
            class="ca-console-dialog flex w-full max-h-[90vh] flex-col overflow-hidden p-0"
            :class="sizeClass"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
          >
            <div class="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
              <h3 :id="titleId" class="font-display text-lg font-bold text-[var(--ca-text)]">{{ title }}</h3>
              <button
                type="button"
                class="ca-btn-ghost h-9 w-9 shrink-0 p-0"
                :aria-label="title"
                @click="close"
              >
                <Icon name="lucide:x" class="h-4 w-4" />
              </button>
            </div>
            <div class="ca-console-modal-scroll ca-scrollbar overflow-y-auto px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
