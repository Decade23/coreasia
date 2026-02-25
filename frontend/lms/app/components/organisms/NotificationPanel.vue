<script setup lang="ts">
import { Bell, Check, X } from 'lucide-vue-next'
import { useNotificationStore } from '~/stores/useNotificationStore'

const store = useNotificationStore()
const showPanel = ref(false)

const togglePanel = () => {
    showPanel.value = !showPanel.value
}

const getTypeColor = (type: string) => {
    switch (type) {
        case 'success': return 'bg-emerald-500'
        case 'error': return 'bg-red-500'
        case 'warning': return 'bg-amber-500'
        default: return 'bg-brand'
    }
}
</script>

<template>
    <div class="relative">
        <!-- Bell Button -->
        <button
            class="relative p-2 rounded-xl text-content-subtle hover:text-white hover:bg-white/5 transition-all"
            @click="togglePanel"
        >
            <Bell class="w-5 h-5" />
            <span
                v-if="store.unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
                {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
            </span>
        </button>

        <!-- Panel -->
        <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95 -translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div
                v-if="showPanel"
                class="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#0F1423] border border-white/10 shadow-2xl overflow-hidden z-50"
            >
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 class="text-sm font-bold text-white">Notifikasi</h3>
                    <button
                        v-if="store.unreadCount > 0"
                        class="text-xs text-brand hover:text-brand-secondary transition-colors font-bold flex items-center gap-1"
                        @click="store.markAllAsRead()"
                    >
                        <Check class="w-3 h-3" />
                        Tandai Dibaca
                    </button>
                </div>

                <!-- List -->
                <div class="max-h-80 overflow-y-auto divide-y divide-white/5">
                    <div
                        v-for="notif in store.notifications"
                        :key="notif.id"
                        class="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                        :class="notif.isRead ? 'opacity-60' : ''"
                        @click="store.markAsRead(notif.id)"
                    >
                        <div class="flex items-start gap-3">
                            <span class="w-2 h-2 rounded-full mt-1.5 shrink-0" :class="getTypeColor(notif.type)" />
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-white">{{ notif.title }}</p>
                                <p class="text-xs text-content-muted mt-0.5 line-clamp-2">{{ notif.message }}</p>
                                <p class="text-[10px] text-content-subtle mt-1">
                                    {{ notif.createdAt.toLocaleString('id-ID') }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="store.notifications.length === 0" class="p-8 text-center">
                        <Bell class="w-8 h-8 text-content-subtle mx-auto mb-2 opacity-30" />
                        <p class="text-sm text-content-subtle">Tidak ada notifikasi</p>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Backdrop -->
        <div v-if="showPanel" class="fixed inset-0 z-40" @click="showPanel = false" />
    </div>
</template>
