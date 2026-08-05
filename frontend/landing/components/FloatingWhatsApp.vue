<script setup lang="ts">
import { buildWhatsAppUrl } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useAnalytics } from '~/composables/useAnalytics'

const { t } = useCoreI18n()
const { trackWhatsAppClick } = useAnalytics()

// Pesan pra-isi dibedakan dari CTA header dan footer supaya tim penjualan tahu
// percakapan ini datang dari tombol melayang, bukan dari halaman kontak yang sudah
// membawa konteks formulir. Nomornya sendiri diambil dari utils/constants.ts.
const waUrl = computed(() => buildWhatsAppUrl(t('components.whatsappFloat.message') as string))
</script>

<template>
    <!--
        data-analytics-ignore mencegah perhitungan ganda: plugin lead-capture memasang
        listener klik global, sedangkan tombol ini sudah melapor sendiri lewat @click.
        Transisi hover tidak perlu penjagaan prefers-reduced-motion di sini karena
        assets/css/main.css sudah menumpulkan seluruh transition-duration secara global.
    -->
    <a
        :href="waUrl"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('components.whatsappFloat.ariaLabel')"
        :title="t('components.whatsappFloat.tooltip')"
        data-analytics-ignore="true"
        class="ca-wa-float fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-black/30 transition hover:brightness-110 sm:bottom-8 sm:right-8"
        @click="trackWhatsAppClick('floating_button')"
    >
        <Icon name="bi:whatsapp" class="h-7 w-7" />
    </a>
</template>

<style scoped>
.ca-wa-float {
    /* Hijau resmi WhatsApp, ditulis literal karena bukan bagian dari palet merek
       CoreAsia sehingga tidak layak jadi token tema yang ikut berubah terang/gelap. */
    background-color: #25d366;
}
</style>
