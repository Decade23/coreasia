<template>
  <div class="w-full">
    <button
      :id="id"
      type="button"
      class="ca-card-soft flex w-full items-start justify-between gap-4 rounded-[1.5rem] p-4 text-left transition duration-200 sm:p-5"
      :class="[
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:bg-[var(--ca-panel-bg-strong)]',
        modelValue ? 'ring-1 ring-amber-300/20 shadow-[0_16px_32px_rgba(245,158,11,0.08)]' : '',
      ]"
      :disabled="disabled"
      :aria-pressed="modelValue"
      @click="toggleValue"
    >
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-[var(--ca-text)]">
          {{ label }}
          <span v-if="required" class="ca-required">*</span>
        </p>
        <p v-if="description" class="mt-1 text-xs leading-relaxed text-[var(--ca-muted)]">
          {{ description }}
        </p>
        <slot />
      </div>

      <span
        class="relative mt-0.5 inline-flex h-7 w-12 shrink-0 rounded-full border transition-all duration-200"
        :class="modelValue ? 'border-amber-400/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.95),rgba(255,190,61,0.82))] shadow-[0_10px_20px_rgba(245,158,11,0.2)]' : 'border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)]'"
        aria-hidden="true"
      >
        <span
          class="absolute top-0.5 h-[1.375rem] w-[1.375rem] rounded-full shadow transition-transform duration-200"
          :style="{ background: 'var(--ca-toggle-thumb)', boxShadow: 'var(--ca-toggle-thumb-shadow)' }"
          :class="modelValue ? 'translate-x-[1.45rem]' : 'translate-x-0.5'"
        />
      </span>
    </button>

    <p v-if="error" class="mt-1 text-xs ca-field-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  id: string
  label: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  required: false,
  disabled: false,
  error: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toggleValue = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>
