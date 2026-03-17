<template>
    <div class="w-full">
        <div
            class="ca-checkbox-panel flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-sm transition-colors duration-200"
            :class="[
                modelValue ? 'border-amber-300/30 bg-[var(--ca-panel-bg-strong)] text-[var(--ca-text)]' : 'text-[var(--ca-muted)]',
                disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-[var(--ca-panel-bg-strong)]',
                error ? '!border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)]' : '',
            ]"
            @click="onToggle"
        >
            <input
                :id="id"
                ref="inputRef"
                :checked="modelValue"
                :disabled="disabled"
                :required="required"
                :aria-invalid="error ? 'true' : undefined"
                :aria-describedby="error ? id + '-error' : undefined"
                type="checkbox"
                class="sr-only"
                @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
            />

            <span
                class="ca-checkbox-box mt-0.5 flex-shrink-0"
                :data-checked="modelValue"
                aria-hidden="true"
            >
                <Icon
                    name="lucide:check"
                    class="h-3.5 w-3.5 transition-all duration-200"
                    :class="modelValue ? 'scale-100 opacity-100' : 'scale-75 opacity-0'"
                />
            </span>

            <span class="flex-1 leading-relaxed">
                <slot>
                    {{ label }}
                </slot>
            </span>
        </div>

        <p v-if="error" :id="id + '-error'" class="mt-1 text-xs ca-field-error">
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue: boolean
    id: string
    label?: string
    required?: boolean
    disabled?: boolean
    error?: string
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    required: false,
    disabled: false,
    error: '',
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref<HTMLInputElement | null>(null)

const onToggle = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a')) return
    if (props.disabled) return
    emit('update:modelValue', !props.modelValue)
}
</script>
