<script setup lang="ts">
import { ShieldAlert, Home } from 'lucide-vue-next'
import PublicLayout from '~/components/templates/PublicLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'

definePageMeta({
    layout: false,
})

if (import.meta.server) {
    setResponseStatus(403)
}
</script>

<template>
    <PublicLayout>
        <div class="mx-auto flex min-h-[58vh] max-w-xl flex-col items-center justify-center text-center">
            <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10">
                <ShieldAlert class="h-10 w-10 text-rose-300" />
            </div>
            <p class="mb-3 text-xs font-black uppercase tracking-[0.24em] text-content-faint">403</p>
            <h1 class="mb-4 text-3xl font-black text-content md:text-4xl">Akses Ditolak</h1>
            <p class="mb-8 max-w-md text-sm font-medium leading-6 text-content-subtle md:text-base">
                Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <CaButton variant="primary" @click="navigateTo('/')">
                <Home class="h-4 w-4" />
                Kembali ke Beranda
            </CaButton>
        </div>
    </PublicLayout>
</template>
