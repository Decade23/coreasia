<template>
    <FallbackState
        status-label="Maintenance Mode"
        title="Sedang Dalam Pemeliharaan"
        description="Kami sedang meningkatkan performa platform CoreAsia. Kami akan segera kembali."
        icon="lucide:rocket"
        visual-title="Upgrade platform sedang diproses"
        visual-description="Optimasi infrastruktur sedang berjalan untuk meningkatkan stabilitas dan kecepatan platform."
        :highlights="highlights"
        progress-label="Upgrade Timeline"
        :progress="82"
        tone="maintenance"
    >
        <template #meta> Estimasi selesai: 03.30 WIB </template>
    </FallbackState>
</template>

<script setup lang="ts">
const highlights = [
    {
        icon: "lucide:cpu",
        label: "System Upgrade",
        value: "Resource tuning dan cache refresh",
    },
    {
        icon: "lucide:activity",
        label: "Deployment",
        value: "Rollout bertahap tanpa data loss",
    },
];

useCoreSeo({
    title: "Sedang Dalam Pemeliharaan",
    description:
        "CoreAsia sedang melakukan pemeliharaan sistem untuk peningkatan performa platform.",
    path: "/maintenance",
    noindex: true,
});
</script>
