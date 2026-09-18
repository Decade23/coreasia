/**
 * Satu penanganan galat untuk semua halaman modul CashFlow.
 *
 * Sebelumnya tiap halaman menyalin blok catch yang sama (±9 salinan): pilih
 * kalimat menurut e.jenis, lalu lempar ke /masuk bila sesi hilang. Salinan
 * seperti itu cepat menyimpang — ada halaman yang lupa 'konfigurasi', ada yang
 * mengirim `ke` tanpa query sehingga posisi daftar hilang setelah sambung
 * ulang. Di sini semuanya satu:
 * - `muat(kerja)`  untuk isi halaman: memuat/galat dikelola, galat tampil di halaman.
 *                  Yang TERAKHIR dipanggil yang berhak atas memuat/galat: jawaban
 *                  (sukses, galat, atau selesai) dari panggilan yang sudah
 *                  digantikan tidak menyentuh keadaan halaman. `kerja` menerima
 *                  `terbaru()` untuk menahan tulisan datanya sendiri — pencarian
 *                  per ketikan menembak beberapa permintaan sekaligus, dan yang
 *                  lama bisa tiba (atau gagal) paling akhir;
 * - `aksi(kerja)`  untuk tombol (simpan, hentikan, buka catatan): galat jadi
 *                  toast, isi halaman tetap; `gagal` (opsional) menerima
 *                  galatnya bila halaman perlu membereskan keadaannya sendiri;
 * - sesi hilang    → /console/cashflow/masuk dengan `ke` = URL lengkap saat ini.
 */
import { GalatAdmin, petakanGalat } from './useCashflowAdmin'

export const useCashflowMuat = (opsi: { awal?: boolean } = {}) => {
  const { tcf } = useCashflowI18n()
  const route = useRoute()
  const toast = useToast()
  /* `awal: true` untuk halaman yang memuat di onMounted: tanpa ini ada satu
     bingkai "kosong" sebelum "memuat", dan kosong yang palsu itu terbaca. */
  const memuat = ref(!!opsi.awal)
  const galat = ref<GalatAdmin | null>(null)

  const pesanUntuk = (g: GalatAdmin): string => {
    /* Hint server lebih tepat dari jenisnya: 22023 nilai-tersamar berarti
       "buka dulu nilai utuhnya", bukan sekadar "argumen ditolak" (M/0087 §7). */
    if (g.hint === 'nilai-tersamar') return tcf('galat.nilaiTersamar')
    if (g.hint === 'nilai-pribadi-publik') return tcf('galat.nilaiPribadiPublik')
    // admin_baca_catatan_transaksi: kalimat server hanya berbahasa Indonesia.
    if (g.hint === 'bukan-milik-subjek') return tcf('galat.bukanMilikSubjek')
    switch (g.jenis) {
      case 'bukan-admin': return tcf('umum.bukanAdmin')
      case 'konfigurasi': return tcf('umum.belumKonfigurasi')
      case 'alasan': return tcf('alasan.pendek')
      // Kalimat server menyebut argumen mana yang ditolak; lihat useCashflowAdmin.
      case 'argumen': return g.message || tcf('umum.gagal')
      case 'tidak-ada': return tcf('umum.tidakAda')
      case 'versi-lama': return tcf('galat.versiLama')
      default: return g.message || tcf('umum.gagal')
    }
  }
  const pesanGalat = computed(() => (galat.value ? pesanUntuk(galat.value) : ''))

  /** true bila sudah diarahkan ke /masuk — pemanggil tidak perlu bicara lagi. */
  const keMasukBilaSesi = (g: GalatAdmin): boolean => {
    if (g.jenis !== 'sesi' && g.jenis !== 'totp') return false
    navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'sesi', ke: route.fullPath } })
    return true
  }

  const keGalat = (e: unknown): GalatAdmin => (e instanceof GalatAdmin ? e : petakanGalat(e))

  let giliran = 0
  /** Isi halaman. Mengembalikan true bila berhasil. Panggilan yang sudah
   *  digantikan panggilan berikutnya tidak menyentuh memuat/galat (lihat kepala). */
  const muat = async (kerja: (terbaru: () => boolean) => Promise<void>): Promise<boolean> => {
    const ke = ++giliran
    const terbaru = () => ke === giliran
    memuat.value = true
    galat.value = null
    try {
      await kerja(terbaru)
      return true
    } catch (e) {
      // Galat permintaan basi tidak berhak bicara: yang terbaru menentukan.
      if (!terbaru()) return false
      const g = keGalat(e)
      galat.value = g
      keMasukBilaSesi(g)
      return false
    } finally {
      if (terbaru()) memuat.value = false
    }
  }

  /** Aksi tombol. Galat → toast; `sukses` (opsional) → toast berhasil. */
  const aksi = async (
    kerja: () => Promise<void>,
    pilihan: { sukses?: string; gagal?: (g: GalatAdmin) => void } = {},
  ): Promise<boolean> => {
    try {
      await kerja()
      if (pilihan.sukses) toast.success(pilihan.sukses)
      return true
    } catch (e) {
      const g = keGalat(e)
      if (!keMasukBilaSesi(g)) toast.error(pesanUntuk(g))
      pilihan.gagal?.(g)
      return false
    }
  }

  return { memuat, galat, pesanGalat, pesanUntuk, muat, aksi }
}
