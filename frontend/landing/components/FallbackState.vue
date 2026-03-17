<template>
    <section class="ca-section">
        <div class="ca-container">
            <div class="ca-card overflow-hidden p-6 sm:p-8 lg:p-10">
                <div
                    class="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center"
                >
                    <div>
                        <span class="ca-kicker">{{ statusLabel }}</span>
                        <h1
                            class="mt-5 text-balance font-display text-3xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-4xl lg:text-5xl"
                        >
                            {{ title }}
                        </h1>
                        <p
                            class="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ca-muted)] sm:text-lg"
                        >
                            {{ description }}
                        </p>

                        <div
                            v-if="$slots.actions"
                            class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
                        >
                            <slot name="actions" />
                        </div>

                        <div v-if="$slots.meta" class="mt-5 text-sm text-[var(--ca-muted)]">
                            <slot name="meta" />
                        </div>
                    </div>

                    <aside
                        class="relative overflow-hidden rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-5 sm:p-6"
                    >
                        <div
                            class="pointer-events-none absolute inset-0 opacity-80"
                            :class="motifClass"
                        />
                        <div class="relative">
                            <div
                                class="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
                            >
                                <Icon :name="icon" class="h-6 w-6 ca-tone-gold" />
                            </div>

                            <h2
                                class="mt-4 text-lg font-display font-bold text-[var(--ca-text)] sm:text-xl"
                            >
                                {{ visualTitle }}
                            </h2>
                            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                                {{ visualDescription }}
                            </p>

                            <div class="mt-5 grid gap-3 sm:grid-cols-2">
                                <article
                                    v-for="item in highlights"
                                    :key="item.label"
                                    class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] p-3"
                                >
                                    <div
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ca-panel-bg)]"
                                    >
                                        <Icon
                                            :name="item.icon"
                                            class="h-4 w-4 ca-tone-gold"
                                        />
                                    </div>
                                    <p
                                        class="mt-2 text-xs uppercase tracking-[0.12em] text-[var(--ca-subtle)]"
                                    >
                                        {{ item.label }}
                                    </p>
                                    <p class="mt-1 text-sm text-[var(--ca-text)]">
                                        {{ item.value }}
                                    </p>
                                </article>
                            </div>

                            <div
                                class="mt-5 rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] p-3"
                            >
                                <p
                                    class="text-xs uppercase tracking-[0.12em] text-[var(--ca-subtle)]"
                                >
                                    {{ progressLabel }}
                                </p>
                                <div
                                    class="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ca-panel-bg)]"
                                >
                                    <span
                                        class="block h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 transition-all duration-500"
                                        :style="{ width: `${clampedProgress}%` }"
                                    />
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
interface Highlight {
    icon: string;
    label: string;
    value: string;
}

const props = withDefaults(
    defineProps<{
        statusLabel: string;
        title: string;
        description: string;
        icon: string;
        visualTitle: string;
        visualDescription: string;
        highlights: Highlight[];
        progressLabel: string;
        progress?: number;
        tone?: "warning" | "danger" | "maintenance";
    }>(),
    {
        progress: 50,
        tone: "warning",
    },
);

const clampedProgress = computed(() => {
    return Math.max(12, Math.min(100, props.progress));
});

const motifClass = computed(() => {
    if (props.tone === "danger") {
        return "fallback-motif-danger";
    }

    if (props.tone === "maintenance") {
        return "fallback-motif-maintenance";
    }

    return "fallback-motif-default";
});
</script>

<style scoped>
.fallback-motif-danger {
    background:
        radial-gradient(360px 220px at 20% 0%, var(--ca-danger-bg) 0%, transparent 70%),
        radial-gradient(320px 180px at 100% 100%, var(--ca-gold-bg) 0%, transparent 70%);
}
.fallback-motif-maintenance {
    background:
        radial-gradient(360px 220px at 10% 10%, var(--ca-info-bg) 0%, transparent 70%),
        radial-gradient(320px 180px at 90% 100%, var(--ca-gold-bg) 0%, transparent 70%);
}
.fallback-motif-default {
    background:
        radial-gradient(360px 220px at 10% 0%, var(--ca-gold-bg) 0%, transparent 70%),
        radial-gradient(320px 180px at 90% 100%, var(--ca-info-bg) 0%, transparent 70%);
}
</style>
