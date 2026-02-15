<script setup lang="ts">
const stats = [
    { label: 'Sertifikasi Terproses', value: '1.2M+', icon: 'lucide:file-check' },
    { label: 'Uptime Platform', value: '99.99%', icon: 'lucide:server' },
    { label: 'Mitra Lembaga', value: '500+', icon: 'lucide:building' },
    { label: 'User Aktif', value: '50k+', icon: 'lucide:users' },
]
</script>

<template>
    <div class="border-y border-white/5 bg-white/[0.02] py-4">
        <div class="ca-container overflow-hidden">
            <div class="flex animate-marquee items-center gap-12 whitespace-nowrap">
                <!-- Duplicate content for seamless loop -->
                <div v-for="i in 2" :key="i" class="flex items-center gap-12">
                    <div 
                        v-for="stat in stats" 
                        :key="stat.label"
                        class="flex items-center gap-3"
                    >
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                            <Icon :name="stat.icon" class="h-4 w-4 text-emerald-400" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-white">{{ stat.value }}</span>
                            <span class="text-xs font-medium text-slate-400">{{ stat.label }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-marquee {
    animation: marquee 30s linear infinite;
}

@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

/* Pause on hover */
.animate-marquee:hover {
    animation-play-state: paused;
}
</style>
