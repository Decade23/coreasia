<template>
  <div ref="container" class="relative w-full" :class="{ 'z-50': isOpen }">
    <!-- Label -->
    <label v-if="label" :for="id" class="ca-field-label">
      {{ label }}
      <span v-if="required" class="ca-required">*</span>
    </label>

    <!-- Trigger / Input Area -->
    <div
      class="relative flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all duration-200"
      :class="[
        isOpen || isFocused
            ? 'border-amber-300/40 bg-[var(--ca-panel-bg-strong)]'
            : 'border-[color:var(--ca-border)] bg-[var(--ca-input-bg)] text-[var(--ca-text)]',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text',
        error ? '!border-rose-300/50' : ''
      ]"
      @click="toggleDropdown"
    >
      <input
        ref="searchInput"
        :id="id"
        name="ca-option-search"
        v-model="searchQuery"
        type="text"
        autocomplete="new-password"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        data-1p-ignore="true"
        data-bwignore="true"
        data-form-type="other"
        data-lpignore="true"
        role="combobox"
        aria-autocomplete="list"
        :placeholder="selectedLabel || placeholder"
        class="w-full bg-transparent p-0 text-sm leading-normal text-[var(--ca-text)] outline-none ring-0 placeholder:transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
        :class="[
            modelValue && !searchQuery
                ? 'placeholder:text-[var(--ca-text)]'
                : 'placeholder:text-[var(--ca-subtle)]'
        ]"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? id + '-error' : undefined"
        @click.stop
        @focus="handleFocus"
        @blur="handleBlur"
        @input="onSearch"
        @keydown.down.prevent="navigateOptions(1)"
        @keydown.up.prevent="navigateOptions(-1)"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="closeDropdown"
      />

      <div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ca-subtle)]">
        <Icon
            name="lucide:chevron-down"
            class="h-4 w-4 transition-transform duration-200"
            :class="{ 'rotate-180': isOpen }"
        />
      </div>
    </div>

    <!-- Dropdown Options -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <ul
        v-if="isOpen && filteredOptions.length > 0"
        class="ca-field-dropdown ca-scrollbar absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl py-1 shadow-2xl ring-1 ring-black/5 focus:outline-hidden sm:text-sm"
        role="listbox"
      >
        <li
          v-for="(option, index) in filteredOptions"
          :key="option.value"
          :class="[
            'relative cursor-pointer select-none py-2.5 pl-4 pr-9 transition-colors',
            highlightedIndex === index
              ? 'bg-[var(--ca-panel-bg-strong)] text-[var(--ca-text)]'
              : 'text-[var(--ca-muted)]',
            option.value === modelValue
              ? 'bg-[var(--ca-kicker-bg)] font-medium ca-tone-gold'
              : 'font-normal'
          ]"
          @click="selectOption(option)"
          @mouseenter="highlightedIndex = index"
        >
          <span class="block truncate">{{ option.label }}</span>

          <span
            v-if="option.value === modelValue"
            class="absolute inset-y-0 right-0 flex items-center pr-3 ca-tone-gold"
          >
            <Icon name="lucide:check" class="h-4 w-4" aria-hidden="true" />
          </span>
        </li>
      </ul>

      <div
         v-else-if="isOpen && filteredOptions.length === 0"
         class="ca-field-empty absolute z-50 mt-2 w-full rounded-xl py-3 px-4 text-center text-sm shadow-xl"
      >
        {{ t('common.noResults') }}
      </div>
    </Transition>

    <p v-if="error" :id="id + '-error'" class="mt-1 text-xs ca-field-error">
        {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useCoreI18n } from '~/composables/useCoreI18n'

interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue: string | number | null
  options: Option[]
  id: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Pilih opsi...',
  required: false,
  disabled: false
})

const emit = defineEmits(['update:modelValue', 'change'])
const { t } = useCoreI18n()

const isOpen = ref(false)
const isFocused = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const container = ref<HTMLElement | null>(null)
const highlightedIndex = ref(-1)

// Close dropdown when clicking outside
onClickOutside(container, () => closeDropdown())

// Filter options based on search query
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(option => 
    option.label.toLowerCase().includes(query)
  )
})

// Get label of currently selected value
const selectedLabel = computed(() => {
  const selected = props.options.find(o => o.value === props.modelValue)
  return selected ? selected.label : ''
})

// Actions
const handleFocus = () => {
    isFocused.value = true
    openDropdown()
}

const handleBlur = () => {
    // Small delay to allow click events on options to fire first
    setTimeout(() => {
        isFocused.value = false
    }, 150)
}

const openDropdown = () => {
  if (props.disabled) return
  isOpen.value = true
  highlightedIndex.value = -1 
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
}

const toggleDropdown = () => {
  if (props.disabled) return
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
    nextTick(() => searchInput.value?.focus())
  }
}

const selectOption = (option: Option) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeDropdown()
}

const onSearch = () => {
  if (!isOpen.value) isOpen.value = true
  highlightedIndex.value = 0
}

const navigateOptions = (step: number) => {
  if (!isOpen.value) {
    openDropdown()
    return
  }
  
  const total = filteredOptions.value.length
  if (total === 0) return
  
  let nextIndex = highlightedIndex.value + step
  
  if (nextIndex >= total) nextIndex = 0
  if (nextIndex < 0) nextIndex = total - 1
  
  highlightedIndex.value = nextIndex
  
  // Optional: Scroll to active item logic could be added here
}

const selectHighlighted = () => {
  if (isOpen.value && highlightedIndex.value >= 0 && filteredOptions.value[highlightedIndex.value]) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  }
}

watch(() => props.modelValue, () => {
    searchQuery.value = ''
})
</script>

<style scoped>
input,
input:focus,
input:focus-visible,
input:focus-within {
  outline: none !important;
  outline-offset: 0 !important;
  box-shadow: none !important;
  border: none !important;
}

ul::-webkit-scrollbar {
  width: 6px;
}
ul::-webkit-scrollbar-track {
  background: transparent;
}
ul::-webkit-scrollbar-thumb {
  background-color: var(--ca-subtle);
  border-radius: 20px;
}
</style>
