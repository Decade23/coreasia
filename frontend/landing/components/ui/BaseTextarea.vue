<template>
    <div class="w-full">
        <label
            v-if="label"
            :for="id"
            class="ca-field-label"
        >
            {{ label }}
            <span v-if="required" class="text-rose-300">*</span>
        </label>
        
        <textarea
            :id="id"
            v-bind="$attrs"
            :value="modelValue"
            :rows="rows"
            :disabled="disabled"
            :required="required"
            :placeholder="placeholder"
            class="ca-field-control resize-none"
            :class="[
                error
                    ? 'border-rose-300/50 focus:border-rose-400'
                    : 'border-[color:var(--ca-border)] focus:border-amber-300/40',
                inputClass
            ]"
            @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        />

        <p v-if="error" class="mt-1 text-xs text-rose-300">
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue: string;
    id: string;
    label?: string;
    rows?: number;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    inputClass?: string;
}

withDefaults(defineProps<Props>(), {
    rows: 4,
    required: false,
    disabled: false,
    inputClass: ''
});

defineEmits(['update:modelValue']);
</script>
