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
        
        <div class="relative">
            <input
                :id="id"
                v-bind="$attrs"
                :value="modelValue"
                :disabled="disabled"
                :type="type"
                :placeholder="placeholder"
                class="w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                :class="[
                    error
                        ? 'border-rose-300/50 focus:border-rose-400'
                        : 'border-white/12 focus:border-amber-300/40',
                    inputClass
                ]"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            />
            
            <div v-if="icon" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icon :name="icon" class="h-4 w-4" />
            </div>
        </div>

        <p v-if="error" class="mt-1 text-xs text-rose-300">
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue: string | number;
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

withDefaults(defineProps<Props>(), {
    type: 'text',
    required: false,
    disabled: false,
    inputClass: ''
});

defineEmits(['update:modelValue']);
</script>
