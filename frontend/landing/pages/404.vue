<template>
    <FallbackState
        status-label="Error 404"
        title="Oops! Halaman Tidak Ditemukan (404)"
        description="Sepertinya Anda tersesat. Halaman yang Anda cari mungkin telah dipindahkan atau tidak ada."
        icon="lucide:map-x"
        visual-title="Jalur digital tidak ditemukan"
        visual-description="Peta rute halaman menunjukkan koneksi terputus. Kembali ke beranda untuk melanjutkan navigasi."
        :highlights="highlights"
        progress-label="Path Recovery"
        :progress="32"
        tone="warning"
    >
        <template #actions>
            <NuxtLink to="/" class="ca-btn-primary">
                Kembali ke Beranda
            </NuxtLink>
        </template>
    </FallbackState>
</template>

<script setup lang="ts">
const highlights = [
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
];

useCoreSeo({
    title: "Halaman Tidak Ditemukan (404)",
    description:
        "Halaman tidak ditemukan. Kembali ke beranda CoreAsia untuk melanjutkan navigasi.",
    path: "/404",
    noindex: true,
});
</script>
