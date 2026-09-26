/**
 * Aktivasi tab oleh PENGGUNA — pemicu satu-satunya penambahan ranah Fase 3
 * (katalog, jadwal, usaha, struk di Ruang 360; perangkat, kabar di Pengguna
 * 360). Spek console Fase 3 §6 (K-F3-1, keputusan Master 21 Sep 2026: satu
 * klik, tanpa dialog, audit tambah_ranah tetap tertulis server):
 *
 * - admin_kasus_tambah dipanggil HANYA dari aksi aktivasi tab oleh pengguna:
 *   klik, ketuk, atau keyboard (Enter pada tautan tab, angka pintasan) —
 *   peristiwa yang `isTrusted`;
 * - TIDAK PERNAH dari prefetch, hover, render SSR, watcher rute awal,
 *   pemulihan tab dari URL saat refresh, Back, atau lencana. Di keadaan itu
 *   panel menampilkan tombol "Muat data"; satu klik tombol = aktivasi.
 *
 * Cara kerjanya: tautan tab (CashflowTab) dan pintasan angka MENANDAI jalur
 * tujuan bersama peristiwanya (`catat`); tab tujuan yang baru terpasang
 * MENGAMBIL tanda itu sekali (`ambil`). Tanda hanya dibuat dari peristiwa
 * isTrusted, dipakai paling banyak sekali, dan kedaluwarsa sesudah
 * BATAS_AKTIVASI_MS — jadi Back/refresh ke tab yang sama tidak pernah
 * menemukan tanda yang masih berlaku.
 *
 * Satu aktivasi = paling banyak SATU penambahan ranah, untuk kasus yang
 * terpasang pertama kali sesudah aktivasi. Kasus yang berganti sesudahnya
 * (habis → dibuka lagi otomatis) tidak mewarisi aktivasi: panel kembali ke
 * "Muat data".
 *
 * `ref`/`watch` diimpor dari vue (bukan auto-import) supaya bisa diuji tanpa Nuxt.
 */
import { ref, watch, type Ref, type WatchStopHandle } from 'vue'
import type { Kasus } from '~/adapters/cashflowKasus'

export interface TandaAktivasi { jalur: string; pada: number }
/** Tanda yang lebih tua dari ini dianggap basi (bukan aktivasi). */
export const BATAS_AKTIVASI_MS = 30_000

/** Peristiwa aktivasi sah = dibuat pengguna (bukan dispatchEvent/click() skrip). */
export const aktivasiSah = (e: Event | null | undefined): boolean => !!e && e.isTrusted === true

/** Jalur tanpa query/hash dan tanpa garis miring penutup. */
export const jalurTab = (to: string): string => (to.split(/[?#]/)[0] ?? '').replace(/\/+$/, '') || '/'

/** Tandai aktivasi tab `to` oleh peristiwa `e`. false = peristiwa tidak sah (tidak ditandai). */
export function catatAktivasi(tanda: Ref<TandaAktivasi | null>, to: string, e: Event | null | undefined, sekarang: number = Date.now()): boolean {
  if (!aktivasiSah(e)) return false
  tanda.value = { jalur: jalurTab(to), pada: sekarang }
  return true
}

/** Ambil (dan hapus) tanda untuk jalur ini. true = tab ini diaktifkan pengguna barusan. */
export function ambilAktivasi(tanda: Ref<TandaAktivasi | null>, jalur: string, sekarang: number = Date.now()): boolean {
  const t = tanda.value
  if (!t || t.jalur !== jalurTab(jalur)) return false
  tanda.value = null
  return sekarang - t.pada >= 0 && sekarang - t.pada <= BATAS_AKTIVASI_MS
}

export interface KasusUntukAktivasi {
  kasus: Readonly<Ref<Kasus | null>>
  punyaRanah: (r: string) => boolean
  tambah: (ranah: readonly string[]) => Promise<void>
}

/**
 * Penambahan ranah untuk satu tab yang sudah terpasang. `diaktifkan` = hasil
 * ambilAktivasi saat tab dipasang. Menambah paling banyak sekali: untuk kasus
 * pertama (tanpa ranah itu, bukan kasus anak) yang terlihat sesudah aktivasi.
 * `muatData(e)` = tombol "Muat data" (aktivasi baru, harus isTrusted).
 */
export function useCashflowRanahAktivasi(
  kasus: KasusUntukAktivasi,
  ranah: string,
  diaktifkan: boolean,
  /** Pembungkus galat (useCashflowMuat().aksi). */
  jalankan: (kerja: () => Promise<void>) => unknown,
): { menambah: Ref<boolean>; ditambahUntuk: Ref<string | null>; muatData: (e: Event | null | undefined) => Promise<boolean>; henti: WatchStopHandle } {
  const menambah = ref(false)
  const ditambahUntuk = ref<string | null>(null)
  let aktivasi = diaktifkan

  const tambah = async (id: string): Promise<void> => {
    ditambahUntuk.value = id
    menambah.value = true
    try { await jalankan(() => kasus.tambah([ranah])) } finally { menambah.value = false }
  }

  const henti = watch(() => [kasus.kasus.value?.id ?? null, kasus.kasus.value ? kasus.punyaRanah(ranah) : true] as const, ([id, punya]) => {
    if (!aktivasi || !id) return
    // Aktivasi berlaku untuk kasus pertama yang terlihat — dipakai atau tidak.
    aktivasi = false
    if (punya || kasus.kasus.value?.anak) return
    void tambah(id)
  }, { immediate: true })

  const muatData = async (e: Event | null | undefined): Promise<boolean> => {
    const k = kasus.kasus.value
    if (!aktivasiSah(e) || !k || k.anak || menambah.value || kasus.punyaRanah(ranah)) return false
    await tambah(k.id)
    return true
  }

  return { menambah, ditambahUntuk, muatData, henti }
}

/** Tanda aktivasi bersama (useState: satu per aplikasi, kosong saat SSR). */
export const useCashflowAktivasiTab = () => {
  const tanda = useState<TandaAktivasi | null>('cf_aktivasi_tab', () => null)
  return {
    /** Dipanggil di @click tautan tab dan di pintasan angka. */
    catat: (to: string, e: Event | null | undefined) => catatAktivasi(tanda, to, e),
    /** Dipanggil SEKALI saat tab dipasang (client). */
    ambil: (jalur: string) => (import.meta.client ? ambilAktivasi(tanda, jalur) : false),
  }
}
