<template>
    <div class="w-full">
        <label
            v-if="label"
            :for="id"
            class="ca-field-label"
        >
            {{ label }}
            <span v-if="required" class="ca-required">*</span>
        </label>
        
        <div class="relative">
            <input
                :id="id"
                v-bind="$attrs"
                :value="modelValue"
                :disabled="disabled"
                :required="required"
                :type="type"
                :placeholder="placeholder"
                :aria-invalid="error ? 'true' : undefined"
                :aria-describedby="error ? id + '-error' : undefined"
                class="ca-field-control"
                :class="[
                    error
                        ? 'border-rose-300/50 focus:border-rose-400'
                        : 'border-[color:var(--ca-border)] focus:border-amber-300/40',
                    isNumberInput ? 'pr-12' : '',
                    icon && !isNumberInput ? 'pr-10' : '',
                    inputClass
                ]"
                @input="handleInput"
            />

            <div v-if="isNumberInput" class="ca-number-stepper">
                <button
                    type="button"
                    class="ca-number-stepper-button"
                    :disabled="disabled"
                    aria-label="Naikkan nilai"
                    @click="stepValue(1)"
                >
                    <Icon name="lucide:chevron-up" class="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    class="ca-number-stepper-button"
                    :disabled="disabled"
                    aria-label="Turunkan nilai"
                    @click="stepValue(-1)"
                >
                    <Icon name="lucide:chevron-down" class="h-3.5 w-3.5" />
                </button>
            </div>
            
            <div v-else-if="icon" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ca-subtle)]">
                <Icon :name="icon" class="h-4 w-4" />
            </div>
        </div>

        <p v-if="error" :id="id + '-error'" class="mt-1 text-xs ca-field-error">
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue: string | number | null;
    id: string;
    label?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    icon?: string;
    inputClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    required: false,
    disabled: false,
    inputClass: ''
});

const attrs = useAttrs()
const emit = defineEmits(['update:modelValue']);

const isNumberInput = computed(() => props.type === 'number')

const attrsNumber = (key: string) => {
    const raw = attrs[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value === undefined || value === null || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

const stepPrecision = (value: number) => {
    const text = String(value)
    return text.includes('.') ? text.split('.')[1].length : 0
}

const clampValue = (value: number) => {
    const min = attrsNumber('min')
    const max = attrsNumber('max')
    let next = value
    if (min !== null) next = Math.max(min, next)
    if (max !== null) next = Math.min(max, next)
    return next
}

const handleInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    emit('update:modelValue', isNumberInput.value && value !== '' ? Number(value) : value)
}

const stepValue = (direction: 1 | -1) => {
    if (props.disabled) return

    const step = attrsNumber('step') || 1
    const min = attrsNumber('min')
    const max = attrsNumber('max')
    const current = Number(props.modelValue)
    const base = Number.isFinite(current)
        ? current
        : direction > 0
            ? (min ?? 0)
            : (max ?? 0)

    const precision = stepPrecision(step)
    const next = clampValue(Number((base + step * direction).toFixed(precision)))
    emit('update:modelValue', next)
}
</script>
