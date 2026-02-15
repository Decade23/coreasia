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
                            class="mt-5 text-balance font-display text-3xl font-bold leading-[1.08] text-white sm:text-4xl lg:text-5xl"
                        >
                            {{ title }}
                        </h1>
                        <p
                            class="mt-4 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg"
                        >
                            {{ description }}
                        </p>

                        <div
                            v-if="$slots.actions"
                            class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
                        >
                            <slot name="actions" />
                        </div>

                        <div v-if="$slots.meta" class="mt-5 text-sm text-slate-300">
                            <slot name="meta" />
                        </div>
                    </div>

                    <aside
                        class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                    >
                        <div
                            class="pointer-events-none absolute inset-0 opacity-80"
                            :class="motifClass"
                        />
                        <div class="relative">
                            <div
                                class="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06]"
                            >
                                <Icon :name="icon" class="h-6 w-6 text-amber-300" />
                            </div>

                            <h2
                                class="mt-4 text-lg font-display font-bold text-white sm:text-xl"
                            >
                                {{ visualTitle }}
                            </h2>
                            <p class="mt-2 text-sm leading-relaxed text-slate-200">
                                {{ visualDescription }}
                            </p>

                            <div class="mt-5 grid gap-3 sm:grid-cols-2">
                                <article
                                    v-for="item in highlights"
                                    :key="item.label"
                                    class="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                                >
                                    <div
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]"
                                    >
                                        <Icon
                                            :name="item.icon"
                                            class="h-4 w-4 text-amber-200"
                                        />
                                    </div>
                                    <p
                                        class="mt-2 text-xs uppercase tracking-[0.12em] text-slate-300"
                                    >
                                        {{ item.label }}
                                    </p>
                                    <p class="mt-1 text-sm text-slate-100">
                                        {{ item.value }}
                                    </p>
                                </article>
                            </div>

                            <div
                                class="mt-5 rounded-lg border border-white/10 bg-white/[0.02] p-3"
                            >
                                <p
                                    class="text-xs uppercase tracking-[0.12em] text-slate-300"
                                >
                                    {{ progressLabel }}
                                </p>
                                <div
                                    class="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
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
        return "bg-[radial-gradient(360px_220px_at_20%_0%,rgba(248,113,113,0.2),transparent_70%),radial-gradient(320px_180px_at_100%_100%,rgba(251,191,36,0.15),transparent_70%)]";
    }

    if (props.tone === "maintenance") {
        return "bg-[radial-gradient(360px_220px_at_10%_10%,rgba(56,189,248,0.18),transparent_70%),radial-gradient(320px_180px_at_90%_100%,rgba(251,191,36,0.16),transparent_70%)]";
    }

    return "bg-[radial-gradient(360px_220px_at_10%_0%,rgba(251,191,36,0.2),transparent_70%),radial-gradient(320px_180px_at_90%_100%,rgba(125,211,252,0.16),transparent_70%)]";
});
</script>
