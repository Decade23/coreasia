<script setup lang="ts">
import { ref } from "vue"
import { Menu } from "lucide-vue-next"
import TheSidebar from "../organisms/TheSidebar.vue"
import NotificationPanel from "../organisms/NotificationPanel.vue"
import ToastNotification from "../molecules/ToastNotification.vue"
import ThemeToggle from "../atoms/ThemeToggle.vue"

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = isSidebarOpen.value ? false : true
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="relative flex h-screen overflow-hidden bg-core-950 text-content-muted">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute inset-x-0 top-0 h-72 bg-linear-to-b from-brand/6 via-transparent to-transparent" />
      <div class="absolute -top-24 right-0 h-80 w-80 rounded-full bg-cyan-500/6 blur-[120px]" />
      <div class="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-500/5 blur-[120px]" />
    </div>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
        :style="{ background: 'var(--th-overlay)' }"
        @click="closeSidebar"
      />
    </Transition>

    <TheSidebar :is-open="isSidebarOpen" @close="closeSidebar" />

    <main class="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-500">
      <header class="ca-glass-header z-30 flex h-16 shrink-0 items-center justify-between border-b border-divider px-4 lg:h-[72px] lg:px-6 xl:px-8">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <button
            @click="toggleSidebar"
            class="-ml-1 rounded-xl p-2.5 text-content-subtle transition-all hover:bg-tint hover:text-content lg:hidden"
          >
            <Menu class="h-5 w-5" />
          </button>

          <div class="min-w-0 flex-1">
            <slot name="header" />
          </div>
        </div>

        <div class="ml-4 flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <NotificationPanel />
        </div>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div class="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-6 xl:p-8">
          <slot />
        </div>
      </div>
    </main>

    <ToastNotification />
  </div>
</template>
