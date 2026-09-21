/**
 * Muat ulang saat build baru terdeteksi / chunk gagal dimuat — TANPA menyalin
 * state ke sessionStorage.
 *
 * Bawaan Nuxt (experimental.emitRouteChunkError 'automatic', plugin
 * nuxt:chunk-reload) memanggil reloadNuxtApp({ persistState: true }): SELURUH
 * payload.state disalin ke sessionStorage 'nuxt:reload:state' setiap kali
 * build baru terdeteksi (polling appManifest) lalu staf berpindah halaman,
 * atau saat chunk gagal. restoreState mati, jadi tidak ada yang menghapusnya.
 * payload.state memuat useState console — id kasus (cf_audit_kasus), nominal
 * saringan transaksi per subjek, teks cari, kepala Pengguna 360 dengan ruang[]
 * keanggotaan, indeks email tersamar, admin_user — padahal aturan Fase 1:
 * id kasus/nominal/teks cari TIDAK di URL maupun storage. Salinan itu bisa
 * dibaca skrip apa pun di origin yang sama, termasuk halaman publik ber-GTM.
 *
 * Karena itu nuxt.config memasang emitRouteChunkError 'manual' (peristiwa
 * app:chunkError tetap dipancarkan, plugin bawaan tidak dipasang) dan plugin
 * ini melakukan hal yang sama dengan persistState: false. Salinan yang
 * tertinggal (tab dengan build lama yang masih terbuka saat rilis) dihapus
 * di awal setiap dokumen — sebelum GTM dieksekusi (skrip useHead baru
 * dirender sesudah semua plugin) — dan saat keluar (useCashflowSesi).
 * Diuji di tests/cashflow/muat-ulang-bersih.test.ts.
 */
import { hapusStateMuatUlang, jalurMuatUlang } from '~/utils/konsol'

export default defineNuxtPlugin({
  name: 'muat-ulang-bersih',
  setup(nuxtApp) {
    hapusStateMuatUlang(() => window.sessionStorage)

    const router = useRouter()
    const config = useRuntimeConfig()
    const galatChunk = new Set<unknown>()

    router.beforeEach(() => {
      galatChunk.clear()
    })
    nuxtApp.hook('app:chunkError', ({ error }) => {
      galatChunk.add(error)
    })

    const muatUlangDi = (to: { fullPath: string }) => {
      reloadNuxtApp({ path: jalurMuatUlang(config.app.baseURL, to.fullPath), persistState: false })
    }
    // Build baru: navigasi berikutnya menjadi muat ulang dokumen penuh.
    nuxtApp.hook('app:manifest:update', () => {
      router.beforeResolve(muatUlangDi)
    })
    router.onError((error, to) => {
      if (galatChunk.has(error)) muatUlangDi(to)
    })
  },
})
