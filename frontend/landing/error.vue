<template>
    <NuxtLayout name="default">
        <FallbackState
            :status-label="`Error ${statusCode}`"
            :title="activeState.title"
            :description="activeState.description"
            :icon="activeState.icon"
            :visual-title="activeState.visualTitle"
            :visual-description="activeState.visualDescription"
            :highlights="activeState.highlights"
            :progress-label="activeState.progressLabel"
            :progress="activeState.progress"
            :tone="activeState.tone"
        >
            <template #actions>
                <button
                    v-if="isNotFound"
                    type="button"
                    class="ca-btn-primary"
                    @click="goHome"
                >
                    Kembali ke Beranda
                </button>
                <template v-else>
                    <button
                        type="button"
                        class="ca-btn-primary"
                        @click="reloadPage"
                    >
                        Muat Ulang Halaman
                    </button>
                    <NuxtLink to="/contact" class="ca-btn-secondary">
                        Hubungi Support
                    </NuxtLink>
                </template>
            </template>

            <template #meta>
                <div class="mt-4 text-left">
                     <span class="text-slate-300 block mb-2">
                        Jika kendala berulang, sertakan kode error:
                        <strong class="text-white">{{ statusCode }}</strong>
                    </span>
                    
                    <!-- Developer Debug Info (Visible only if stack exists) -->
                    <div v-if="props.error && (props.error.stack || props.error.message)" class="mt-4 rounded-lg bg-red-950/50 p-4 border border-red-900/50 text-xs font-mono text-red-200 overflow-x-auto max-w-2xl mx-auto">
                        <p class="font-bold mb-2 text-red-100">{{ props.error.message }}</p>
                        <pre v-if="props.error.stack" class="whitespace-pre-wrap opacity-75">{{ props.error.stack }}</pre>
                    </div>
                </div>
            </template>
        </FallbackState>
    </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

interface FallbackHighlight {
    icon: string;
    label: string;
    value: string;
}

interface FallbackStatePayload {
    title: string;
    description: string;
    icon: string;
    visualTitle: string;
    visualDescription: string;
    highlights: FallbackHighlight[];
    progressLabel: string;
    progress: number;
    tone: "warning" | "danger";
}

const props = defineProps<{
    error: NuxtError;
}>();

const statusCode = computed(() => {
    return Number(props.error?.statusCode || 500);
});

const isNotFound = computed(() => statusCode.value === 404);

const state404: FallbackStatePayload = {
    title: "Oops! Halaman Tidak Ditemukan (404)",
    description:
        "Sepertinya Anda tersesat. Halaman yang Anda cari mungkin telah dipindahkan atau tidak ada.",
    icon: "lucide:map-x",
    visualTitle: "Jalur digital tidak ditemukan",
    visualDescription:
        "Peta rute halaman menunjukkan koneksi terputus. Kembali ke beranda untuk melanjutkan navigasi.",
    highlights: [
        {
            icon: "lucide:map-pinned",
            label: "Node Status",
            value: "Route endpoint tidak aktif",
        },
        {
            icon: "lucide:wifi-off",
            label: "Connection",
            value: "Link halaman terputus",
        },
    ],
    progressLabel: "Path Recovery",
    progress: 32,
    tone: "warning",
};

const state500: FallbackStatePayload = {
    title: "Terjadi Kesalahan Sistem (500)",
    description:
        "Maaf, ada masalah di sisi server kami. Tim teknis kami sedang memperbaikinya. Silakan coba beberapa saat lagi.",
    icon: "lucide:server-crash",
    visualTitle: "Perbaikan sistem sedang berjalan",
    visualDescription:
        "Cluster server kami sedang distabilkan. Proses recovery dipantau otomatis agar layanan kembali normal.",
    highlights: [
        {
            icon: "lucide:wrench",
            label: "Maintenance",
            value: "Service patch sedang diterapkan",
        },
        {
            icon: "lucide:gauge",
            label: "Health Check",
            value: "Validasi performa server aktif",
        },
    ],
    progressLabel: "Recovery Progress",
    progress: 68,
    tone: "danger",
};

const activeState = computed(() => {
    return isNotFound.value ? state404 : state500;
});

useSeoMeta({
    title: computed(() => `Error ${statusCode.value}`),
    description: computed(() => activeState.value.description),
    robots: "noindex, nofollow",
    googlebot: "noindex, nofollow",
});

const goHome = () => {
    clearError({ redirect: "/" });
};

const reloadPage = () => {
    if (process.client) {
        window.location.reload();
        return;
    }

    clearError({ redirect: "/" });
};
</script>
