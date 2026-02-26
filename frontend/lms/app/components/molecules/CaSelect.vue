<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, Check, Search } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'

interface Option {
  value: string | number
  label: string
}

const props = defineProps<{
  modelValue?: string | number
  options: Option[]
  placeholder?: string
  label?: string
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | undefined): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref(null)

onClickOutside(containerRef, () => {
  isOpen.value = false
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt => opt.label.toLowerCase().includes(query))
})

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const selectOption = (opt: Option) => {
  emit('update:modelValue', opt.value)
  isOpen.value = false
  searchQuery.value = ''
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
  }
}
</script>

<template>
  <div class="w-full relative" ref="containerRef">
    <div v-if="label" class="mb-2">
      <label :for="id" class="block text-xs font-bold uppercase tracking-wider text-content-subtle">
        {{ label }}
      </label>
    </div>

    <!-- Trigger Button -->
    <button
      :id="id"
      type="button"
      @click="toggleDropdown"
      class="w-full relative flex items-center justify-between bg-input rounded-xl px-4 py-3.5 h-[52px] transition-all focus:outline-none shadow-inset-light group"
      :class="[
        isOpen ? 'ring-2 ring-cyan-500/50 shadow-glow-cyan bg-input' : 'hover:bg-input-hover focus:ring-2 focus:ring-cyan-500/50'
      ]"
    >
      <span class="block truncate" :class="selectedOption ? 'text-content font-bold' : 'text-content-subtle font-medium'">
        {{ selectedOption ? selectedOption.label : (placeholder || 'Pilih opsi...') }}
      </span>
      <span class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-content-muted group-hover:text-cyan-400 transition-colors" :class="{'!text-cyan-400': isOpen}">
        <ChevronDown class="w-5 h-5 transition-transform duration-300" :class="{ 'rotate-180': isOpen }" />
      </span>
    </button>

    <!-- Popover Menu -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" class="absolute z-50 w-full mt-2 rounded-xl bg-core-800 shadow-glow-base-strong overflow-hidden border border-divider">
        <!-- Sticky Search Bar -->
        <div class="sticky top-0 p-2 bg-core-800 border-b border-divider z-10">
          <div class="relative flex items-center">
            <Search class="w-4 h-4 absolute left-3 text-content-muted" />
            <input
              type="text"
              v-model="searchQuery"
              class="w-full h-10 bg-transparent text-xs font-bold text-content placeholder-content-subtle border-none outline-none pl-9 pr-3 focus:ring-0"
              placeholder="Cari..."
              @click.stop
            />
          </div>
        </div>

        <!-- Options List -->
        <ul class="max-h-60 overflow-y-auto py-1 scrollbar-hide">
          <li
            v-for="opt in filteredOptions"
            :key="opt.value"
            @click="selectOption(opt)"
            class="px-4 py-2.5 mx-2 my-1 rounded-lg cursor-pointer flex items-center justify-between transition-all"
            :class="[
              modelValue === opt.value
                ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                : 'text-content-subtle hover:bg-tint hover:text-content'
            ]"
          >
            <span class="block truncate">{{ opt.label }}</span>
            <Check v-if="modelValue === opt.value" class="w-4 h-4 text-cyan-400" />
          </li>
          <!-- Empty State -->
          <li v-if="filteredOptions.length === 0" class="px-4 py-6 text-center text-content-subtle text-xs font-medium">
            Hasil pencarian tidak ditemukan.
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Minimalist scrollbar for popover menu */
ul::-webkit-scrollbar {
  width: 6px;
}
ul::-webkit-scrollbar-track {
  background: transparent;
}
ul::-webkit-scrollbar-thumb {
  background: var(--th-scrollbar-thumb);
  border-radius: 9999px;
}
</style>
