import { WHATSAPP_DEFAULT_MESSAGE, buildWhatsAppUrl } from '~/utils/constants'

/**
 * Menyisipkan asal halaman ke pesan WhatsApp yang sudah terisi otomatis.
 *
 * Klik WhatsApp TIDAK PERNAH tercatat sebagai konversi Google Ads: kontainer GTM
 * yang terpasang hanya memuat GA4, tanpa satu pun tag AW. Untuk trafik berbayar
 * yang memilih WhatsApp daripada formulir, satu-satunya cara mengetahui percakapan
 * itu berasal dari halaman mana adalah menuliskannya di pesannya sendiri.
 *
 * Cara ini sengaja tidak bergantung pada tag, cookie, maupun penyimpanan peramban,
 * sehingga tetap bekerja ketika pengunjung memakai pemblokir iklan dan ketika dia
 * baru mengirim pesannya berjam-jam kemudian dari perangkat yang berbeda.
 *
 * Yang disisipkan hanya nama halaman yang dibaca manusia. GCLID dan parameter UTM
 * sengaja TIDAK disertakan, karena teks ini dikirim oleh pengunjung atas namanya
 * sendiri dan tidak boleh berisi penanda pelacakan yang tidak dia pahami.
 */
const PAGE_LABELS: Record<string, { id: string, en: string }> = {
    '/layanan/jasa-pembuatan-website': {
        id: 'Jasa Pembuatan Website',
        en: 'Website Development',
    },
    '/layanan/jasa-pembuatan-aplikasi-web': {
        id: 'Jasa Pembuatan Aplikasi Web',
        en: 'Custom Web App Development',
    },
    '/layanan/web-monitoring-dashboard': {
        id: 'Web Monitoring Dashboard',
        en: 'Web Monitoring Dashboard',
    },
    '/layanan/sistem-pelaporan-k3': {
        id: 'Sistem Pelaporan K3',
        en: 'Safety Reporting System',
    },
    '/layanan/sistem-informasi-klinik': {
        id: 'Sistem Informasi Klinik',
        en: 'Clinic Information System',
    },
    '/layanan/sistem-manajemen-transaksi': {
        id: 'Sistem Manajemen Transaksi',
        en: 'Transaction Management System',
    },
    '/layanan': { id: 'Layanan', en: 'Services' },
    '/pricing': { id: 'Harga', en: 'Pricing' },
    '/portfolio': { id: 'Portfolio', en: 'Portfolio' },
    '/faq': { id: 'FAQ', en: 'FAQ' },
}

export const useWhatsAppLink = () => {
    const route = useRoute()
    const { locale } = useCoreI18n()

    /**
     * Bangun tautan WhatsApp dari pesan dasar, ditambah keterangan halaman asal
     * bila halaman saat ini memang punya label. Halaman tanpa label memakai pesan
     * dasarnya apa adanya, supaya tidak muncul keterangan yang janggal.
     */
    const buildContextualUrl = (baseMessage: string = WHATSAPP_DEFAULT_MESSAGE): string => {
        const label = PAGE_LABELS[route.path]
        if (!label) {
            return buildWhatsAppUrl(baseMessage)
        }

        const origin
            = locale.value === 'en'
                ? `I came from your ${label.en} page.`
                : `Saya datang dari halaman ${label.id}.`

        return buildWhatsAppUrl(`${baseMessage.trim()} ${origin}`)
    }

    return { buildContextualUrl }
}
