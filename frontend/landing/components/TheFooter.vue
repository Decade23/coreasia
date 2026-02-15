<script setup lang="ts">
import { LINKS, CONTACT, COMPANY } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { t } = useCoreI18n()
</script>

<template>
    <footer class="border-t border-white/10 bg-core-950/70">
        <div class="ca-container py-10 sm:py-12">
            <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
                <div class="space-y-4">
                    <NuxtLink
                        to="/"
                        class="inline-flex items-center gap-3"
                        aria-label="CoreAsia Home"
                    >
                        <span
                            class="inline-flex h-10 w-10 items-center justify-center"
                        >
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
                            <span
                                class="block font-display text-lg font-bold tracking-tight text-white"
                                >{{ COMPANY.name }}</span
                            >
                            <span
                                class="block text-xs uppercase tracking-[0.14em] text-content-muted"
                                >{{ COMPANY.tagline }}</span
                            >
                        </span>
                    </NuxtLink>
                    <p class="max-w-xl text-sm leading-relaxed text-content-DEFAULT">
                        {{ t('components.footer.description') }}
                    </p>
                    <div class="flex flex-wrap items-center gap-2">
                        <span 
                            v-for="chip in t('components.footer.chips') as unknown as string[]" 
                            :key="chip"
                            class="ca-chip"
                        >
                            {{ chip }}
                        </span>
                    </div>
                </div>

                <div>
                    <h3
                        class="text-sm font-semibold uppercase tracking-[0.14em] text-content-muted"
                    >
                        {{ t('components.footer.links.products') }}
                    </h3>
                    <ul class="mt-4 space-y-2 text-sm text-content-muted">
                        <li>
                            <NuxtLink
                                to="/solutions/lms"
                                class="transition hover:text-brand-primary"
                                >{{ t('nav.solutions') }}</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink
                                to="/solutions/venture"
                                class="transition hover:text-brand-primary"
                                >{{ t('nav.venture') }}</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink
                                to="/contact"
                                class="transition hover:text-brand-primary"
                                >{{ t('nav.contact') }}</NuxtLink
                            >
                        </li>
                    </ul>
                </div>

                <div>
                    <h3
                        class="text-sm font-semibold uppercase tracking-[0.14em] text-content-muted"
                    >
                        {{ t('components.footer.links.contact') }}
                    </h3>
                    <ul class="mt-4 space-y-3 text-sm text-content-muted">
                        <li>
                            <a
                                :href="LINKS.email"
                                class="inline-flex items-center gap-2 transition hover:text-brand-primary"
                            >
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
                                <Icon
                                    name="lucide:message-circle"
                                    class="h-4 w-4"
                                />
                                {{ CONTACT.whatsappDisplay }}
                            </a>
                        </li>
                        <li class="flex items-center gap-2 text-content-DEFAULT">
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
                            class="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-content-muted transition hover:border-white/20 hover:text-white"
                        >
                            <Icon name="bi:linkedin" class="h-4 w-4" />
                        </a>
                        <a
                            :href="LINKS.instagram"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram CoreAsia"
                            class="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-content-muted transition hover:border-white/20 hover:text-white"
                        >
                            <Icon name="bi:instagram" class="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </div>

            <div
                class="mt-10 border-t border-white/10 pt-5 text-xs text-content-muted sm:flex sm:items-center sm:justify-between"
            >
                <p>
                    &copy; {{ new Date().getFullYear() }} {{ COMPANY.name }}.
                    {{ t('components.footer.copyright') }}
                </p>
                <div class="mt-2 flex items-center gap-4 sm:mt-0">
                    <NuxtLink
                        to="/privacy-policy"
                        class="transition hover:text-brand-primary"
                        >{{ t('components.footer.links.privacy') }}</NuxtLink
                    >
                    <NuxtLink
                        to="/terms"
                        class="transition hover:text-brand-primary"
                        >{{ t('components.footer.links.terms') }}</NuxtLink
                    >
                </div>
            </div>
        </div>
    </footer>
</template>
