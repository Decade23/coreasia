<template>
    <div class="w-full">
        <label
            v-if="label"
            :for="id"
            class="mb-2 block text-sm font-medium text-slate-200"
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
            :placeholder="placeholder"
            class="w-full resize-none rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            :class="[
                error
                    ? 'border-rose-300/50 focus:border-rose-400'
                    : 'border-white/12 focus:border-amber-300/40',
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
