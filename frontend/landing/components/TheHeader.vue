<script setup lang="ts">
import { COMPANY, buildWhatsAppUrl } from '~/utils/constants'
import { getNavItems } from '~/utils/navigation'
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useAnalytics } from '~/composables/useAnalytics'
import { useMagnetic } from '~/composables/useMagnetic'
import { useWindowScroll } from '@vueuse/core'

const route = useRoute();
const { locale, t } = useCoreI18n()
const { trackWhatsAppClick, trackCTAClick } = useAnalytics()

const waUrl = computed(() => {
    const greeting = locale.value === 'en'
        ? `Hi CoreAsia, I'd like to learn more about your products and services.`
        : `Halo CoreAsia, saya ingin mengetahui lebih lanjut tentang produk dan layanan Anda.`
    return buildWhatsAppUrl(greeting)
})
const { y } = useWindowScroll()

const isMobileMenuOpen = ref(false);

// Smart Scroll & Dynamic Style Logic
const isHeaderVisible = ref(true)
const lastScrollY = ref(0)
const isAtTop = ref(true)

watch(y, (newY) => {
    isAtTop.value = newY <= 50
    
    // Always show at very top to avoid flickering or hidden nav on load
    if (newY <= 0) {
        isHeaderVisible.value = true
        lastScrollY.value = 0
        return
    }

    // Determine direction
    const direction = newY > lastScrollY.value ? 'down' : 'up';
    
    // Threshold to hide: scroll down > 100px
    if (direction === 'down' && newY > 100) {
        isHeaderVisible.value = false;
    } else if (direction === 'up') {
        isHeaderVisible.value = true;
    }
    
    lastScrollY.value = newY;
})

const headerClass = computed(() => {
    // Base classes - ensure header is always visible
    // Compact height (h-14) on mobile, standard (h-16) on desktop
    let classes = "fixed top-0 left-0 right-0 z-50 w-full h-14 lg:h-16 transition-transform duration-300"

    // Smart Scroll: Hide header on scroll down, unless menu is open
    if (!isHeaderVisible.value && !isMobileMenuOpen.value) {
        classes += " -translate-y-full"
    } else {
        classes += " translate-y-0"
    }

    // Dynamic styling based on scroll position
    if (isAtTop.value && !isMobileMenuOpen.value) {
        // Transparent at top (immersive)
        classes += " bg-transparent border-b border-transparent"
    } else {
        // Glassmorphism when scrolled or menu open
        classes += " ca-glass-header backdrop-blur-xl"
    }

    return classes
})

const navItems = computed(() => getNavItems(locale.value));

const isActive = (path: string) => {
    if (path.includes("#")) {
        const [targetPath, targetHash] = path.split("#");
        return route.path === (targetPath || "/") && route.hash === `#${targetHash}`;
    }

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

const navIconMap: Record<string, string> = {
    '/': 'lucide:home',
    '/products': 'lucide:box',
    '/partnerships': 'lucide:handshake',
    '/pricing': 'lucide:tag',
    '/artikel': 'lucide:pen-tool',
    '/about': 'lucide:users',
}
</script>

<template>
    <header :class="headerClass">
        <div class="ca-container h-full">
            <div class="flex h-full items-center justify-between gap-3">
                <NuxtLink
                    to="/"
                    class="group inline-flex items-center gap-2 lg:gap-3"
                    :aria-label="t('nav.home')"
                >
                    <span
                        class="inline-flex h-9 w-9 items-center justify-center lg:h-10 lg:w-10"
                    >
                        <NuxtImg
                            src="/logo.svg"
                            alt="CoreAsia logo"
                            width="36"
                            height="36"
                            loading="eager"
                            decoding="async"
                            class="h-8 w-8 object-contain lg:h-9 lg:w-9"
                        />
                    </span>
                    <span class="flex flex-col leading-none">
                        <span
                            class="font-display text-base font-bold tracking-tight text-[var(--ca-text)] lg:text-lg"
                            >{{ COMPANY.shortName }}</span
                        >
                        <span
                            class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ca-muted)]"
                            >{{ t('components.brand.tagline') }}</span
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
                                ? 'bg-[var(--ca-kicker-bg)] text-brand-primary'
                                : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]',
                        ]"
                    >
                        {{ item.label }}
                    </NuxtLink>
                </nav>

                <div class="hidden items-center gap-2 lg:flex">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <a
                        :href="waUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ca-btn-secondary !px-3 !py-2"
                        @click="trackWhatsAppClick('header')"
                    >
                        <Icon name="lucide:message-circle" class="h-4 w-4" />
                        {{ t('common.whatsapp') }}
                    </a>
                    <NuxtLink
                        ref="contactBtnRef"
                        to="/contact"
                        class="ca-btn-primary !px-4 !py-2"
                        :style="magneticStyle"
                        @click="trackCTAClick('header_konsultasi', '/contact')"
                    >
                        {{ t('components.header.ctaText') }}
                    </NuxtLink>
                </div>

                <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--ca-border)] text-[var(--ca-muted)] transition hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)] lg:hidden"
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
            </div>
        </div>

        <Transition
            enter-active-class="transition duration-250 ease-out"
            enter-from-class="opacity-0 translate-y-[-8px]"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-[-8px]"
        >
            <div
                v-if="isMobileMenuOpen"
                id="mobile-nav"
                class="ca-glass-drawer max-h-[calc(100vh-3.5rem)] overflow-y-auto lg:hidden"
            >
                <div class="ca-container py-4">
                    <!-- Nav links -->
                    <nav class="space-y-0.5" aria-label="Mobile Navigation">
                        <NuxtLink
                            v-for="item in navItems"
                            :key="`mobile-${item.to}`"
                            :to="item.to"
                            class="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
                            :class="
                                isActive(item.to)
                                    ? 'bg-brand-primary/8 text-brand-primary'
                                    : 'text-[var(--ca-text)] hover:bg-[var(--ca-panel-bg-strong)]'
                            "
                            @click="closeMobileMenu"
                        >
                            <span
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                                :class="isActive(item.to) ? 'bg-brand-primary/12 text-brand-primary' : 'bg-[var(--ca-panel-bg-strong)] text-[var(--ca-muted)]'"
                            >
                                <Icon :name="navIconMap[item.to] || 'lucide:circle'" class="h-4 w-4" />
                            </span>
                            <span class="flex-1 text-[0.9375rem] font-semibold">{{ item.label }}</span>
                            <Icon
                                name="lucide:chevron-right"
                                class="h-3.5 w-3.5 opacity-25 transition-opacity group-hover:opacity-50"
                            />
                        </NuxtLink>
                    </nav>

                    <!-- Divider -->
                    <div class="my-3 h-px bg-[var(--ca-border)]" />

                    <!-- CTA actions -->
                    <div class="flex flex-col gap-2">
                        <NuxtLink
                            to="/contact"
                            class="ca-btn-primary w-full"
                            @click="trackCTAClick('mobile_konsultasi', '/contact'); closeMobileMenu()"
                        >
                            {{ t('components.header.ctaText') }}
                        </NuxtLink>
                        <a
                            :href="waUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary w-full"
                            @click="trackWhatsAppClick('mobile_menu'); closeMobileMenu()"
                        >
                            <Icon name="lucide:message-circle" class="h-4 w-4" />
                            {{ t('common.whatsapp') }}
                        </a>
                    </div>

                    <!-- Utility row -->
                    <div class="mt-3 flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                        <p class="text-right text-[0.7rem] leading-snug text-[var(--ca-subtle)]">
                            {{ t('components.header.responseTime') }}<br />
                            {{ t('components.header.businessHours') }}
                        </p>
                    </div>
                </div>
            </div>
        </Transition>
    </header>
</template>
