/**
 * Versi aplikasi CashFlow di console (migrasi 0110): kartu Versi aplikasi di Sakelar,
 * sebaran versi dan ajakan pembaruan di Kesehatan, langkah usaha di
 * Aktivitas.
 *
 * Fungsi MURNI semua. Aturan bentuk nilai `versi_android*` di sini SAMA
 * PERSIS dengan aplikasi (cashflow src/lib/pembaruan.ts, bacaVersiAndroid):
 * angka harus angka JSON bulat 1..KODE_MAKS, teks "26101412" dianggap tidak
 * ada, minimum hanya berlaku bila tidak lebih besar dari terbaru, catatan
 * 1..CATATAN_MAKS aksara sesudah di-trim. tests/cashflow/versi.test.ts
 * menjalankan vektor uji aplikasi (uji/pembaruan.mjs PB-1, PB-3) terhadap
 * berkas ini, dan memeriksa KODE_MAKS dan CATATAN_MAKS sama dengan
 * pembaruan.ts bila repo CashFlow ada.
 *
 * Penyunting menulis lewat admin_set_config yang sudah ada (beraudit,
 * beralasan); tidak ada RPC tulis baru. adapters/ TIDAK di-auto-import Nuxt,
 * selalu impor eksplisit.
 */
import type { NilaiJson } from './cashflow'

// ── Kunci dan batas (sama dengan src/lib/pembaruan.ts aplikasi) ─────────
export const KUNCI_VERSI = 'versi_android'
export const KUNCI_VERSI_UAT = 'versi_android_uat'
export const KUNCI_VERSI_IAS = 'versi_android_ias'
export const KUNCI_VERSI_SEMUA = [KUNCI_VERSI, KUNCI_VERSI_UAT, KUNCI_VERSI_IAS] as const
export type KunciVersi = typeof KUNCI_VERSI_SEMUA[number]
export const KODE_MAKS = 2_100_000_000
export const CATATAN_MAKS = 120

/**
 * Rilis Play terakhir yang tayang. Console tidak bisa bertanya ke Play, jadi
 * ini konstanta: NAIKKAN DI SETIAP RILIS Play (daftar periksa rilis). Kalau
 * lupa, kartu hanya menunjuk rilis lama dan peringatan lembut "di atas rilis"
 * muncul; tidak ada yang tertahan.
 */
export const RILIS_PLAY_TERAKHIR = { kode: 26102901, versi: '1.3.3' } as const

/** Rilis Play yang tayang (versionCode → nama), untuk memberi nama angka yang diketik. */
export const RILIS_PLAY: Readonly<Record<number, string>> = {
  26092703: '1.2.0',
  26100902: '1.3.0',
  26101003: '1.3.1',
  26101412: '1.3.2',
  [RILIS_PLAY_TERAKHIR.kode]: RILIS_PLAY_TERAKHIR.versi,
}

/** Catatan baris app_config (p_note) per kunci. Tanpa '@' (kunci publik). */
export const CATATAN_KUNCI_VERSI: Readonly<Record<KunciVersi, string>> = {
  versi_android: 'Versi Play terbaru dan minimum, dibaca CashFlow 1.3.2+',
  versi_android_uat: 'Versi UAT terbaru dan minimum, hanya build UAT',
  versi_android_ias: 'Versi uji Internal App Sharing, hanya build IAS',
}

/** Segmen kartu: label kamus, varian sebaran yang dipakai untuk jumlah, dan
 *  apakah build-nya menunggu Play (gerbang Play aplikasi). IAS tercatat
 *  sebagai prod di device_tokens, jadi jumlahnya tidak bisa diketahui.
 *  Hanya segmen Play yang memakai rilis Play terakhir sebagai acuan. */
export const PILIHAN_KUNCI_VERSI: ReadonlyArray<{
  kunci: KunciVersi; label: 'play' | 'uat' | 'ias'; varian: 'prod' | 'uat' | null; tertinggi: 'prod' | 'uat' | 'ias'; menungguPlay: boolean
}> = [
  { kunci: KUNCI_VERSI, label: 'play', varian: 'prod', tertinggi: 'prod', menungguPlay: true },
  { kunci: KUNCI_VERSI_UAT, label: 'uat', varian: 'uat', tertinggi: 'uat', menungguPlay: false },
  { kunci: KUNCI_VERSI_IAS, label: 'ias', varian: null, tertinggi: 'ias', menungguPlay: true },
]
export const pilihanKunci = (k: KunciVersi) => PILIHAN_KUNCI_VERSI.find(p => p.kunci === k)!
/** Rilis Play terakhir sebagai acuan (tombol "Pakai angka ini" dan peringatan
 *  "di atas rilis") hanya untuk kunci Play; null untuk UAT dan IAS. */
export const rilisAcuan = (k: KunciVersi): number | null =>
  (pilihanKunci(k).label === 'play' ? RILIS_PLAY_TERAKHIR.kode : null)

/** Rentang hari bagian Kesehatan dan Aktivitas (server menerima 1..90). */
export const RENTANG_HARI = [7, 30, 90] as const
export type RentangHari = typeof RENTANG_HARI[number]
export const HARI_BAWAAN: RentangHari = 30

// ── Bentuk nilai kunci (sama dengan aplikasi) ───────────────────────────
/** Sama dengan kodeSah aplikasi: hanya number bulat 1..KODE_MAKS. */
export function kodeSah(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isInteger(n)) return null
  return n >= 1 && n <= KODE_MAKS ? n : null
}
/** Sama dengan catatanSah aplikasi: teks, di-trim, 1..CATATAN_MAKS aksara. */
function catatanSah(x: unknown): string | null {
  if (typeof x !== 'string') return null
  const t = x.trim()
  const n = Array.from(t).length
  return n === 0 || n > CATATAN_MAKS ? null : t
}

export interface VersiTerbaca {
  terbaru: number | null
  minimum: number | null
  catatan: string | null
  catatanEn: string | null
}
export const VERSI_KOSONG: VersiTerbaca = Object.freeze({ terbaru: null, minimum: null, catatan: null, catatanEn: null })

/** Persis bacaVersiAndroid aplikasi: apa yang benar-benar dibaca HP. */
export function bacaVersiAndroid(nilai: unknown): VersiTerbaca {
  if (!nilai || typeof nilai !== 'object' || Array.isArray(nilai)) return VERSI_KOSONG
  const o = nilai as Record<string, unknown>
  const terbaru = kodeSah(o.terbaru)
  if (terbaru == null) return VERSI_KOSONG
  const minimum = kodeSah(o.minimum)
  return {
    terbaru,
    minimum: minimum != null && minimum <= terbaru ? minimum : null,
    catatan: catatanSah(o.catatan),
    catatanEn: catatanSah(o.catatan_en),
  }
}

/** Bagian nilai tersimpan yang diabaikan aplikasi (tidak hilang di server). */
export type BagianDiabaikan = 'minimum' | 'catatan' | 'catatan_en' | 'bidang'
const BIDANG_DIKENAL = ['terbaru', 'minimum', 'catatan', 'catatan_en']

/**
 * Nilai tersimpan dibaca untuk kartu:
 * - tiada   kunci belum ada: aplikasi tidak menampilkan ajakan apa pun;
 * - asing   aplikasi membacanya sebagai kosong (bukan objek, terbaru teks,
 *           pecahan, nol, di luar batas): sekarang tidak berpengaruh apa pun;
 * - sah     terbaru berlaku. `diabaikan` = bagian yang tidak dibaca HP
 *           (minimum di atas terbaru atau bentuk salah, catatan salah, bidang
 *           asing). Menyimpan dari kartu menggantinya, jadi kartu meminta
 *           persetujuan untuk asing maupun sah yang punya `diabaikan`.
 */
export type NilaiVersi =
  | { jenis: 'tiada' }
  | { jenis: 'asing' }
  | { jenis: 'sah'; versi: VersiTerbaca; diabaikan: BagianDiabaikan[] }

export function bacaNilaiVersi(ada: boolean, nilai: NilaiJson | undefined): NilaiVersi {
  if (!ada) return { jenis: 'tiada' }
  const v = bacaVersiAndroid(nilai)
  if (v.terbaru == null) return { jenis: 'asing' }
  const o = nilai as Record<string, unknown>
  const diabaikan: BagianDiabaikan[] = []
  if (o.minimum !== undefined && v.minimum == null) diabaikan.push('minimum')
  if (o.catatan !== undefined && v.catatan == null) diabaikan.push('catatan')
  if (o.catatan_en !== undefined && v.catatanEn == null) diabaikan.push('catatan_en')
  if (Object.keys(o).some(k => !BIDANG_DIKENAL.includes(k))) diabaikan.push('bidang')
  return { jenis: 'sah', versi: v, diabaikan }
}

// ── Isian kartu ─────────────────────────────────────────────────────────
export interface IsianVersi { terbaru: string; minimum: string; catatan: string; catatanEn: string }
export const ISIAN_KOSONG: IsianVersi = Object.freeze({ terbaru: '', minimum: '', catatan: '', catatanEn: '' })

/** Isian awal dari nilai tersimpan. Bentuk asing diisi sebisanya (angka
 *  berbentuk teks ikut tampil supaya admin tidak mengetik ulang). */
export function isianDariNilai(nilai: NilaiJson | undefined): IsianVersi {
  if (!nilai || typeof nilai !== 'object' || Array.isArray(nilai)) return { ...ISIAN_KOSONG }
  const o = nilai as Record<string, unknown>
  const angka = (x: unknown) => (typeof x === 'number' && Number.isInteger(x) && x > 0 ? String(x)
    : typeof x === 'string' && /^\d{1,10}$/.test(x.trim()) ? x.trim() : '')
  const teks = (x: unknown) => (typeof x === 'string' ? x.trim() : '')
  return { terbaru: angka(o.terbaru), minimum: angka(o.minimum), catatan: teks(o.catatan), catatanEn: teks(o.catatan_en) }
}

export type GalatKode = 'angka' | 'minimum'
export type GalatCatatan = 'catatanPanjang' | 'catatanEmail'
export interface PeriksaVersi {
  galat: { terbaru?: GalatKode; minimum?: GalatKode; catatan?: GalatCatatan; catatanEn?: GalatCatatan }
  /** null bila ada galat atau terbaru kosong. */
  nilai: { terbaru: number; minimum: number | null; catatan: string | null; catatanEn: string | null } | null
}

/** Hanya digit, tanpa titik, koma, atau spasi; 1..KODE_MAKS. Kosong = null tanpa galat. */
function kodeIsian(s: string): { kode: number | null; galat: boolean } {
  if (s === '') return { kode: null, galat: false }
  if (!/^\d{1,10}$/.test(s)) return { kode: null, galat: true }
  const n = Number(s)
  return n >= 1 && n <= KODE_MAKS ? { kode: n, galat: false } : { kode: null, galat: true }
}
function catatanIsian(s: string): { teks: string | null; galat?: GalatCatatan } {
  const t = s.trim()
  if (!t) return { teks: null }
  if (t.includes('@')) return { teks: null, galat: 'catatanEmail' }
  if (Array.from(t).length > CATATAN_MAKS) return { teks: null, galat: 'catatanPanjang' }
  return { teks: t }
}

/** Pemeriksaan bentuk isian sebelum Simpan (KK-2, KK-3). */
export function periksaIsianVersi(i: IsianVersi): PeriksaVersi {
  const galat: PeriksaVersi['galat'] = {}
  const t = kodeIsian(i.terbaru)
  const m = kodeIsian(i.minimum)
  if (t.galat) galat.terbaru = 'angka'
  if (m.galat) galat.minimum = 'angka'
  else if (m.kode != null && t.kode != null && m.kode > t.kode) galat.minimum = 'minimum'
  const c = catatanIsian(i.catatan)
  const ce = catatanIsian(i.catatanEn)
  if (c.galat) galat.catatan = c.galat
  if (ce.galat) galat.catatanEn = ce.galat
  const ada = Object.keys(galat).length > 0
  return { galat, nilai: ada || t.kode == null ? null : { terbaru: t.kode, minimum: m.kode, catatan: c.teks, catatanEn: ce.teks } }
}

/** Nilai yang dikirim ke admin_set_config: angka JSON, bidang kosong tidak dikirim (KK-4). */
export function nilaiVersiUntukSimpan(v: NonNullable<PeriksaVersi['nilai']>): { [k: string]: NilaiJson } {
  const o: { [k: string]: NilaiJson } = { terbaru: v.terbaru }
  if (v.minimum != null) o.minimum = v.minimum
  if (v.catatan) o.catatan = v.catatan
  if (v.catatanEn) o.catatan_en = v.catatanEn
  return o
}

/** Sama dengan yang tersimpan (urutan kunci diabaikan)? */
export function samaDenganTersimpan(baru: { [k: string]: NilaiJson }, tersimpan: NilaiJson | undefined): boolean {
  if (!tersimpan || typeof tersimpan !== 'object' || Array.isArray(tersimpan)) return false
  const a = Object.keys(baru).sort()
  const b = Object.keys(tersimpan).sort()
  return a.length === b.length && a.every((k, i) => k === b[i] && baru[k] === (tersimpan as Record<string, NilaiJson>)[k])
}

export type PeringatanLembut =
  | { jenis: 'turun'; lama: number }
  | { jenis: 'diAtasRilis' }
  | { jenis: 'belumTerlihat' }

/**
 * Peringatan yang TIDAK menahan Simpan (KK-7):
 * - terbaru lebih kecil dari yang tersimpan (HP yang menutup ajakan melihatnya lagi);
 * - terbaru lebih besar dari rilis Play terakhir, hanya bila `rilis` diberikan
 *   (kunci Play; build UAT dan IAS biasanya memang di atas rilis Play);
 * - minimum di atas versi tertinggi yang terlihat di HP pengguna build itu.
 */
export function peringatanLembut(
  v: NonNullable<PeriksaVersi['nilai']>, tersimpan: VersiTerbaca, tertinggiHp: number | null,
  rilis: number | null,
): PeringatanLembut[] {
  const hasil: PeringatanLembut[] = []
  if (tersimpan.terbaru != null && v.terbaru < tersimpan.terbaru) hasil.push({ jenis: 'turun', lama: tersimpan.terbaru })
  if (rilis != null && v.terbaru > rilis) hasil.push({ jenis: 'diAtasRilis' })
  if (v.minimum != null && tertinggiHp != null && v.minimum > tertinggiHp) hasil.push({ jenis: 'belumTerlihat' })
  return hasil
}

/** Minimum baru atau berubah (bukan yang sudah berlaku) butuh panel peringatan (KK-5). */
export const minimumBerubah = (baru: number | null, tersimpan: VersiTerbaca): boolean =>
  baru != null && baru !== tersimpan.minimum

// ── admin_versi_aplikasi (0110) ─────────────────────────────────────────
type Num = number | string
const n0 = (v: Num | null | undefined): number => {
  const x = v == null || v === '' ? Number.NaN : Number(v)
  return Number.isFinite(x) ? x : 0
}
const kodeAtauNull = (v: Num | null | undefined): number | null => {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isInteger(x) && x > 0 ? x : null
}

export interface VersiBarisDTO {
  platform: string; varian: string; kode: number | null; versi: string | null
  pengguna: Num; pengguna_luar: Num; terakhir: string
}
export interface VersiTertinggiDTO { platform: string; varian: string; kode: number; versi: string | null }
export interface VersiAplikasiDTO {
  hari: Num; aktif: Num; aktif_luar: Num; diketahui: Num; diketahui_luar: Num
  baris: VersiBarisDTO[]; tertinggi: VersiTertinggiDTO[]
  konfig: { versi_android: NilaiJson | null; versi_android_uat: NilaiJson | null; versi_android_ias: NilaiJson | null }
}

/** Build untuk kamus kesehatan.versi.build.*: Play, UAT, Uji IAS, iOS, Web, lain. */
export type BuildVersi = 'prod' | 'uat' | 'ias' | 'ios' | 'web' | 'lain'
export function buildDari(platform: string, varian: string): BuildVersi {
  if (platform === 'android') return varian === 'prod' || varian === 'uat' || varian === 'ias' ? varian : 'lain'
  if (platform === 'ios') return 'ios'
  if (platform === 'web') return 'web'
  return 'lain'
}
const URUT_BUILD: readonly BuildVersi[] = ['prod', 'uat', 'ias', 'ios', 'web', 'lain']

export interface BarisSebaran {
  kunci: string; build: BuildVersi; platform: string; varian: string
  kode: number; versi: string | null; pengguna: number; penggunaLuar: number; terakhirIso: string
}
export interface SebaranVersi {
  hari: number; aktif: number; aktifLuar: number; diketahui: number; diketahuiLuar: number
  /** Persen versi diketahui dari aktif, bulat; null bila tidak ada yang aktif. */
  persen: number | null
  /** Baris berkode, urut build lalu kode terbesar. */
  baris: BarisSebaran[]
  /** Aktif tanpa versi yang diketahui (termasuk token tanpa kode). */
  takTahu: { pengguna: number; penggunaLuar: number }
  tertinggi: Array<{ platform: string; varian: string; kode: number; versi: string | null }>
  /** versi_android yang dibaca HP Play; null bila tiada atau bentuknya asing. */
  terbaruPlay: number | null
  /** Pengguna android/prod di bawah terbaruPlay; null bila terbaruPlay null. */
  diBawahTerbaru: number | null
}

export function keSebaranVersi(d: VersiAplikasiDTO): SebaranVersi {
  const baris = (d.baris ?? [])
    .map((b): BarisSebaran | null => {
      const kode = kodeAtauNull(b.kode)
      if (kode == null) return null
      return {
        kunci: `${b.platform}/${b.varian}/${kode}`, build: buildDari(b.platform, b.varian), platform: b.platform, varian: b.varian,
        kode, versi: b.versi || RILIS_PLAY[kode] || null, pengguna: n0(b.pengguna), penggunaLuar: n0(b.pengguna_luar), terakhirIso: b.terakhir,
      }
    })
    .filter((b): b is BarisSebaran => b != null)
    .sort((a, b) => URUT_BUILD.indexOf(a.build) - URUT_BUILD.indexOf(b.build) || b.kode - a.kode)
  const aktif = n0(d.aktif)
  const diketahui = n0(d.diketahui)
  const terbaruPlay = bacaVersiAndroid(d.konfig?.versi_android).terbaru
  return {
    hari: n0(d.hari), aktif, aktifLuar: n0(d.aktif_luar), diketahui, diketahuiLuar: n0(d.diketahui_luar),
    persen: aktif > 0 ? Math.round((diketahui / aktif) * 100) : null,
    baris,
    takTahu: { pengguna: Math.max(0, aktif - diketahui), penggunaLuar: Math.max(0, n0(d.aktif_luar) - n0(d.diketahui_luar)) },
    tertinggi: (d.tertinggi ?? []).flatMap(t => {
      const kode = kodeAtauNull(t.kode)
      return kode == null ? [] : [{ platform: t.platform, varian: t.varian, kode, versi: t.versi || RILIS_PLAY[kode] || null }]
    }),
    terbaruPlay,
    diBawahTerbaru: terbaruPlay == null ? null : jumlahDiBawah(baris, 'prod', terbaruPlay),
  }
}

/** Pengguna aktif android `varian` yang versinya diketahui dan di bawah `kode` (batas bawah). */
export function jumlahDiBawah(baris: readonly BarisSebaran[], varian: 'prod' | 'uat', kode: number): number {
  return baris.filter(b => b.platform === 'android' && b.varian === varian && b.kode < kode).reduce((s, b) => s + b.pengguna, 0)
}

/** Kode tertinggi di HP pengguna android untuk varian itu, atau null. */
export function tertinggiUntuk(s: SebaranVersi | null, varian: 'prod' | 'uat' | 'ias'): { kode: number; versi: string | null } | null {
  const t = s?.tertinggi.find(x => x.platform === 'android' && x.varian === varian)
  return t ? { kode: t.kode, versi: t.versi } : null
}

/** Nama versi untuk sebuah kode: rilis Play yang dikenal, lalu yang terlihat di HP pengguna. */
export function namaKode(kode: number | null, s: SebaranVersi | null = null): string | null {
  if (kode == null) return null
  return RILIS_PLAY[kode] ?? s?.baris.find(b => b.kode === kode && b.versi)?.versi ?? s?.tertinggi.find(t => t.kode === kode && t.versi)?.versi ?? null
}

// ── admin_ajakan_pembaruan (0110) ───────────────────────────────────────
export const LANGKAH_PEMBARUAN = [
  'pembaruan.ajakan_lihat', 'pembaruan.ajakan_ketuk', 'pembaruan.ajakan_tutup',
  'pembaruan.wajib_lihat', 'pembaruan.wajib_ketuk',
] as const
export type LangkahPembaruan = typeof LANGKAH_PEMBARUAN[number]
/** Jalur Perbarui (JalurToko aplikasi), urut kalimat kesehatan.ajakan.jalur. */
export const JALUR_PERBARUI = ['dalam', 'pasar', 'web', 'gagal'] as const
export type JalurPerbarui = typeof JALUR_PERBARUI[number]

export interface AjakanBarisDTO {
  langkah: string; ke: Num; jalur: string | null; tertahan: boolean | null; kejadian: Num; orang: Num; orang_luar: Num
}
export interface AjakanRingkasDTO { langkah: string; ke: Num; kejadian: Num; orang: Num; orang_luar: Num }
export interface AjakanPembaruanDTO {
  hari: Num; baris: AjakanBarisDTO[]; ringkas: AjakanRingkasDTO[]
  sampai: Array<{ ke: Num; orang: Num; orang_luar: Num }>
}
export interface SelAjakan { orang: number; kejadian: number }
export interface BarisAjakan {
  ke: number; nama: string | null
  sel: Record<LangkahPembaruan, SelAjakan>
  sampai: number
}
export interface AjakanPembaruan {
  hari: number
  /** Per versi tujuan, terbesar dulu. */
  baris: BarisAjakan[]
  /** Kejadian ketuk Perbarui (ajakan dan layar wajib) per jalur. */
  jalur: Record<JalurPerbarui, number>
}

export function keAjakanPembaruan(d: AjakanPembaruanDTO): AjakanPembaruan {
  const kosong = (): Record<LangkahPembaruan, SelAjakan> =>
    Object.fromEntries(LANGKAH_PEMBARUAN.map(l => [l, { orang: 0, kejadian: 0 }])) as Record<LangkahPembaruan, SelAjakan>
  const per = new Map<number, BarisAjakan>()
  const ambil = (ke: number) => {
    let b = per.get(ke)
    if (!b) { b = { ke, nama: RILIS_PLAY[ke] ?? null, sel: kosong(), sampai: 0 }; per.set(ke, b) }
    return b
  }
  for (const r of d.ringkas ?? []) {
    const ke = kodeAtauNull(r.ke)
    if (ke == null || !(LANGKAH_PEMBARUAN as readonly string[]).includes(r.langkah)) continue
    ambil(ke).sel[r.langkah as LangkahPembaruan] = { orang: n0(r.orang), kejadian: n0(r.kejadian) }
  }
  for (const s of d.sampai ?? []) {
    const ke = kodeAtauNull(s.ke)
    if (ke != null) ambil(ke).sampai = n0(s.orang)
  }
  const jalur = Object.fromEntries(JALUR_PERBARUI.map(j => [j, 0])) as Record<JalurPerbarui, number>
  for (const b of d.baris ?? []) {
    if ((b.langkah === 'pembaruan.ajakan_ketuk' || b.langkah === 'pembaruan.wajib_ketuk')
        && (JALUR_PERBARUI as readonly string[]).includes(b.jalur ?? '')) {
      jalur[b.jalur as JalurPerbarui] += n0(b.kejadian)
    }
  }
  return { hari: n0(d.hari), baris: [...per.values()].sort((a, b) => b.ke - a.ke), jalur }
}

// ── admin_langkah_usaha (0110) ──────────────────────────────────────────
/** Kelompok tampilan dan langkah yang dikenal per kelompok, urut tampil. */
export const KELOMPOK_USAHA = {
  ruang: ['ruang.panel_baru', 'ruang.pilih_usaha', 'ruang.buat_usaha', 'ruang.kelola', 'ruang.jadikan_usaha'],
  kartu: ['ajakan_usaha.lihat', 'ajakan_usaha.ketuk', 'ajakan_usaha.tutup'],
  tonggak: ['usaha.produk_pertama', 'usaha.jual_pertama'],
  meja: ['usaha.beranda_lihat', 'usaha.langkah_ketuk', 'usaha.pintasan', 'usaha.langkah_tutup', 'usaha.pulang'],
} as const
export type KelompokUsaha = keyof typeof KELOMPOK_USAHA
export const URUT_KELOMPOK: readonly KelompokUsaha[] = ['ruang', 'kartu', 'tonggak', 'meja']
export const LANGKAH_USAHA: readonly string[] = URUT_KELOMPOK.flatMap(k => KELOMPOK_USAHA[k])

/** Jenis isi per langkah (kunci rincian yang membawanya di aplikasi). */
export type JenisIsi = 'asal' | 'keadaan' | 'tahap' | 'ke' | 'nomor'
export const JENIS_ISI: Readonly<Record<string, JenisIsi>> = {
  'ruang.panel_baru': 'asal', 'ruang.buat_usaha': 'asal',
  'usaha.produk_pertama': 'asal', 'usaha.jual_pertama': 'asal',
  'usaha.beranda_lihat': 'keadaan', 'usaha.langkah_ketuk': 'tahap',
  'usaha.pintasan': 'ke', 'usaha.langkah_tutup': 'nomor',
}
/** Nilai isi yang dikenal kamus per jenis (telemetri.ts: AsalPanelRuang,
 *  AsalTonggakUsaha, KeadaanMeja, TahapMeja, PintasanMeja; nomor 3). 'lain'
 *  di asal tonggak = asal lain di aplikasi; 'lain' dari server = isi asing. */
export const ISI_USAHA: Readonly<Record<JenisIsi, readonly string[]>> = {
  asal: ['baris_baru', 'baris_usaha', 'ajakan_beranda', 'lain'],
  keadaan: ['langkah', 'harian'],
  tahap: ['barang', 'jual', 'kasbon', 'qris'],
  ke: ['jual', 'beli', 'barang', 'stok', 'kasbon', 'laporan', 'usaha'],
  nomor: ['3'],
}

export interface BarisLangkah {
  langkah: string; isi: string
  /** null bila langkah atau isinya belum dikenal kamus (tampil apa adanya + pil "kode baru"). */
  kunciLangkah: string | null
  jenisIsi: JenisIsi | null
  kenalIsi: boolean
  orang: number; kejadian: number; orangLuar: number
}
export interface LangkahUsaha {
  hari: number
  kelompok: Array<{ kelompok: KelompokUsaha; baris: BarisLangkah[] }>
  mingguan: Array<{ minggu: string; jumlah: number; jumlahLuar: number }>
  kosong: boolean
}

const kelompokDari = (langkah: string): KelompokUsaha =>
  langkah.startsWith('ruang.') ? 'ruang' : langkah.startsWith('ajakan_usaha.') ? 'kartu'
    : (KELOMPOK_USAHA.tonggak as readonly string[]).includes(langkah) ? 'tonggak' : 'meja'

export function keLangkahUsaha(d: LangkahUsahaDTO): LangkahUsaha {
  const per = new Map<KelompokUsaha, BarisLangkah[]>(URUT_KELOMPOK.map(k => [k, []]))
  for (const r of d.baris ?? []) {
    const kenal = LANGKAH_USAHA.includes(r.langkah)
    const jenis = kenal ? (JENIS_ISI[r.langkah] ?? null) : null
    const isi = r.isi ?? ''
    per.get(kelompokDari(r.langkah))!.push({
      langkah: r.langkah, isi,
      kunciLangkah: kenal ? r.langkah.replace(/\./g, '_') : null,
      jenisIsi: jenis,
      kenalIsi: isi === '' || (jenis != null && ISI_USAHA[jenis].includes(isi)),
      orang: n0(r.orang), kejadian: n0(r.kejadian), orangLuar: n0(r.orang_luar),
    })
  }
  const urut = (k: KelompokUsaha) => (b: BarisLangkah) => {
    const i = (KELOMPOK_USAHA[k] as readonly string[]).indexOf(b.langkah)
    return i < 0 ? 99 : i
  }
  const kelompok = URUT_KELOMPOK.map(k => ({
    kelompok: k,
    baris: per.get(k)!.sort((a, b) => urut(k)(a) - urut(k)(b) || a.langkah.localeCompare(b.langkah) || a.isi.localeCompare(b.isi)),
  })).filter(g => g.baris.length > 0)
  const mingguan = (d.ruang_usaha_baru ?? [])
    .map(m => ({ minggu: m.minggu, jumlah: n0(m.jumlah), jumlahLuar: n0(m.jumlah_luar) }))
    .sort((a, b) => a.minggu.localeCompare(b.minggu))
  return { hari: n0(d.hari), kelompok, mingguan, kosong: kelompok.length === 0 && mingguan.length === 0 }
}
export interface LangkahUsahaDTO {
  hari: Num
  baris: Array<{ langkah: string; isi: string; kejadian: Num; orang: Num; orang_luar: Num }>
  ruang_usaha_baru: Array<{ minggu: string; jumlah: Num; jumlah_luar: Num }>
}
