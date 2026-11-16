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
 *
 * Chunk gagal: lihat utils/pulih-chunk.ts. Skrip sebaris itu yang memulihkan
 * (termasuk bila berkas utama gagal dan plugin ini tidak pernah berjalan);
 * di sini hanya diberi tahu halaman mana yang sedang dituju.
 * Diuji di tests/cashflow/muat-ulang-bersih.test.ts.
 */
import { hapusStateMuatUlang, jalurMuatUlang } from '~/utils/konsol'
import { PARAM_PULIH_CHUNK, type PulihChunk } from '~/utils/pulih-chunk'

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

    /** true = pengaman sebaris sedang memulihkan; false = ia menolak;
     *  undefined = skripnya tidak ada di dokumen ini. */
    const pulihChunk = (tujuan: string): boolean | undefined => {
      try {
        const f = (window as unknown as { __caPulihChunk?: PulihChunk }).__caPulihChunk
        return typeof f === 'function' ? f(null, tujuan) === true : undefined
      } catch {
        return undefined
      }
    }
    const muatUlangDi = (to: { fullPath: string }) => {
      reloadNuxtApp({ path: jalurMuatUlang(config.app.baseURL, to.fullPath), persistState: false })
    }
    // Build baru: navigasi berikutnya menjadi muat ulang dokumen penuh.
    nuxtApp.hook('app:manifest:update', () => {
      router.beforeResolve(muatUlangDi)
    })
    // Parameter pembeda pemulihan sekali pakai. Skrip sebaris sudah membuangnya
    // dari alamat, tetapi di halaman ber-SSR rute awal diambil dari jalur yang
    // dirender server, jadi parameternya muncul lagi sesudah hidrasi.
    nuxtApp.hook('app:mounted', () => {
      const rute = router.currentRoute.value
      if (!(PARAM_PULIH_CHUNK in rute.query)) return
      const { [PARAM_PULIH_CHUNK]: _buang, ...query } = rute.query
      void router.replace({ path: rute.path, query, hash: rute.hash })
    })
    router.onError((error, to, from) => {
      if (!galatChunk.has(error)) return
      // Pengaman sebaris (utils/pulih-chunk.ts) lebih dulu: ia meminta ulang
      // berkas yang gagal dengan melewati tembolok, lalu memuat ulang di
      // halaman yang dituju, dengan penjaga supaya tidak berputar.
      const hasil = pulihChunk(jalurMuatUlang(config.app.baseURL, to.fullPath))
      if (hasil === true) return
      // Ia menolak, dan ini muatan pertama dokumen (belum ada halaman asal):
      // memuat ulang dokumen yang sama lagi hanya mengulang kegagalan yang
      // sama. Berhenti di sini; itulah yang mencegah putaran.
      if (hasil === false && from?.matched?.length === 0) return
      // Perpindahan halaman oleh pengguna (atau skrip pengaman tidak ada):
      // perilaku lama, muat ulang biasa di jalur tujuan. Dokumen barunya
      // membawa HTML terbaru, dan bila masih gagal ia berhenti di aturan atas.
      muatUlangDi(to)
    })
  },
})
