<script setup lang="ts">
import { LINKS, CONTACT, COMPANY } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { t } = useCoreI18n()

const productLinks = computed(() => (t('components.footer.productLinks') as Array<{ label: string; to: string }>) || [])
const partnershipLinks = computed(() => (t('components.footer.partnershipLinks') as Array<{ label: string; to: string }>) || [])
const serviceLinks = computed(() => (t('components.footer.serviceLinks') as Array<{ label: string; to: string }>) || [])
</script>

<template>
    <footer class="ca-glass-footer">
        <div class="ca-container py-10 sm:py-12">
            <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr_1fr]">
                <div class="space-y-4">
                    <NuxtLink to="/" class="inline-flex items-center gap-3" :aria-label="t('nav.home')">
                        <span class="inline-flex h-10 w-10 items-center justify-center">
                            <NuxtImg
                                src="/logo.svg"
                                alt="CoreAsia logo"
                                width="32"
                                height="32"
                                loading="lazy"
                                decoding="async"
                                class="h-9 w-9 object-contain"
                            />
                        </span>
                        <span>
                            <span class="block font-display text-lg font-bold tracking-tight text-[var(--ca-text)]">
                                {{ COMPANY.name }}
                            </span>
                            <span class="block text-xs uppercase tracking-[0.14em] text-[var(--ca-muted)]">
                                {{ t('components.brand.tagline') }}
                            </span>
                        </span>
                    </NuxtLink>

                    <p class="max-w-xl text-sm leading-relaxed text-[var(--ca-muted)]">
                        {{ t('components.footer.description') }}
                    </p>

                    <div class="flex flex-wrap items-center gap-2">
                        <span
                            v-for="chip in (Array.isArray(t('components.footer.chips')) ? t('components.footer.chips') : [])"
                            :key="chip"
                            class="ca-chip"
                        >
                            {{ chip }}
                        </span>
                    </div>
                </div>

                <div>
                    <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ca-muted)]">
                        {{ t('components.footer.links.products') }}
                    </h3>
                    <ul class="mt-4 space-y-2 text-sm text-[var(--ca-muted)]">
                        <li v-for="item in productLinks" :key="item.to">
                            <NuxtLink :to="item.to" class="transition hover:text-brand-primary">
                                {{ item.label }}
                            </NuxtLink>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ca-muted)]">
                        {{ t('components.footer.links.partnerships') }}
                    </h3>
                    <ul class="mt-4 space-y-2 text-sm text-[var(--ca-muted)]">
                        <li v-for="item in partnershipLinks" :key="item.to">
                            <NuxtLink :to="item.to" class="transition hover:text-brand-primary">
                                {{ item.label }}
                            </NuxtLink>
                        </li>
                    </ul>
                </div>

                <div v-if="serviceLinks.length">
                    <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ca-muted)]">
                        Layanan
                    </h3>
                    <ul class="mt-4 space-y-2 text-sm text-[var(--ca-muted)]">
                        <li v-for="item in serviceLinks" :key="item.to">
                            <NuxtLink :to="item.to" class="transition hover:text-brand-primary">
                                {{ item.label }}
                            </NuxtLink>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ca-muted)]">
                        {{ t('components.footer.links.contact') }}
                    </h3>
                    <ul class="mt-4 space-y-3 text-sm text-[var(--ca-muted)]">
                        <li>
                            <a :href="LINKS.email" class="inline-flex items-center gap-2 transition hover:text-brand-primary">
                                <Icon name="lucide:mail" class="h-4 w-4" />
                                {{ CONTACT.email }}
                            </a>
                        </li>
                        <li>
                            <a
                                :href="LINKS.whatsapp"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-2 transition hover:text-brand-secondary"
                            >
                                <Icon name="lucide:message-circle" class="h-4 w-4" />
                                {{ CONTACT.whatsappDisplay }}
                            </a>
                        </li>
                        <li class="flex items-center gap-2 text-[var(--ca-text)]">
                            <Icon name="lucide:map-pin" class="h-4 w-4" />
                            {{ CONTACT.location }}
                        </li>
                    </ul>

                    <div class="mt-5 flex items-center gap-2">
                        <a
                            :href="LINKS.linkedin"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn CoreAsia"
                            class="grid h-9 w-9 place-items-center rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] text-[var(--ca-muted)] transition hover:text-[var(--ca-text)]"
                        >
                            <Icon name="bi:linkedin" class="h-4 w-4" />
                        </a>
                        <a
                            :href="LINKS.instagram"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram CoreAsia"
                            class="grid h-9 w-9 place-items-center rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] text-[var(--ca-muted)] transition hover:text-[var(--ca-text)]"
                        >
                            <Icon name="bi:instagram" class="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </div>

            <!-- Artikel / Blog link for SEO internal linking -->
            <div class="mt-8">
                <NuxtLink to="/artikel" class="inline-flex items-center gap-2 text-sm text-[var(--ca-muted)] transition hover:text-brand-primary">
                    <Icon name="lucide:newspaper" class="h-4 w-4" />
                    {{ t('components.footer.links.articles') || 'Artikel & Insight' }}
                </NuxtLink>
            </div>

            <!-- Geographic Keywords for SEO -->
            <div class="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--ca-muted)]/60">
                <NuxtLink to="/layanan/jasa-pembuatan-website" class="hover:text-brand-primary transition">Jasa Pembuatan Website Jakarta</NuxtLink>
                <span class="select-none">&middot;</span>
                <NuxtLink to="/layanan/jasa-pembuatan-website" class="hover:text-brand-primary transition">Web Development Surabaya</NuxtLink>
                <span class="select-none">&middot;</span>
                <NuxtLink to="/layanan/jasa-pembuatan-website" class="hover:text-brand-primary transition">Jasa Web App Bandung</NuxtLink>
                <span class="select-none">&middot;</span>
                <NuxtLink to="/layanan/jasa-pembuatan-aplikasi-web" class="hover:text-brand-primary transition">Jasa Aplikasi Web Custom</NuxtLink>
                <span class="select-none">&middot;</span>
                <NuxtLink to="/layanan/web-monitoring-dashboard" class="hover:text-brand-primary transition">Dashboard Monitoring Website</NuxtLink>
                <span class="select-none">&middot;</span>
                <NuxtLink to="/products/pantau" class="hover:text-brand-primary transition">SEO Monitoring Indonesia</NuxtLink>
                <span class="select-none">&middot;</span>
                <NuxtLink to="/artikel" class="hover:text-brand-primary transition">Artikel Digital Marketing</NuxtLink>
            </div>

            <div class="mt-10 border-t border-[color:var(--ca-border)] pt-5 text-xs text-[var(--ca-muted)] sm:flex sm:items-center sm:justify-between">
                <p>
                    &copy; {{ new Date().getFullYear() }} {{ COMPANY.name }}.
                    {{ t('components.footer.copyright') }}
                </p>
                <div class="mt-2 flex items-center gap-4 sm:mt-0">
                    <NuxtLink to="/privacy-policy" class="transition hover:text-brand-primary">
                        {{ t('components.footer.links.privacy') }}
                    </NuxtLink>
                    <NuxtLink to="/terms" class="transition hover:text-brand-primary">
                        {{ t('components.footer.links.terms') }}
                    </NuxtLink>
                </div>
            </div>
        </div>
    </footer>
</template>
