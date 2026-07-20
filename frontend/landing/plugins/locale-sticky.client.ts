import { DEFAULT_LOCALE, LOCALES, LOCALE_QUERY_KEY, isSupportedLocale } from '~/utils/i18n'

/**
 * Membuat pilihan bahasa tetap "lengket" tanpa merusak cache.
 *
 * Locale rendering ditentukan HANYA oleh `?lang=` (lihat utils/i18n.ts), karena
 * cache Vercel untuk halaman marketing ber-key path + query dan tidak mengenal
 * cookie. Kalau cookie ikut menentukan hasil render, respons Bahasa Indonesia yang
 * ter-cache akan disajikan juga ke pengunjung ber-cookie 'en' dan hidrasinya
 * mismatch di setiap teks.
 *
 * Maka preferensi cookie ditangani di sini: hanya di klien, hanya SETELAH hidrasi
 * selesai, dengan mengganti URL ke varian ber-?lang. Server tetap deterministik
 * per cache key, dan pengunjung tetap mendarat di bahasa pilihannya.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:suspense:resolve', () => {
    const route = useRoute()
    const router = useRouter()
    const cookie = useCookie<keyof typeof LOCALES>('coreasia-locale')

    const preferred = cookie.value
    // Hanya bertindak untuk preferensi non-default yang valid: DEFAULT_LOCALE tak
    // butuh query, jadi URL bersih dibiarkan bersih.
    if (!isSupportedLocale(preferred) || preferred === DEFAULT_LOCALE) return
    // Jangan sentuh URL yang sudah menyatakan bahasanya secara eksplisit — termasuk
    // saat pengunjung sengaja membuka versi Indonesia lewat ?lang=id.
    if (route.query[LOCALE_QUERY_KEY] !== undefined) return

    router.replace({
      path: route.path,
      query: { ...route.query, [LOCALE_QUERY_KEY]: preferred },
      hash: route.hash,
    })
  })
})
