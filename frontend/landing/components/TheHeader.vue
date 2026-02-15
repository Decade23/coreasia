<template>
    <header
        class="sticky top-0 z-50 border-b border-white/10 bg-core-950/80 backdrop-blur-xl"
    >
        <div class="ca-container">
            <div class="flex h-16 items-center justify-between gap-3">
                <NuxtLink
                    to="/"
                    class="group inline-flex items-center gap-3"
                    :aria-label="t('nav.home')"
                >
                    <span
                        class="inline-flex h-10 w-10 items-center justify-center"
                    >
                        <NuxtImg
                            src="/logo.svg"
                            alt="CoreAsia logo"
                            width="32"
                            height="32"
                            loading="eager"
                            decoding="async"
                            class="h-9 w-9 object-contain"
                        />
                    </span>
                    <span class="flex flex-col leading-none">
                        <span
                            class="font-display text-lg font-bold tracking-tight text-white"
                            >{{ COMPANY.shortName }}</span
                        >
                        <span
                            class="text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted"
                            >{{ COMPANY.tagline }}</span
                        >
                    </span>
                </NuxtLink>

                <nav
                    :aria-label="t('components.header.ariaLabel')"
                    class="hidden items-center gap-1 lg:flex"
                >
                    <NuxtLink
                        v-for="item in navItems"
                        :key="item.to"
                        :to="item.to"
                        :class="[
                            'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                            isActive(item.to)
                                ? 'bg-white/[0.08] text-brand-primary'
                                : 'text-content-muted hover:bg-white/5 hover:text-white',
                        ]"
                    >
                        {{ item.label }}
                    </NuxtLink>
                </nav>

                <div class="hidden items-center gap-2 lg:flex">
                    <a
                        :href="LINKS.whatsapp"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ca-btn-secondary !px-3 !py-2"
                    >
                        <Icon name="lucide:message-circle" class="h-4 w-4" />
                        {{ t('common.whatsapp') }}
                    </a>
                    <NuxtLink
                        ref="contactBtnRef"
                        to="/contact"
                        class="ca-btn-primary !px-4 !py-2"
                        :style="magneticStyle"
                    >
                        {{ t('components.header.ctaText') }}
                    </NuxtLink>
                </div>

                <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-content-muted transition hover:border-white/20 hover:bg-white/5 lg:hidden"
                    :aria-expanded="isMobileMenuOpen"
                    aria-controls="mobile-nav"
                    :aria-label="isMobileMenuOpen ? t('components.header.mobileMenuAriaClose') : t('components.header.mobileMenuAriaOpen')"
                    @click="toggleMobileMenu"
                >
                    <Icon
                        :name="isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'"
                        class="h-5 w-5"
                    />
                </button>

                <!-- Language Switcher (Hidden: English not ready) -->
                <!-- <LanguageSwitcher /> -->
            </div>
        </div>

        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
        >
            <div
                v-if="isMobileMenuOpen"
                id="mobile-nav"
                class="border-t border-white/10 bg-core-950/95 lg:hidden"
            >
                <div class="ca-container space-y-5 py-5">
                    <nav class="space-y-1" aria-label="Mobile Navigation">
                        <NuxtLink
                            v-for="item in navItems"
                            :key="`mobile-${item.to}`"
                            :to="item.to"
                            class="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition"
                            :class="
                                isActive(item.to)
                                    ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary'
                                    : 'border-white/10 bg-white/[0.03] text-content-DEFAULT hover:border-white/20 hover:bg-white/5'
                            "
                            @click="closeMobileMenu"
                        >
                            <span>{{ item.label }}</span>
                            <Icon
                                name="lucide:arrow-right"
                                class="h-4 w-4 opacity-70"
                            />
                        </NuxtLink>
                    </nav>

                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary w-full"
                            @click="closeMobileMenu"
                        >
                            <Icon
                                name="lucide:message-circle"
                                class="h-4 w-4"
                            />
                            {{ t('common.whatsapp') }}
                        </a>
                        <NuxtLink
                            to="/contact"
                            class="ca-btn-primary w-full"
                            @click="closeMobileMenu"
                        >
                            {{ t('components.header.ctaText') }}
                        </NuxtLink>
                    </div>

                    <p class="text-center text-xs text-content-subtle">
                        {{ t('components.header.responseTime') }}: {{ CONTACT.businessHours }}
                    </p>
                </div>
            </div>
        </Transition>
    </header>
</template>

<script setup lang="ts">
import { LINKS, CONTACT, COMPANY } from '~/utils/constants'
import { getNavItems } from '~/utils/navigation'
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useMagnetic } from '~/composables/useMagnetic'

const route = useRoute();

// Get navigation items based on current locale
const { locale, t } = useCoreI18n()
const navItems = computed(() => getNavItems(locale.value));

const isMobileMenuOpen = ref(false);

const isActive = (path: string) => {
    if (path === "/") {
        return route.path === "/";
    }
    return route.path === path || route.path.startsWith(`${path}/`);
};

const setBodyLock = (locked: boolean) => {
    if (!process.client) {
        return;
    }
    document.body.style.overflow = locked ? "hidden" : "";
};

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
};

const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && isMobileMenuOpen.value) {
        closeMobileMenu();
    }
};

watch(
    () => route.fullPath,
    () => {
        closeMobileMenu();
    },
);

watch(isMobileMenuOpen, (value: boolean) => {
    setBodyLock(value);
});

onMounted(() => {
    window.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleEscape);
    setBodyLock(false);
});

// Magnetic Button implementation
const contactBtnRef = ref(null)
const { style: magneticStyle } = useMagnetic(contactBtnRef, 0.3)
</script>
