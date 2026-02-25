<script setup lang="ts">
import { ShieldX, ArrowLeft, Home } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'

const props = defineProps<{
    error?: {
        statusCode?: number
        statusMessage?: string
        message?: string
    }
}>()

const statusCode = computed(() => props.error?.statusCode || 500)

const errorMap: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
    },
    404: {
        title: 'Halaman Tidak Ditemukan',
        description: 'Halaman yang Anda cari tidak ada atau telah dipindahkan.',
    },
    500: {
        title: 'Terjadi Kesalahan',
        description: 'Server mengalami masalah. Silakan coba lagi nanti.',
    },
}

const errorInfo = computed(() => errorMap[statusCode.value] ?? errorMap[500]!)


const handleBack = () => {
    clearError({ redirect: '/' })
}
</script>

<template>
    <div class="min-h-screen bg-[#050814] flex items-center justify-center p-6">
        <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div class="relative text-center max-w-md">
            <div class="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
                <ShieldX class="w-10 h-10 text-red-500" />
            </div>

            <p class="text-6xl font-black text-white/10 mb-4">{{ statusCode }}</p>
            <h1 class="text-2xl font-bold text-white mb-3">{{ errorInfo.title }}</h1>
            <p class="text-sm text-content-subtle leading-relaxed mb-8">{{ errorInfo.description }}</p>

            <div class="flex items-center justify-center gap-3">
                <CaButton variant="outline" @click="handleBack">
                    <ArrowLeft class="w-4 h-4" />
                    Kembali
                </CaButton>
                <CaButton variant="primary" @click="clearError({ redirect: '/' })">
                    <Home class="w-4 h-4" />
                    Ke Dashboard
                </CaButton>
            </div>
        </div>
    </div>
</template>
