<script setup lang="ts">
import { trapDialogFocus } from '~/utils/dialog-focus'
import { readPublicConsent, savePublicConsent, CONSENT_EVENT } from '~/utils/public-consent'
const { locale } = useCoreI18n()
const text = (id: string, en: string) => (locale.value === 'en' ? en : id)
const ready = ref(false)
const decided = ref(false)
const analytics = ref(false)
const ads = ref(false)
const settings = ref<HTMLDialogElement | null>(null)
const sync = () => {
    const choice = readPublicConsent()
    decided.value = choice.decided
    analytics.value = choice.analytics
    ads.value = choice.ads
}
const save = (a: boolean, m: boolean) => {
    savePublicConsent(a, m)
    sync()
    settings.value?.close()
}
const open = () => {
    sync()
    settings.value?.showModal()
}
onMounted(() => {
    sync()
    ready.value = true
    window.addEventListener(CONSENT_EVENT, sync)
})
onBeforeUnmount(() => window.removeEventListener(CONSENT_EVENT, sync))
</script>
<template>
    <div class="ca-container pb-8 text-center">
        <button
            type="button"
            class="min-h-11 text-xs text-[var(--ca-muted)] underline underline-offset-4"
            @click="open"
        >
            {{ text('Pengaturan privasi', 'Privacy settings') }}
        </button>
    </div>
    <section
        v-if="ready && !decided"
        class="ca-privacy-banner"
        role="region"
        :aria-label="text('Pilihan privasi', 'Privacy choices')"
    >
        <div>
            <h2 class="font-display text-lg font-bold">{{ text('Pilihan privasi kamu', 'Your privacy choices') }}</h2>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{
                    text(
                        'Cookie dasar menjaga pilihan bahasa dan tampilan. Dengan izinmu, kami juga memakai analitik untuk memahami kunjungan dan pengukuran iklan.',
                        'Essential cookies remember language and appearance. With your permission, we also use analytics to understand visits and measure advertising.',
                    )
                }}
                <NuxtLink to="/privacy-policy" class="underline underline-offset-2">
                    {{ text('Baca kebijakan privasi', 'Read our privacy policy') }}
                </NuxtLink>
            </p>
        </div>
        <div class="flex flex-wrap gap-2">
            <button type="button" class="ca-btn-secondary" @click="save(false, false)">
                {{ text('Hanya yang diperlukan', 'Essential only') }}
            </button>
            <button type="button" class="ca-btn-secondary" @click="open">
                {{ text('Atur pilihan', 'Manage choices') }}
            </button>
            <button type="button" class="ca-btn-primary" @click="save(true, true)">
                {{ text('Izinkan semua', 'Allow all') }}
            </button>
        </div>
    </section>
    <dialog ref="settings" class="ca-privacy-dialog" :aria-label="text('Pengaturan privasi', 'Privacy settings')" @keydown.tab="trapDialogFocus">
        <h2 class="font-display text-2xl font-bold">{{ text('Pilih yang kamu izinkan', 'Choose what you allow') }}</h2>
        <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
            {{
                text(
                    'Kamu tetap bisa memakai situs saat pilihan opsional dimatikan. Pilihan ini dapat diubah melalui tautan privasi di bawah halaman.',
                    'You can use the site with optional cookies turned off. You can change your choices using the privacy link at the bottom of the page.',
                )
            }}
        </p>
        <label class="mt-6 flex min-h-14 cursor-pointer items-center gap-3">
            <input v-model="analytics" type="checkbox" class="h-5 w-5" >
            <span>
                <strong>{{ text('Analitik kunjungan', 'Visit analytics') }}</strong>
                <small class="mt-1 block text-[var(--ca-muted)]">
                    {{ text('Membantu kami membaca penggunaan halaman.', 'Helps us understand how pages are used.') }}
                </small>
            </span>
        </label>
        <label class="mt-3 flex min-h-14 cursor-pointer items-center gap-3">
            <input v-model="ads" type="checkbox" class="h-5 w-5" >
            <span>
                <strong>{{ text('Pengukuran iklan', 'Advertising measurement') }}</strong>
                <small class="mt-1 block text-[var(--ca-muted)]">
                    {{
                        text(
                            'Menghubungkan kunjungan dan konsultasi dengan iklan.',
                            'Connects visits and enquiries with advertising.',
                        )
                    }}
                </small>
            </span>
        </label>
        <div class="mt-7 flex flex-wrap gap-3">
            <button type="button" class="ca-btn-primary" @click="save(analytics, ads)">
                {{ text('Simpan pilihan', 'Save choices') }}
            </button>
            <button type="button" class="ca-btn-secondary" @click="settings?.close()">
                {{ text('Tutup', 'Close') }}
            </button>
        </div>
    </dialog>
</template>
<style>
.ca-privacy-banner {
    position: fixed;
    inset: auto 24px 24px;
    z-index: 1100;
    max-width: 1120px;
    margin: auto;
    padding: 23px;
    background: var(--ca-dropdown-bg);
    color: var(--ca-text);
    border: 1px solid var(--ca-border);
    border-radius: 18px;
    box-shadow: 0 15px 60px #10203922;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 24px;
}
.ca-privacy-dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    padding: 30px;
    width: min(560px, calc(100vw - 32px));
    max-height: calc(100dvh - 40px);
    overflow: auto;
    background: var(--ca-dropdown-bg);
    color: var(--ca-text);
    border: 1px solid var(--ca-border);
    border-radius: 20px;
}
.ca-privacy-dialog::backdrop {
    background: #13213a66;
}
.ca-privacy-dialog :focus-visible {
    outline: 3px solid #245c96;
    outline-offset: 4px;
}
html[data-theme='light'] :is(.ca-privacy-banner, .ca-privacy-dialog) {
    background: #fff;
}
@media (max-width: 900px) {
    .ca-privacy-banner {
        grid-template-columns: 1fr;
        gap: 15px;
        inset: auto 12px 12px;
        padding: 19px;
        max-height: calc(100dvh - 30px);
        overflow: auto;
    }
    .ca-privacy-banner button {
        font-size: 11px;
        padding: 11px 13px;
    }
}
</style>
