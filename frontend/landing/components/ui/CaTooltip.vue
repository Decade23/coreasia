<script setup lang="ts">
const props = withDefaults(defineProps<{
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}>(), {
  position: 'top',
  delay: 300,
})

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const show = () => {
  timer = setTimeout(() => { visible.value = true }, props.delay)
}
const hide = () => {
  if (timer) clearTimeout(timer)
  visible.value = false
}

const positionClasses = computed(() => {
  switch (props.position) {
    case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2'
    case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2'
    case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2'
    default: return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
  }
})

const arrowClasses = computed(() => {
  switch (props.position) {
    case 'bottom': return 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--ca-panel-bg-strong)]'
    case 'left': return 'left-full top-1/2 -translate-y-1/2 border-l-[var(--ca-panel-bg-strong)]'
    case 'right': return 'right-full top-1/2 -translate-y-1/2 border-r-[var(--ca-panel-bg-strong)]'
    default: return 'top-full left-1/2 -translate-x-1/2 border-t-[var(--ca-panel-bg-strong)]'
  }
})

const arrowBorder = computed(() => {
  switch (props.position) {
    case 'bottom': return 'border-4 border-transparent border-b-[var(--ca-panel-bg-strong)]'
    case 'left': return 'border-4 border-transparent border-l-[var(--ca-panel-bg-strong)]'
    case 'right': return 'border-4 border-transparent border-r-[var(--ca-panel-bg-strong)]'
    default: return 'border-4 border-transparent border-t-[var(--ca-panel-bg-strong)]'
  }
})
</script>

<template>
  <div class="ca-tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
    <slot />
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="visible && text"
        class="ca-tooltip-content"
        :class="positionClasses"
      >
        <div class="ca-tooltip-box">
          <span class="ca-tooltip-gold-line" />
          {{ text }}
        </div>
        <span class="ca-tooltip-arrow" :class="[arrowClasses, arrowBorder]" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ca-tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.ca-tooltip-content {
  position: absolute;
  z-index: 50;
  pointer-events: none;
  white-space: nowrap;
}

.ca-tooltip-box {
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
  background: var(--ca-panel-bg-strong);
  padding: 0.375rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--ca-text);
  letter-spacing: 0.01em;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--ca-border);
}

.ca-tooltip-gold-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #ffbe3d, #f59e0b);
}

.ca-tooltip-arrow {
  position: absolute;
  display: block;
  width: 0;
  height: 0;
}
</style>
