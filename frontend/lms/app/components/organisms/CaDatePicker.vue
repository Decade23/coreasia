<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  modelValue?: string | Date
  placeholder?: string
  label?: string
  id?: string
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref(null)

// Current viewed month/year
const currentViewDate = ref(props.modelValue ? new Date(props.modelValue) : new Date())
const today = new Date()

// Selected date
const selectedDate = computed(() => {
  if (!props.modelValue) return null
  return new Date(props.modelValue)
})

onClickOutside(containerRef, () => {
  isOpen.value = false
})

const toggleCalendar = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

// Calendar Logic
const daysInMonth = computed(() => {
  return new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth() + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  return new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth(), 1).getDay()
})

// Build calendar grid array
const calendarDays = computed(() => {
  const days = []
  const prevMonthDays = new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth(), 0).getDate()
  
  // padding start (previous month)
  for (let i = firstDayOfMonth.value - 1; i >= 0; i--) {
    days.push({
      date: new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth() - 1, prevMonthDays - i),
      isCurrentMonth: false
    })
  }

  // current month
  for (let i = 1; i <= daysInMonth.value; i++) {
    days.push({
      date: new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth(), i),
      isCurrentMonth: true
    })
  }

  // padding end (next month) to make it exactly 42 slots (6 rows)
  const remainingSlots = 42 - days.length
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({
      date: new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth() + 1, i),
      isCurrentMonth: false
    })
  }

  return days
})

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const formattedDate = computed(() => {
  if (!selectedDate.value) return ''
  return `${selectedDate.value.getDate()} ${months[selectedDate.value.getMonth()]} ${selectedDate.value.getFullYear()}`
})

const selectDate = (date: Date) => {
  // Format as YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  emit('update:modelValue', `${year}-${month}-${day}`)
  
  isOpen.value = false
}

const prevMonth = () => {
  currentViewDate.value = new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentViewDate.value = new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth() + 1, 1)
}

const isSameDay = (d1: Date, d2: Date | null) => {
  if (!d2) return false
  return d1.getDate() === d2.getDate() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear()
}

</script>

<template>
  <div class="w-full relative" ref="containerRef">
    <div v-if="label" class="flex items-center justify-between mb-2">
      <label :for="id" class="block text-xs font-bold uppercase tracking-wider text-content-subtle">
        {{ label }}
      </label>
    </div>

    <!-- Trigger Input -->
    <div class="relative group cursor-pointer" @click="toggleCalendar">
      <div class="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted transition-colors pointer-events-none z-10" :class="{'!text-cyan-400': isOpen, '!text-rose-400': error}">
        <CalendarIcon class="w-5 h-5" />
      </div>

      <input
        :id="id"
        type="text"
        readonly
        :value="formattedDate"
        :placeholder="placeholder || 'Pilih tanggal...'"
        :disabled="disabled"
        class="w-full bg-input rounded-xl px-4 py-3.5 h-[52px] cursor-pointer text-content font-bold transition-all placeholder:text-content-subtle placeholder:font-medium focus:outline-none relative z-0 pl-11"
        :class="[
          error
            ? 'ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-input'
            : 'shadow-inset-light hover:bg-input-hover',
          isOpen ? 'ring-2 ring-cyan-500/50 shadow-glow-cyan bg-input' : '',
          disabled ? 'opacity-50 cursor-not-allowed grayscale hover:bg-input' : ''
        ]"
      />
    </div>
    
    <p v-if="error" class="mt-2 text-xs font-bold text-rose-500">{{ error }}</p>

    <!-- Popover Calendar -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" class="absolute z-50 w-72 mt-2 bg-core-800 shadow-glow-base-strong rounded-2xl p-4 border border-divider">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <button type="button" @click.stop="prevMonth" class="p-2 rounded-lg hover:bg-tint text-content-subtle hover:text-content transition-colors">
            <ChevronLeft class="w-5 h-5" />
          </button>
          <div class="font-bold text-content">
            {{ months[currentViewDate.getMonth()] }} {{ currentViewDate.getFullYear() }}
          </div>
          <button type="button" @click.stop="nextMonth" class="p-2 rounded-lg hover:bg-tint text-content-subtle hover:text-content transition-colors">
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>

        <!-- Days Header -->
        <div class="grid grid-cols-7 mb-2 gap-1 text-center">
          <div v-for="day in weekDays" :key="day" class="text-[10px] font-black uppercase text-content-muted">
            {{ day }}
          </div>
        </div>

        <!-- Matrix -->
        <div class="grid grid-cols-7 gap-1">
          <button
            type="button"
            v-for="(dayObj, i) in calendarDays"
            :key="i"
            @click.stop="selectDate(dayObj.date)"
            class="relative w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-all group focus:outline-none"
            :class="[
              !dayObj.isCurrentMonth ? 'text-content-faint hover:bg-tint' : '',
              dayObj.isCurrentMonth && !isSameDay(dayObj.date, selectedDate) ? 'text-content-muted hover:bg-tint-hover' : '',
              isSameDay(dayObj.date, selectedDate) ? 'bg-cyan-500 text-slate-950 font-black shadow-glow-cyan shadow-cyan-500/40 z-10' : ''
            ]"
          >
            <span>{{ dayObj.date.getDate() }}</span>
            <!-- Dot indicating 'Today' -->
            <div v-if="isSameDay(dayObj.date, today)" class="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full" :class="{'bg-core-800': isSameDay(dayObj.date, selectedDate)}"></div>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
