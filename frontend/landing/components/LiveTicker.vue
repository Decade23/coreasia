<script setup lang="ts">
const { t } = useCoreI18n()

const stats = computed(
    () => (t('components.liveTicker.stats') as Array<{ label: string; value: string; icon: string }>) || [],
)
</script>

<template>
    <div class="border-y border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] py-4">
        <div class="ca-container overflow-hidden">
            <div class="flex animate-marquee items-center gap-12 whitespace-nowrap">
                <!-- Duplicate content for seamless loop -->
                <div v-for="i in 2" :key="i" class="flex items-center gap-12">
                    <div 
                        v-for="stat in stats" 
                        :key="stat.label"
                        class="flex items-center gap-3"
                    >
                        <div class="ca-icon-emerald flex h-8 w-8 items-center justify-center rounded-lg">
                            <Icon :name="stat.icon" class="h-4 w-4" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-[var(--ca-text)]">{{ stat.value }}</span>
                            <span class="text-xs font-medium text-[var(--ca-muted)]">{{ stat.label }}</span>
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
