<template>
  <div class="w-full">
    <button
      :id="id"
      type="button"
      class="ca-card-soft flex w-full items-start justify-between gap-4 p-4 text-left transition duration-200"
      :class="[
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:bg-[var(--ca-panel-bg-strong)]',
        modelValue ? 'ring-1 ring-amber-300/20' : '',
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
        class="relative mt-0.5 inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors duration-200"
        :class="modelValue ? 'border-amber-400/30 bg-amber-400/90' : 'border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)]'"
        aria-hidden="true"
      >
        <span
          class="absolute top-0.5 h-[1.375rem] w-[1.375rem] rounded-full bg-white shadow transition-transform duration-200"
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
