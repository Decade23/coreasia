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
                    inputClass
                ]"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            />
            
            <div v-if="icon" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ca-subtle)]">
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
