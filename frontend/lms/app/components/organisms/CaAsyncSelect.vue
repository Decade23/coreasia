<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Check, Search, SearchX, Loader2 } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'

interface Option {
  value: string | number
  label: string
}

const props = defineProps<{
  modelValue?: string | number
  options: Option[]
  isLoading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  placeholder?: string
  label?: string
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | undefined): void
  (e: 'search', query: string): void
  (e: 'loadMore'): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref(null)
const observerRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onClickOutside(containerRef, () => {
  isOpen.value = false
})

let debounceTimer: ReturnType<typeof setTimeout>
watch(searchQuery, (newVal) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('search', newVal)
  }, 400) // 400ms debounce
})

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const selectOption = (opt: Option) => {
  emit('update:modelValue', opt.value)
  isOpen.value = false
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && !props.options.length && !searchQuery.value) {
    // Initial fetch if list is empty
    emit('search', '')
  }
}

// Intersection Observer for Infinite Scroll
const setupObserver = () => {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && props.hasMore && !props.isLoadingMore && !props.isLoading) {
      emit('loadMore')
    }
  }, { root: null, rootMargin: '20px', threshold: 1.0 })
  
  if (observerRef.value) observer.observe(observerRef.value)
}

watch([() => props.hasMore, isOpen, () => props.isLoading], () => {
  if (isOpen.value) {
    setTimeout(setupObserver, 100) // Wait for DOM to render the ref
  } else {
    if (observer) observer.disconnect()
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
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
      class="w-full relative flex items-center justify-between bg-[#1A2235] rounded-xl px-4 py-3.5 h-[52px] transition-all focus:outline-none shadow-inset-light group"
      :class="[
        isOpen ? 'ring-2 ring-cyan-500/50 shadow-glow-cyan bg-[#1A2235]' : 'hover:bg-[#1E273C] focus:ring-2 focus:ring-cyan-500/50'
      ]"
    >
      <span class="block truncate" :class="selectedOption ? 'text-white font-bold' : 'text-content-subtle font-medium'">
        {{ selectedOption ? selectedOption.label : (placeholder || 'Pilih data...') }}
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
      <div v-if="isOpen" class="absolute z-50 w-full mt-2 rounded-xl bg-[#0F1423] shadow-glow-base-strong overflow-hidden border border-white/5">
        <!-- Sticky Search Bar -->
        <div class="sticky top-0 p-2 bg-[#0F1423] border-b border-white/5 z-10">
          <div class="relative flex items-center">
            
            <!-- Dynamic Icon (Search / Spinner) -->
            <div class="absolute left-3 flex items-center justify-center">
              <transition name="fade" mode="out-in">
                <div v-if="isLoading" class="w-4 h-4 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                <Search v-else class="w-4 h-4 text-content-muted" />
              </transition>
            </div>

            <input
              type="text"
              v-model="searchQuery"
              class="w-full h-10 bg-transparent text-xs font-bold text-white placeholder-content-subtle border-none outline-none pl-10 pr-3 focus:ring-0"
              placeholder="Cari..."
              @click.stop
            />
          </div>
        </div>

        <!-- Options & States -->
        <ul class="max-h-64 overflow-y-auto py-1 scrollbar-hide">
          <li
            v-for="opt in options"
            :key="opt.value"
            @click="selectOption(opt)"
            class="px-4 py-2.5 mx-2 my-1 rounded-lg cursor-pointer flex items-center justify-between transition-all"
            :class="[
              modelValue === opt.value
                ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                : 'text-content-subtle hover:bg-white/5 hover:text-white'
            ]"
          >
            <span class="block truncate">{{ opt.label }}</span>
            <Check v-if="modelValue === opt.value" class="w-4 h-4 text-cyan-400" />
          </li>
          
          <!-- Intersection Target for Infinite Scroll -->
          <li v-if="hasMore" ref="observerRef" class="py-1"></li>
          
          <!-- Infinite Loading Indicator -->
          <li v-if="isLoadingMore" class="py-3 flex items-center justify-center gap-2 text-content-subtle text-xs font-bold animate-pulse">
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
            Memuat antrean...
          </li>

          <!-- Empty State -->
          <li v-if="options.length === 0 && !isLoading" class="px-4 py-8 flex flex-col items-center justify-center gap-3">
            <SearchX class="w-8 h-8 text-content-muted/50" />
            <span class="text-content-subtle text-xs font-medium">Tidak ada data sejodoh.</span>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

ul::-webkit-scrollbar {
  width: 6px;
}
ul::-webkit-scrollbar-track {
  background: transparent;
}
ul::-webkit-scrollbar-thumb {
  background: #1A2235;
  border-radius: 9999px;
}
</style>
