<template>
    <FallbackState
        status-label="Error 500"
        title="Terjadi Kesalahan Sistem (500)"
        description="Maaf, ada masalah di sisi server kami. Tim teknis kami sedang memperbaikinya. Silakan coba beberapa saat lagi."
        icon="lucide:server-crash"
        visual-title="Perbaikan sistem sedang berjalan"
        visual-description="Cluster server kami sedang distabilkan. Proses recovery dipantau otomatis agar layanan kembali normal."
        :highlights="highlights"
        progress-label="Recovery Progress"
        :progress="68"
        tone="danger"
    >
        <template #actions>
            <button type="button" class="ca-btn-primary" @click="reloadPage">
                Muat Ulang Halaman
            </button>
            <NuxtLink to="/contact" class="ca-btn-secondary">
                Hubungi Support
            </NuxtLink>
        </template>
    </FallbackState>
</template>

<script setup lang="ts">
const highlights = [
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
];

const reloadPage = () => {
    if (process.client) {
        window.location.reload();
    }
};

useCoreSeo({
    title: "Terjadi Kesalahan Sistem (500)",
    description:
        "Terjadi gangguan sistem sementara. Tim CoreAsia sedang melakukan perbaikan server.",
    path: "/500",
    noindex: true,
});
</script>
