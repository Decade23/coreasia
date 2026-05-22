<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calendar as CalendarIcon } from 'lucide-vue-next'

const props = defineProps<{
    modelValue?: string | Date
    id: string
    label?: string
    placeholder?: string
    error?: string
    required?: boolean
    disabled?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const dateValue = computed({
    get: () => {
        if (!props.modelValue) return ''
        if (props.modelValue instanceof Date) {
            return props.modelValue.toISOString().split('T')[0]
        }
        return props.modelValue
    },
    set: (val: string) => emit('update:modelValue', val)
})

const isFocused = ref(false)
</script>

<template>
    <div class="w-full">
        <div v-if="label" class="flex items-center justify-between mb-2 relative">
            <label :for="id" class="block text-xs font-bold uppercase tracking-wider text-content-subtle">
                {{ label }}
                <span v-if="required" class="text-rose-500 ml-1">*</span>
            </label>
        </div>

        <div class="relative flex items-center group">
            <!-- Calendar Icon -->
            <div class="absolute left-4 text-content-muted transition-colors pointer-events-none z-10" :class="{ '!text-cyan-400': isFocused, '!text-rose-400': error }">
                <CalendarIcon class="w-5 h-5" />
            </div>

            <input
                :id="id"
                type="date"
                v-model="dateValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :required="required"
                :aria-invalid="!!error"
                @focus="isFocused = true"
                @blur="isFocused = false"
                class="w-full bg-input rounded-xl pl-11 pr-4 py-3.5 h-[52px] text-content font-bold transition-all placeholder:text-content-subtle placeholder:font-medium focus:outline-none relative z-0 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                :class="[
                    error
                        ? 'ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-input'
                        : 'shadow-inset-light focus:ring-2 focus:ring-cyan-500/50 focus:shadow-glow-cyan focus:bg-input hover:bg-input-hover',
                    disabled ? 'opacity-50 cursor-not-allowed grayscale hover:bg-input' : ''
                ]"
            />
        </div>

        <p v-if="error" role="alert" class="mt-2 text-xs font-bold text-rose-500">{{ error }}</p>
    </div>
</template>

<style scoped>
/* Remove default date input styling */
input[type="date"]::-webkit-inner-spin-button,
input[type="date"]::-webkit-clear-button {
    display: none;
    -webkit-appearance: none;
}
</style>
