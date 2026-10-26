<script setup lang="ts">
import { getPublicNavigation } from '~/utils/navigation'
const { locale } = useCoreI18n()
const text = (id: string, en: string) => (locale.value === 'en' ? en : id)
const services = computed(() => getPublicNavigation(locale.value).find((item) => item.key === 'layanan')!.children!)
useCoreSeo(() => ({
    title: text(
        'Jasa Website, Aplikasi Web & Sistem Operasional',
        'Website, Web Application & Operational Software Services',
    ),
    description: text(
        'Jasa pembuatan website dan aplikasi web custom CoreAsia. Pilih kebutuhan bisnis, lihat lingkup pengerjaan, estimasi biaya dan contoh proyek.',
        'Explore CoreAsia website development and custom web application services. Review scope, cost estimates, and examples before starting.',
    ),
    path: '/layanan',
}))
</script>
<template>
    <div>
        <section class="ca-section">
            <div class="ca-container">
                <span class="ca-kicker">{{ text('Layanan CoreAsia', 'CoreAsia services') }}</span>
                <h1 class="ca-title mt-5 max-w-4xl">
                    {{
                        text(
                            'Website dan aplikasi yang mengikuti kebutuhan kerjamu.',
                            'Websites and applications around the way you work.',
                        )
                    }}
                </h1>
                <p class="ca-copy mt-5 max-w-3xl">
                    {{
                        text(
                            'Mulai dari kebutuhan pengunjung atau pekerjaan tim. Lihat lingkup setiap layanan sebelum menentukan bentuk pengerjaannya.',
                            'Start with what your visitors or team need to do. Explore each service before choosing the scope.',
                        )
                    }}
                </p>
            </div>
        </section>
        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <NuxtLink
                        v-for="item in services"
                        :key="item.to"
                        :to="locale === 'en' ? `${item.to}?lang=en` : item.to"
                        class="ca-card-soft flex flex-col p-7"
                    >
                        <h2 class="font-display text-xl font-bold">{{ item.label }}</h2>
                        <p class="mt-3 mb-6 flex-1 text-sm leading-relaxed text-[var(--ca-muted)]">
                            {{ item.description }}
                        </p>
                        <span class="inline-flex items-center justify-between text-sm font-semibold ca-tone-gold">
                            {{ text('Lihat lingkup layanan', 'Explore the service') }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </span>
                    </NuxtLink>
                </div>
                <div class="mt-8 flex flex-wrap gap-4">
                    <NuxtLink to="/pricing" class="ca-btn-secondary">
                        {{ text('Lihat estimasi biaya', 'View cost estimates') }}
                    </NuxtLink>
                    <NuxtLink to="/portfolio" class="ca-btn-secondary">
                        {{ text('Lihat portofolio', 'Explore our work') }}
                    </NuxtLink>
                    <NuxtLink to="/contact" class="ca-btn-primary">
                        {{ text('Diskusikan kebutuhan', 'Discuss your needs') }}
                    </NuxtLink>
                </div>
            </div>
        </section>
    </div>
</template>