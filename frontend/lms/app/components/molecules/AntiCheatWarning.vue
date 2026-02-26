<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'

const props = defineProps<{
    attempts: number
    maxAttempts: number
    visible: boolean
}>()

const emit = defineEmits<{
    (e: 'acknowledge'): void
}>()

const remaining = computed(() => props.maxAttempts - props.attempts)
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div
                v-if="visible"
                class="fixed inset-0 z-[200] flex items-center justify-center p-4"
            >
                <div class="absolute inset-0 bg-red-950/80 backdrop-blur-sm" />

                <div class="relative w-full max-w-sm rounded-[2rem] bg-core-900 border border-red-500/30 p-8 text-center z-10">
                    <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-5 animate-pulse">
                        <ShieldAlert class="w-8 h-8 text-red-500" />
                    </div>

                    <h3 class="text-xl font-bold text-red-400 mb-2">Peringatan Kecurangan</h3>
                    <p class="text-sm text-red-300/70 mb-2">
                        Anda terdeteksi meninggalkan halaman ujian.
                    </p>
                    <p class="text-xs font-bold text-red-500 mb-6">
                        Pelanggaran {{ attempts }}/{{ maxAttempts }} — Sisa kesempatan: {{ remaining }}
                    </p>

                    <button
                        @click="emit('acknowledge')"
                        class="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-400 transition-colors"
                    >
                        Kembali ke Ujian
                    </button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
