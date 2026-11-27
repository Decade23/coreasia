/**
 * Laporan catat lewat WhatsApp di console CashFlow (halaman CashFlow >
 * WhatsApp): siapa yang mencatat lewat WA, berapa pesan dan catatan, corong
 * dari pengumuman sampai kembali di hari lain, tren harian, golongan pesan,
 * kata yang belum dapat kategori, kesehatan pemrosesan, dan tabel per orang.
 *
 * KONTRAK RPC (dibandingkan dengan migrasi oleh tests/cashflow/wa-laporan.test.ts):
 *   admin_wa_catat_laporan(p_hari 1..90, p_kecuali_internal bawaan true,
 *   p_alasan bawaan null) -> {hari, kecuali_internal, terbuka, sekarang,
 *   cakupan{sejak, jejak_sejak, jejak_jam, jejak_utuh, telemetri_hari},
 *   ringkas{...}, corong{...}, harian[], golongan[], kata_tanpa_kategori[],
 *   kesehatan{...}, per_pengguna[] | null, per_pengguna_total | null}.
 *   Agregat cukup izin view. per_pengguna dan kata_tanpa_kategori hanya untuk
 *   sesi ber-pii (null selain itu), email tersamar tanpa alasan, utuh dengan alasan, dan setiap
 *   panggilan ber-pii tercatat di audit server.
 *
 * DUA UMUR DATA. Hitungan pesan berasal dari telemetri server (tersimpan 120
 * hari). Rincian catatan, kata tanpa kategori, dan waktu proses berasal dari
 * jejak pesan yang dihapus sesudah 48 jam. `cakupan.jejakUtuh` false berarti
 * bagian itu hanya mencakup 48 jam terakhir, dan halaman mengatakannya.
 *
 * Kunci yang tidak dikirim server dibaca kosong (nol, null, atau larik
 * kosong), bukan galat. Kode jenis dan hasil yang belum dikenal tetap tampil
 * bila berbentuk kode (huruf kecil, angka, garis bawah), selain itu 'lain'.
 * Kata tanpa kategori hanya huruf latin kecil 3..40 (server juga hanya
 * mengirim kata dari 3 orang atau lebih). Catatan tidak menghitung pesan
 * yang sudah dibatalkan.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state. adapters/ tidak
 * di-auto-import Nuxt, selalu impor eksplisit.
 */

/** bigint dan numeric bisa pulang sebagai string. */
type Angka = number | string | null

// ── Kode yang dikenal ────────────────────────────────────────────────────
/** Nilai p_hari yang ditawarkan halaman. 1 hari = 24 jam terakhir. */
export const PERIODE_WA = ['1', '7', '30'] as const
export type PeriodeWa = typeof PERIODE_WA[number]
/** Akun tim (akun_internal dan admin): tanpa (bawaan) atau ikut dihitung. */
export const TIM_WA = ['tanpa', 'ikut'] as const
export type TimWa = typeof TIM_WA[number]
/** Alasan tetap yang dikirim saat kontak lengkap dibuka. rpc() menambahkan pelakunya. */
export const ALASAN_LAPORAN_WA = 'Kontak lengkap di laporan WhatsApp Console'
/** Batas baris per pengguna dari server. */
export const MAKS_PENGGUNA_WA = 200
/** Batas kata tanpa kategori dari server. */
export const MAKS_KATA_WA = 20
/** Jenis pesan (wa_catat_pesan.jenis, katalog wa_catat.pesan). */
export const JENIS_PESAN_WA = ['catat', 'batal', 'sisa', 'bantuan', 'stop', 'admin', 'domi', 'foto', 'lain', 'batas'] as const
export type JenisPesanWa = typeof JENIS_PESAN_WA[number]
/** Hasil pesan (katalog perjalanan wa_catat.pesan, 20261124230000). */
export const HASIL_PESAN_WA = [
  'dicatat', 'kuota', 'dompet', 'dompet_bawaan', 'ruang', 'dibatalkan', 'tidak_ada', 'aturan', 'dijawab', 'dimatikan',
  'inbox', 'basa_basi', 'diam', 'gagal', 'domi_mati', 'kredit_habis', 'sibuk', 'foto_mati', 'foto_besar',
  'foto_tak_terbaca', 'kebanyakan', 'proses', 'domi_batas',
] as const
export type HasilPesanWa = typeof HASIL_PESAN_WA[number]
/** Status sakelar catat WA per orang. */
export const STATUS_CATAT_WA = ['menyala', 'mati', 'tanpa_setelan'] as const
export type StatusCatatWa = typeof STATUS_CATAT_WA[number] | 'lain'
/** Langkah corong orang yang terukur, urut tampil. Tampil pengumuman tidak terukur. */
export const LANGKAH_CORONG_WA = ['ketuk', 'pesan_pertama', 'catatan_pertama', 'kembali'] as const
export type LangkahCorongWa = typeof LANGKAH_CORONG_WA[number]

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
export interface RingkasWaDTO {
  menyala: Angka; pengirim: Angka; pesan: Angka; pesan_dicatat: Angka; catatan: Angka; catatan_ada: Angka
  tanpa_kategori: Angka; persen_tanpa_kategori: Angka; batal: Angka; domi: Angka; domi_jawaban: Angka; domi_biaya: Angka
  kuota: Angka; stop: Angka; gagal: Angka
  proses_median_dtk: Angka; proses_p90_dtk: Angka; simpan_median_dtk: Angka; simpan_p90_dtk: Angka
}
export interface CorongWaDTO {
  pengumuman: Angka; tampil: Angka; tampil_terukur: boolean | null; ketuk: Angka; tutup: Angka
  pesan_pertama: Angka; catatan_pertama: Angka; kembali: Angka
}
export interface HariWaDTO { tanggal: string; pesan: Angka; pengirim: Angka; dicatat: Angka; catatan: Angka }
export interface GolonganWaDTO { jenis: string; hasil: string; jumlah: Angka; orang: Angka }
export interface KataWaDTO { kata: string; jumlah: Angka; orang: Angka }
export interface KesehatanWaDTO {
  pesan: Angka; selesai: Angka; gagal: Angka; proses: Angka; macet: Angka; balas: Angka; diam: Angka; inbox: Angka
  terakhir_masuk: string | null; terakhir_simpan: string | null
}
export interface PenggunaWaDTO {
  user_id: string; nama: string | null; email: string | null; internal: boolean | null
  pesan: Angka; dicatat: Angka; catatan: Angka; terakhir: string | null; status: string | null
  kuota: { pro: boolean | null; sakelar: boolean | null; sisa: Angka; batas: Angka } | null
  versi: { versi: string | null; kode: string | null; platform: string | null } | null
}
export interface LaporanWaDTO {
  hari: Angka; kecuali_internal: boolean | null; terbuka: boolean | null; sekarang: string | null
  cakupan: { sejak: string | null; jejak_sejak: string | null; jejak_jam: Angka; jejak_utuh: boolean | null; telemetri_hari: Angka }
  ringkas: RingkasWaDTO
  corong: CorongWaDTO
  harian: HariWaDTO[]
  golongan: GolonganWaDTO[]
  /** null = sesi tanpa izin data pribadi (kata berasal dari teks catatan). */
  kata_tanpa_kategori: KataWaDTO[] | null
  kesehatan: KesehatanWaDTO
  per_pengguna: PenggunaWaDTO[] | null
  per_pengguna_total: Angka
}

// ── Domain ───────────────────────────────────────────────────────────────
export interface RingkasWa {
  menyala: number; pengirim: number; pesan: number; pesanDicatat: number; catatan: number; catatanAda: number
  tanpaKategori: number; persenTanpaKategori: number | null; batal: number; domi: number; domiJawaban: number
  /** Rupiah, boleh pecahan. */
  domiBiaya: number
  kuota: number; stop: number; gagal: number
  /** Detik, null bila belum ada pesan yang selesai. */
  prosesMedian: number | null; prosesP90: number | null; simpanMedian: number | null; simpanP90: number | null
}
export interface CakupanWa {
  sejak: string | null; jejakSejak: string | null; jejakJam: number
  /** false: rincian catatan, kata, dan waktu proses hanya 48 jam terakhir. */
  jejakUtuh: boolean
  telemetriHari: number
}
export interface CorongWa {
  pengumuman: number; tampil: number | null; tampilTerukur: boolean
  ketuk: number; tutup: number; pesanPertama: number; catatanPertama: number; kembali: number
}
export interface HariWa { tanggal: string; pesan: number; pengirim: number; dicatat: number; catatan: number | null }
export interface GolonganWa {
  jenis: string; hasil: string; jumlah: number; orang: number
  /** Kode yang dikenal halaman (berlabel), null = tampil apa adanya. */
  jenisDikenal: JenisPesanWa | null; hasilDikenal: HasilPesanWa | null
}
export interface KataWa { kata: string; jumlah: number; orang: number }
export interface KesehatanWa {
  pesan: number; selesai: number; gagal: number; proses: number; macet: number; balas: number; diam: number; inbox: number
  terakhirMasuk: string | null; terakhirSimpan: string | null
}
export interface KuotaWa { pro: boolean; sakelar: boolean; sisa: number | null; batas: number | null }
export interface VersiWa { versi: string | null; kode: string | null; platform: string | null }
export interface PenggunaWa {
  id: string; nama: string | null; email: string | null; internal: boolean
  pesan: number; dicatat: number; catatan: number; terakhir: string | null
  status: StatusCatatWa; kuota: KuotaWa | null; versi: VersiWa | null
}
export interface LaporanWa {
  hari: number; kecualiInternal: boolean; terbuka: boolean; sekarang: string | null
  cakupan: CakupanWa
  ringkas: RingkasWa
  corong: CorongWa
  harian: HariWa[]
  golongan: GolonganWa[]
  kata: KataWa[]
  /** Server tidak mengirim kata karena sesi tanpa izin data pribadi. */
  kataTerkunci: boolean
  kesehatan: KesehatanWa
  /** null = sesi tanpa izin data pribadi (server tidak mengirim daftar). */
  pengguna: PenggunaWa[] | null
  penggunaTotal: number | null
  /** Tidak ada satu pesan, catatan, atau ketukan pun di periode ini. */
  kosong: boolean
}

// ── Pembantu baca ────────────────────────────────────────────────────────
type Obj = Record<string, unknown>
const objek = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? v as Obj : {})
const larik = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const mentah = (v: unknown): number | null => {
  const x = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : Number.NaN
  return Number.isFinite(x) ? x : null
}
/** Hitungan: angka rusak, negatif, atau tidak ada dibaca nol. */
const n = (v: unknown): number => { const x = mentah(v); return x !== null && x > 0 ? Math.round(x) : 0 }
/** Angka boleh pecahan dan boleh tidak ada (null). Negatif dibaca null. */
const nNull = (v: unknown): number | null => { const x = mentah(v); return x !== null && x >= 0 ? x : null }
const teks = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null)
const ymd = (v: unknown): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)
const dikenal = <T extends string>(daftar: readonly T[], v: string): T | null => (daftar as readonly string[]).includes(v) ? v as T : null
/** Kode jenis dan hasil yang sah dari server. Di luar bentuk ini dibaca 'lain' (server juga begitu). */
const POLA_KODE = /^[a-z0-9_]{1,32}$/
const kode = (v: unknown): string => { const t = teks(v); return t && POLA_KODE.test(t) ? t : 'lain' }
/** Kata yang boleh tampil: huruf latin kecil 3 sampai 40, sama dengan server. */
export const POLA_KATA_WA = /^[a-z]{3,40}$/

export function keLaporanWa(d: LaporanWaDTO | null | undefined): LaporanWa {
  const o = objek(d)
  const c = objek(o.cakupan)
  const r = objek(o.ringkas)
  const k = objek(o.corong)
  const s = objek(o.kesehatan)
  const ringkas: RingkasWa = {
    menyala: n(r.menyala), pengirim: n(r.pengirim), pesan: n(r.pesan), pesanDicatat: n(r.pesan_dicatat),
    catatan: n(r.catatan), catatanAda: n(r.catatan_ada), tanpaKategori: n(r.tanpa_kategori),
    persenTanpaKategori: nNull(r.persen_tanpa_kategori), batal: n(r.batal), domi: n(r.domi), domiJawaban: n(r.domi_jawaban),
    domiBiaya: nNull(r.domi_biaya) ?? 0, kuota: n(r.kuota), stop: n(r.stop), gagal: n(r.gagal),
    prosesMedian: nNull(r.proses_median_dtk), prosesP90: nNull(r.proses_p90_dtk),
    simpanMedian: nNull(r.simpan_median_dtk), simpanP90: nNull(r.simpan_p90_dtk),
  }
  const corong: CorongWa = {
    pengumuman: n(k.pengumuman), tampil: k.tampil_terukur === true ? nNull(k.tampil) : null, tampilTerukur: k.tampil_terukur === true,
    ketuk: n(k.ketuk), tutup: n(k.tutup), pesanPertama: n(k.pesan_pertama), catatanPertama: n(k.catatan_pertama), kembali: n(k.kembali),
  }
  const harian: HariWa[] = larik(o.harian)
    .map(objek)
    .map(h => ({ tanggal: ymd(h.tanggal) ?? '', pesan: n(h.pesan), pengirim: n(h.pengirim), dicatat: n(h.dicatat), catatan: h.catatan == null ? null : nNull(h.catatan) }))
    .filter(h => h.tanggal)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  const golongan: GolonganWa[] = larik(o.golongan).map(objek).map((g) => {
    const jenis = kode(g.jenis)
    const hasil = kode(g.hasil)
    return { jenis, hasil, jumlah: n(g.jumlah), orang: n(g.orang), jenisDikenal: dikenal(JENIS_PESAN_WA, jenis), hasilDikenal: dikenal(HASIL_PESAN_WA, hasil) }
  }).sort((a, b) => b.jumlah - a.jumlah || a.jenis.localeCompare(b.jenis) || a.hasil.localeCompare(b.hasil))
  const kata: KataWa[] = larik(o.kata_tanpa_kategori).map(objek)
    .map(x => ({ kata: teks(x.kata) ?? '', jumlah: n(x.jumlah), orang: n(x.orang) }))
    .filter(x => POLA_KATA_WA.test(x.kata))
    .slice(0, MAKS_KATA_WA)
  const kesehatan: KesehatanWa = {
    pesan: n(s.pesan), selesai: n(s.selesai), gagal: n(s.gagal), proses: n(s.proses), macet: n(s.macet),
    balas: n(s.balas), diam: n(s.diam), inbox: n(s.inbox), terakhirMasuk: teks(s.terakhir_masuk), terakhirSimpan: teks(s.terakhir_simpan),
  }
  const pengguna = Array.isArray(o.per_pengguna) ? o.per_pengguna.map(objek).map(kePenggunaWa).filter(p => p.id) : null
  return {
    hari: n(o.hari), kecualiInternal: o.kecuali_internal !== false, terbuka: o.terbuka === true, sekarang: teks(o.sekarang),
    cakupan: {
      sejak: teks(c.sejak), jejakSejak: teks(c.jejak_sejak), jejakJam: n(c.jejak_jam) || 48,
      jejakUtuh: c.jejak_utuh === true, telemetriHari: n(c.telemetri_hari) || 120,
    },
    ringkas, corong, harian, golongan, kata, kataTerkunci: o.kata_tanpa_kategori === null, kesehatan,
    pengguna,
    penggunaTotal: pengguna ? Math.max(n(o.per_pengguna_total), pengguna.length) : null,
    kosong: ringkas.pesan === 0 && ringkas.catatan === 0 && kesehatan.pesan === 0 && corong.ketuk === 0 && corong.tutup === 0,
  }
}

function kePenggunaWa(p: Obj): PenggunaWa {
  const q = p.kuota == null ? null : objek(p.kuota)
  const v = p.versi == null ? null : objek(p.versi)
  const status = teks(p.status)
  return {
    id: teks(p.user_id) ?? '',
    nama: teks(p.nama)?.trim() || null,
    email: teks(p.email),
    internal: p.internal === true,
    pesan: n(p.pesan), dicatat: n(p.dicatat), catatan: n(p.catatan),
    terakhir: teks(p.terakhir),
    status: status ? (dikenal(STATUS_CATAT_WA, status) ?? 'lain') : 'lain',
    kuota: q ? { pro: q.pro === true, sakelar: q.sakelar === true, sisa: nNull(q.sisa), batas: nNull(q.batas) } : null,
    versi: v && (teks(v.versi) || teks(v.kode)) ? { versi: teks(v.versi), kode: teks(v.kode), platform: teks(v.platform) } : null,
  }
}

// ── Pembantu tampilan ────────────────────────────────────────────────────
/** Persen bulat a dari b, null bila b nol. */
export const persenDari = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 100) : null)

/**
 * Langkah corong orang yang terukur. Persen catatan pertama dan kembali
 * dihitung dari pesan pertama (orang yang sama). Ketuk pengumuman orangnya
 * bisa berbeda, jadi tanpa persen.
 */
export function langkahCorongWa(c: CorongWa): Array<{ kunci: LangkahCorongWa; orang: number; persen: number | null }> {
  return [
    { kunci: 'ketuk', orang: c.ketuk, persen: null },
    { kunci: 'pesan_pertama', orang: c.pesanPertama, persen: null },
    { kunci: 'catatan_pertama', orang: c.catatanPertama, persen: persenDari(c.catatanPertama, c.pesanPertama) },
    { kunci: 'kembali', orang: c.kembali, persen: persenDari(c.kembali, c.pesanPertama) },
  ]
}

/** Jenis kuota untuk label: Pro, tanpa batas (sakelar kuota mati), sisa dari batas, atau tidak diketahui. */
export type KeadaanKuotaWa = { jenis: 'pro' } | { jenis: 'bebas' } | { jenis: 'sisa'; sisa: number; batas: number; habis: boolean } | { jenis: 'kosong' }
export function keadaanKuotaWa(k: KuotaWa | null): KeadaanKuotaWa {
  if (!k) return { jenis: 'kosong' }
  if (k.pro) return { jenis: 'pro' }
  if (!k.sakelar) return { jenis: 'bebas' }
  if (k.sisa === null || k.batas === null) return { jenis: 'kosong' }
  return { jenis: 'sisa', sisa: Math.round(k.sisa), batas: Math.round(k.batas), habis: k.sisa <= 0 }
}

/** Detik ringkas: "0,8 dtk", "1,5 dtk", "12 dtk", "2,1 mnt". null untuk tidak ada. */
export function durasiWa(detik: number | null, bahasa: 'id' | 'en' = 'id'): string | null {
  if (detik === null || !Number.isFinite(detik) || detik < 0) return null
  const fmt = (x: number, d: number) => x.toLocaleString(bahasa === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: d })
  if (detik < 10) return `${fmt(detik, 1)} ${bahasa === 'en' ? 's' : 'dtk'}`
  if (detik < 120) return `${fmt(detik, 0)} ${bahasa === 'en' ? 's' : 'dtk'}`
  return `${fmt(detik / 60, 1)} ${bahasa === 'en' ? 'min' : 'mnt'}`
}

/** Tanggal WIB (YYYY-MM-DD) dari waktu ISO, untuk ?dari= Perjalanan. */
export function tanggalWibDari(iso: string | null): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return new Date(t + 7 * 3_600_000).toISOString().slice(0, 10)
}

/** Tautan Perjalanan 360 seseorang, mulai dari awal periode laporan (WIB). */
export function tautanPerjalananWa(id: string, sejak: string | null): { path: string; query: Record<string, string> } {
  const dari = tanggalWibDari(sejak)
  return { path: `/console/cashflow/pengguna/${encodeURIComponent(id)}/perjalanan`, query: dari ? { dari } : {} }
}

/** Tinggi batang harian relatif ke hari tersibuk, 0..100. */
export function skalaHarianWa(harian: readonly HariWa[]): number {
  return Math.max(1, ...harian.map(h => h.pesan))
}
