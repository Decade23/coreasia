<script setup lang="ts">
import { trapDialogFocus } from '~/utils/dialog-focus'
import { COMPANY } from '~/utils/constants'
import { getPublicNavigation, type PublicNavItem } from '~/utils/navigation'
import { useWindowScroll } from '@vueuse/core'
import { useMagnetic } from '~/composables/useMagnetic'

const route = useRoute()
const { locale, t } = useCoreI18n()
const { trackCTAClick, trackWhatsAppClick } = useAnalytics()
const { buildContextualUrl } = useWhatsAppLink()
const navigation = computed(() => getPublicNavigation(locale.value))
const groups = computed(() => navigation.value.filter((item) => item.children))
const text = (id: string, en: string) => (locale.value === 'en' ? en : id)
const link = (path: string) => (locale.value === 'en' ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path)
const waUrl = computed(() =>
    buildContextualUrl(
        text(
            'Halo CoreAsia, saya ingin berdiskusi tentang website atau aplikasi.',
            'Hi CoreAsia, I would like to discuss a website or application.',
        ),
    ),
)
const iconMap: Record<string, string> = {
    web: 'lucide:panels-top-left',
    code: 'lucide:code-2',
    chart: 'lucide:chart-no-axes-combined',
    shield: 'lucide:shield-check',
    clinic: 'lucide:hospital',
    box: 'lucide:package',
    people: 'lucide:users',
    download: 'lucide:download',
    drive: 'lucide:hard-drive',
    file: 'lucide:files',
    hand: 'lucide:handshake',
    chat: 'lucide:message-circle',
}
const header = ref<HTMLElement | null>(null)
const mobileMenu = ref<HTMLDialogElement | null>(null)
const mobileTrigger = ref<HTMLButtonElement | null>(null)
const contactBtnRef = ref<HTMLElement | null>(null)
const { style: magneticStyle } = useMagnetic(contactBtnRef)
const openPanel = ref<string | null>(null)
const mobileOpen = ref(false)
const mobileGroup = ref<string | null>(null)
const visible = ref(true)
const { y } = useWindowScroll()
let previousY = 0
let previousOverflow = ''
const active = (item: PublicNavItem) =>
    item.to
        ? route.path === item.to || route.path.startsWith(`${item.to}/`)
        : item.paths?.some((path) => route.path === path || route.path.startsWith(`${path}/`))
watch(y, (value) => {
    visible.value = value <= 100 || value < previousY || !!openPanel.value || mobileOpen.value
    previousY = value
})
const closePanel = (restoreFocus = false) => {
    const key = openPanel.value
    openPanel.value = null
    if (restoreFocus && key) header.value?.querySelector<HTMLButtonElement>(`[data-panel="${key}"]`)?.focus()
}
const togglePanel = async (key: string, focus = false) => {
    openPanel.value = openPanel.value === key && !focus ? null : key
    visible.value = true
    if (focus) {
        await nextTick()
        header.value?.querySelector<HTMLAnchorElement>(`#nh-panel-${key} a`)?.focus()
    }
}
const afterMobileClose = () => {
    if (!mobileOpen.value) return
    mobileOpen.value = false
    document.body.style.overflow = previousOverflow
    mobileTrigger.value?.focus()
}
const closeMobile = () => mobileMenu.value?.close()
const mobileConsult = () => {
  trackCTAClick('mobile_konsultasi', '/contact')
  closeMobile()
}
const openMobile = async () => {
    closePanel()
    previousOverflow = document.body.style.overflow
    mobileOpen.value = true
    visible.value = true
    await nextTick()
    mobileMenu.value?.showModal()
    document.body.style.overflow = 'hidden'
    mobileMenu.value?.querySelector<HTMLButtonElement>('.nh-close')?.focus()
}
const outside = (event: PointerEvent) => {
    if (!header.value?.contains(event.target as Node)) closePanel()
}
const focusOut = () => {
    setTimeout(() => {
        if (!header.value?.contains(document.activeElement)) closePanel()
    }, 0)
}
const resize = () => {
    if (innerWidth >= 1200) closeMobile()
    else closePanel()
}
watch(
    () => route.fullPath,
    () => {
        closePanel()
        closeMobile()
    },
)
onMounted(() => {
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', outside)
    window.removeEventListener('resize', resize)
    if (mobileOpen.value) document.body.style.overflow = previousOverflow
})
</script>

<template>
    <header
        id="nh-root"
        ref="header"
        :class="{ 'nh-out': !visible, 'nh-open': !!openPanel || mobileOpen, 'nh-scrolled': y > 15 }"
        @focusout="focusOut"
        @keydown.esc="closePanel(true)"
    >
        <div class="nh-bar">
            <div class="nh-inner">
                <NuxtLink
                    :to="link('/')"
                    class="nh-brand"
                    :aria-label="text('CoreAsia, kembali ke beranda', 'CoreAsia, home')"
                >
                    <img src="/logo.svg" alt="" width="36" height="36" >
                    <span>
                        <span class="nh-brand-name">{{ COMPANY.shortName }}</span>
                        <small class="nh-brand-tag">{{ t('components.brand.tagline') }}</small>
                    </span>
                </NuxtLink>
                <nav class="nh-desktop" :aria-label="text('Navigasi utama', 'Main navigation')">
                    <ul class="contents list-none p-0 m-0">
                        <li v-for="item in navigation" :key="item.key" class="nh-nav-item">
                            <button
                                v-if="item.children"
                                type="button"
                                class="nh-trigger"
                                :data-panel="item.key"
                                :data-active="!!active(item)"
                                :aria-expanded="openPanel === item.key"
                                :aria-controls="`nh-panel-${item.key}`"
                                @click="togglePanel(item.key)"
                                @keydown.down.prevent="togglePanel(item.key, true)"
                            >
                                {{ item.label }}
                                <Icon name="lucide:chevron-down" class="nh-icon nh-chevron" />
                            </button>
                            <NuxtLink
                                v-else
                                :to="link(item.to!)"
                                class="nh-direct"
                                :aria-current="active(item) ? 'page' : undefined"
                                @click="closePanel()"
                            >
                                {{ item.label }}
                            </NuxtLink>
                        </li>
                    </ul>
                </nav>
                <div class="nh-actions">
                    <div class="nh-tools">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <a
                            :href="waUrl"
                            class="nh-chat"
                            data-analytics-ignore="true"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="WhatsApp"
                            @click="trackWhatsAppClick('header')"
                        >
                            <Icon name="lucide:message-circle" class="h-4 w-4" />
                        </a>
                    </div>
                    <NuxtLink
                        ref="contactBtnRef"
                        :to="link('/contact')"
                        class="ca-btn-primary nh-primary"
                        data-analytics-ignore="true"
                        :style="magneticStyle"
                        @click="trackCTAClick('header_konsultasi', '/contact')"
                    >
                        {{ t('components.header.ctaText') }}
                    </NuxtLink>
                    <button
                        ref="mobileTrigger"
                        type="button"
                        class="nh-mobile-trigger"
                        aria-haspopup="dialog"
                        aria-controls="nh-mobile-dialog"
                        :aria-expanded="mobileOpen"
                        :aria-label="text('Buka navigasi', 'Open navigation')"
                        @click="openMobile"
                    >
                        <Icon name="lucide:menu" class="nh-icon" />
                    </button>
                </div>
            </div>
        </div>

        <div
            v-for="group in groups"
            :id="`nh-panel-${group.key}`"
            :key="group.key"
            class="nh-dropdown"
            :hidden="openPanel !== group.key"
        >
            <div class="nh-dropdown-grid">
                <div
                    v-for="(items, i) in [
                        group.children!.slice(0, group.key === 'tentang' ? 2 : 3),
                        group.children!.slice(group.key === 'tentang' ? 2 : 3),
                    ]"
                    :key="i"
                    class="nh-drop-column"
                >
                    <span class="nh-drop-label">
                        {{
                            group.key === 'produk'
                                ? i
                                    ? text('Alat harian', 'Everyday tools')
                                    : text('Untuk bisnis', 'For business')
                                : group.key === 'tentang'
                                  ? i
                                      ? text('Mulai percakapan', 'Start a conversation')
                                      : text('Kenali CoreAsia', 'Meet CoreAsia')
                                  : i
                                    ? text('Kebutuhan operasional', 'Operational needs')
                                    : text('Website & aplikasi', 'Websites & applications')
                        }}
                    </span>
                    <NuxtLink
                        v-for="item in items"
                        :key="item.to"
                        :to="link(item.to)"
                        class="nh-drop-link"
                        :aria-current="route.path === item.to ? 'page' : undefined"
                        @click="closePanel()"
                    >
                        <span class="nh-link-icon"><Icon :name="iconMap[item.icon]!" class="nh-icon" /></span>
                        <span>
                            <strong>
                                {{ item.label }}
                                <span v-if="item.soon" class="nh-badge">{{ text('Disiapkan', 'Coming soon') }}</span>
                            </strong>
                            <small>{{ item.description }}</small>
                        </span>
                    </NuxtLink>
                </div>
                <aside class="nh-drop-aside">
                    <span class="nh-eyebrow">{{ text('Mulai dari kebutuhanmu', 'Start with your needs') }}</span>
                    <h3>
                        {{
                            group.key === 'produk'
                                ? text('Ada yang siap kamu gunakan.', 'Find a tool you can use.')
                                : text('Apa yang ingin dibuat lebih mudah?', 'What would you like to make easier?')
                        }}
                    </h3>
                    <p>
                        {{
                            group.key === 'produk'
                                ? text(
                                      'Lihat produk yang sesuai sebelum memutuskan membuat sistem baru.',
                                      'Explore the products before deciding to build a new system.',
                                  )
                                : text(
                                      'Ceritakan alur kerjamu. Kita bahas kebutuhan yang paling penting lebih dulu.',
                                      'Tell us about your workflow. We can start with what matters most.',
                                  )
                        }}
                    </p>
                    <NuxtLink :to="link(group.key === 'produk' ? '/products' : '/contact')" @click="closePanel()">
                        {{
                            group.key === 'produk'
                                ? text('Lihat semua produk', 'Explore all products')
                                : text('Diskusikan kebutuhan', 'Discuss your needs')
                        }}
                        <Icon name="lucide:arrow-right" class="nh-icon" />
                    </NuxtLink>
                </aside>
            </div>
            <div class="nh-drop-bottom">
                <span>{{ t('components.brand.tagline') }}</span>
                <NuxtLink
                    :to="
                        link(
                            group.key === 'produk'
                                ? '/products'
                                : group.key === 'tentang'
                                  ? '/about'
                                  : '/products/build',
                        )
                    "
                    @click="closePanel()"
                >
                    {{
                        group.key === 'produk'
                            ? text('Semua produk', 'All products')
                            : group.key === 'tentang'
                              ? text('Tentang kami', 'About us')
                              : text('Cara kami bekerja', 'How we work')
                    }}
                    <Icon name="lucide:arrow-up-right" class="nh-icon" />
                </NuxtLink>
            </div>
        </div>

        <dialog
            id="nh-mobile-dialog"
            ref="mobileMenu"
            class="nh-dialog"
            :aria-label="text('Navigasi CoreAsia', 'CoreAsia navigation')"
            @keydown.tab="trapDialogFocus"
            @close="afterMobileClose"
            @click="$event.target === mobileMenu && closeMobile()"
        >
            <div class="nh-sheet">
                <div class="nh-sheet-head">
                    <NuxtLink :to="link('/')" class="nh-sheet-brand" @click="closeMobile()">
                        <img src="/logo.svg" alt="" width="31" height="31" >
                        CoreAsia
                    </NuxtLink>
                    <button
                        type="button"
                        class="nh-close"
                        :aria-label="text('Tutup navigasi', 'Close navigation')"
                        @click="closeMobile"
                    >
                        <Icon name="lucide:x" class="nh-icon" />
                    </button>
                </div>
                <div class="nh-sheet-content">
                    <p class="nh-sheet-intro">{{ text('Temukan yang kamu butuhkan', 'Find what you need') }}</p>
                    <nav :aria-label="text('Navigasi mobile', 'Mobile navigation')">
                        <template v-for="item in navigation" :key="item.key">
                            <div v-if="item.children" class="nh-sheet-details">
                                <button
                                    type="button"
                                    class="nh-sheet-summary"
                                    :aria-expanded="mobileGroup === item.key"
                                    :aria-controls="`nh-mobile-${item.key}`"
                                    @click="mobileGroup = mobileGroup === item.key ? null : item.key"
                                >
                                    {{ item.label }}
                                    <Icon name="lucide:chevron-down" class="nh-icon" />
                                </button>
                                <div
                                    :id="`nh-mobile-${item.key}`"
                                    class="nh-sheet-links"
                                    :hidden="mobileGroup !== item.key"
                                >
                                    <NuxtLink
                                        v-for="child in item.children"
                                        :key="child.to"
                                        :to="link(child.to)"
                                        :aria-current="route.path === child.to ? 'page' : undefined"
                                        @click="closeMobile()"
                                    >
                                        <Icon :name="iconMap[child.icon]!" class="nh-icon" />
                                        <span>
                                            {{ child.label }}
                                            <span v-if="child.soon" class="nh-badge">
                                                {{ text('Disiapkan', 'Coming soon') }}
                                            </span>
                                            <small>{{ child.description }}</small>
                                        </span>
                                    </NuxtLink>
                                </div>
                            </div>
                            <NuxtLink
                                v-else
                                :to="link(item.to!)"
                                class="nh-sheet-direct"
                                :aria-current="active(item) ? 'page' : undefined"
                                @click="closeMobile()"
                            >
                                {{ item.label }}
                                <Icon name="lucide:arrow-up-right" class="nh-icon" />
                            </NuxtLink>
                        </template>
                    </nav>
                </div>
                <div class="nh-sheet-footer">
                    <NuxtLink
                        :to="link('/contact')"
                        class="ca-btn-primary nh-mobile-cta"
                        data-analytics-ignore="true"
                        @click="mobileConsult"
                    >
                        {{ text('Diskusikan kebutuhan', 'Discuss your needs') }}
                    </NuxtLink>
                    <div class="nh-sheet-meta">
                        <a
                            :href="waUrl"
                            class="nh-sheet-wa"
                            data-analytics-ignore="true"
                            target="_blank"
                            rel="noopener noreferrer"
                            @click="trackWhatsAppClick('mobile_menu')"
                        >
                            <Icon name="lucide:message-circle" class="nh-icon" />
                            WhatsApp
                        </a>
                        <div class="nh-mobile-tools">
                            <LanguageSwitcher :teleport-to="mobileMenu || 'body'" />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </dialog>
    </header>
</template>
