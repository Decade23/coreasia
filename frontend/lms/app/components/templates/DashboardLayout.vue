<script setup lang="ts">
import { ref } from 'vue'
import { Menu } from 'lucide-vue-next'
import TheSidebar from '../organisms/TheSidebar.vue'
import NotificationPanel from '../organisms/NotificationPanel.vue'
import ToastNotification from '../molecules/ToastNotification.vue'
import LocaleSwitcher from '../molecules/LocaleSwitcher.vue'

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
    isSidebarOpen.value = false
}
</script>

<template>
    <div class="min-h-screen flex text-slate-300 relative overflow-hidden bg-core-950">
        <!-- Ambient Background Orbs -->
        <div class="fixed top-0 right-0 w-[800px] h-[800px] bg-cyan-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
        <div class="fixed bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/[0.02] blur-[100px] rounded-full pointer-events-none" />

        <!-- Mobile Backdrop -->
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
                class="fixed inset-0 z-40 bg-core-950/80 backdrop-blur-sm lg:hidden"
                @click="closeSidebar"
            />
        </Transition>

        <!-- Sidebar -->
        <TheSidebar
            :is-open="isSidebarOpen"
            @close="closeSidebar"
        />

        <!-- Main Content -->
        <main class="flex-1 flex flex-col min-w-0 transition-all duration-500 relative z-10">
            <!-- Glass Header -->
            <header class="h-16 lg:h-[72px] ca-glass-header flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                <!-- Left: Mobile menu + page header slot -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <button
                        @click="toggleSidebar"
                        class="lg:hidden p-2.5 -ml-1 text-content-subtle hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <Menu class="w-5 h-5" />
                    </button>

                    <div class="flex-1 min-w-0">
                        <slot name="header" />
                    </div>
                </div>

                <!-- Right: Actions -->
                <div class="flex items-center gap-1.5 shrink-0">
                    <LocaleSwitcher />
                    <NotificationPanel />
                </div>
            </header>

            <!-- Page Content -->
            <div class="p-4 lg:p-8 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div class="max-w-7xl mx-auto w-full">
                    <slot />
                </div>
            </div>
        </main>

        <!-- Toast Notifications -->
        <ToastNotification />
    </div>
</template>

<style>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #1A2235;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #243049;
}
</style>
