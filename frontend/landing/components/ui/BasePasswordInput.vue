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
                :type="isVisible ? 'text' : 'password'"
                :placeholder="placeholder"
                class="ca-field-control pr-10"
                :class="[
                    error
                        ? 'border-rose-300/50 focus:border-rose-400'
                        : 'border-[color:var(--ca-border)] focus:border-amber-300/40',
                    inputClass,
                ]"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            />

            <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ca-subtle)] transition hover:text-[var(--ca-text)]"
                :aria-label="isVisible ? hideLabel : showLabel"
                :disabled="disabled"
                @click="isVisible = !isVisible"
            >
                <Icon :name="isVisible ? 'lucide:eye-off' : 'lucide:eye'" class="h-4 w-4" />
            </button>
        </div>

        <p v-if="error" class="mt-1 text-xs ca-field-error">
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue: string
    id: string
    label?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string
    inputClass?: string
    showLabel?: string
    hideLabel?: string
}

withDefaults(defineProps<Props>(), {
    label: '',
    placeholder: '',
    required: false,
    disabled: false,
    error: '',
    inputClass: '',
    showLabel: 'Show password',
    hideLabel: 'Hide password',
})

defineEmits(['update:modelValue'])

const isVisible = ref(false)
</script>
