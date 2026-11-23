/**
 * Bagian "Minat Kilas Pasar" di halaman Laporan console CashFlow: siapa yang
 * melihat kartu Kilas Pasar dan Promo di Beranda, membuka Detail, mengetuk
 * sumber, membuka halaman resmi, dan bertanya ke Domi soal pasar
 * (spek analitik pasar dan promo 23 Nov 2026, AP-7).
 *
 * KONTRAK RPC (dibandingkan dengan migrasi oleh tests/cashflow/laporan-pasar.test.ts):
 * - admin_laporan_pasar(p_hari 7..90) {hari, dari, sampai,
 *   ringkas{lihat, detail, ketuk, halaman, domi},
 *   harian[{tanggal, lihat, detail, ketuk, halaman, domi}],
 *   tab{pasar, promo}, detail_dari{kepala, ubin, promo, lain},
 *   sumber[{sumber, jenis, ketuk, orang}], dari_promo{cocok, semua, lihat_semua},
 *   halaman{asal{kartu, domi, lain}, lama{kurang_10, sampai_60, sampai_180,
 *   lebih_180}, browser, pindah}, tanya_kartu{kurs, emas, promo},
 *   domi{kurs|emas|saham|promo|umum: {tanya, orang}}}. Izin view, tanpa audit,
 *   akun dalam tidak dihitung, zona Asia/Jakarta.
 *   ringkas dan harian = ORANG berbeda. Yang lain = jumlah peristiwa, kecuali
 *   `orang` di sumber dan domi.
 *   Migrasinya dibangun bersamaan di repo CashFlow. Server yang belum
 *   memasangnya menjawab PGRST202: bagian ini menulis "belum aktif".
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */

/** bigint dan numeric bisa pulang sebagai string. */
type Angka = number | string | null

/** Langkah corong orang, urut dari kartu sampai halaman resmi. */
export const LANGKAH_CORONG_PASAR = ['lihat', 'detail', 'ketuk', 'halaman'] as const
export type LangkahCorongPasar = typeof LANGKAH_CORONG_PASAR[number]
/** Seri harian: empat langkah corong ditambah bertanya ke Domi. */
export const METRIK_PASAR = [...LANGKAH_CORONG_PASAR, 'domi'] as const
export type MetrikPasar = typeof METRIK_PASAR[number]
export const TAB_PASAR = ['pasar', 'promo'] as const
export type TabPasar = typeof TAB_PASAR[number]
export const DETAIL_DARI = ['kepala', 'ubin', 'promo', 'lain'] as const
export type DetailDari = typeof DETAIL_DARI[number]
export const DARI_PROMO = ['cocok', 'semua', 'lihat_semua'] as const
export type DariPromo = typeof DARI_PROMO[number]
export const ASAL_HALAMAN = ['kartu', 'domi', 'lain'] as const
export type AsalHalaman = typeof ASAL_HALAMAN[number]
export const LAMA_BACA = ['kurang_10', 'sampai_60', 'sampai_180', 'lebih_180'] as const
export type LamaBaca = typeof LAMA_BACA[number]
export const TOPIK_KARTU = ['kurs', 'emas', 'promo'] as const
export type TopikKartu = typeof TOPIK_KARTU[number]
export const TOPIK_DOMI = ['kurs', 'emas', 'saham', 'promo', 'umum'] as const
export type TopikDomi = typeof TOPIK_DOMI[number]
/** Jenis baris sumber: tiga jenis katalog promo_hemat, dan tautan emas atau saham di tab Pasar. */
export const JENIS_SUMBER_PASAR = ['dompet', 'belanja', 'emas', 'emas_saham'] as const
export type JenisSumberPasar = typeof JENIS_SUMBER_PASAR[number]
/** Baris sumber paling banyak yang dikirim server. */
export const MAKS_SUMBER_PASAR = 20
/** Bentuk id sumber yang boleh tampil (id katalog promo_hemat). Selain ini dibaca `lain`. */
export const POLA_ID_SUMBER = /^[a-z0-9_]{1,30}$/
/** Versi aplikasi pertama yang punya kartu Kilas Pasar dan mencatat minatnya. */
export const VERSI_KILAS_PASAR = '1.6.0'

/**
 * Nama tampil sumber per id. Tujuh belas id katalog promo_hemat
 * (migrasi CashFlow 20261123000500_promo_hemat_resmi, nama dari sana juga),
 * ditambah idx untuk tautan saham di tab Pasar. Nama merek sama di kedua
 * bahasa. Id yang tidak ada di sini tetap tampil dengan id-nya.
 */
export const NAMA_SUMBER_PASAR: Readonly<Record<string, string>> = {
  gopay: 'GoPay', ovo: 'OVO', dana: 'DANA', shopeepay: 'ShopeePay', bca: 'BCA', mandiri: 'Bank Mandiri',
  bri: 'BRI', bni: 'BNI', bsi: 'BSI', jago: 'Bank Jago', seabank: 'SeaBank', blu: 'blu by BCA Digital',
  indomaret: 'Indomaret', alfamart: 'Alfamart', mypertamina: 'MyPertamina', pegadaian: 'Pegadaian',
  logammulia: 'Logam Mulia (Antam)', idx: 'Bursa Efek Indonesia',
}
/**
 * Nama tampil situs halaman resmi per domain: SUMBER_DIKENAL di aplikasi
 * (src/lib/halamanResmi.ts). Dipakai kamus Perjalanan untuk rincian `sumber`
 * halaman.buka, halaman.tutup, dan halaman.browser.
 */
export const NAMA_SITUS_PASAR: Readonly<Record<string, string>> = {
  'gopay.co.id': 'GoPay', 'ovo.id': 'OVO', 'dana.id': 'DANA', 'shopeepay.co.id': 'ShopeePay', 'bca.co.id': 'BCA',
  'bankmandiri.co.id': 'Bank Mandiri', 'bri.co.id': 'BRI', 'bni.co.id': 'BNI', 'bankbsi.co.id': 'BSI', 'jago.com': 'Bank Jago',
  'seabank.co.id': 'SeaBank', 'blubybcadigital.id': 'blu by BCA Digital', 'indomaret.co.id': 'Indomaret', 'alfamart.co.id': 'Alfamart',
  'mypertamina.id': 'MyPertamina', 'pegadaian.co.id': 'Pegadaian', 'logammulia.com': 'Logam Mulia (Antam)',
  'idx.co.id': 'Bursa Efek Indonesia', 'coreasia.id': 'CoreAsia',
}

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
export interface RingkasPasarDTO { lihat: Angka; detail: Angka; ketuk: Angka; halaman: Angka; domi: Angka }
export interface HariPasarDTO extends RingkasPasarDTO { tanggal: string }
export interface SumberPasarDTO { sumber: string; jenis: string; ketuk: Angka; orang: Angka }
export interface MinatPasarDTO {
  hari: Angka; dari: string; sampai: string
  ringkas: RingkasPasarDTO
  harian: HariPasarDTO[]
  tab: { pasar: Angka; promo: Angka }
  detail_dari: { kepala: Angka; ubin: Angka; promo: Angka; lain: Angka }
  sumber: SumberPasarDTO[]
  dari_promo: { cocok: Angka; semua: Angka; lihat_semua: Angka }
  halaman: {
    asal: { kartu: Angka; domi: Angka; lain: Angka }
    lama: { kurang_10: Angka; sampai_60: Angka; sampai_180: Angka; lebih_180: Angka }
    browser: Angka; pindah: Angka
  }
  tanya_kartu: { kurs: Angka; emas: Angka; promo: Angka }
  domi: Record<TopikDomi, { tanya: Angka; orang: Angka }>
}

// ── Domain ───────────────────────────────────────────────────────────────
/** Angka rusak (NaN, negatif, bukan angka) dibaca nol. */
const n = (v: unknown): number => {
  const x = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : 0
  return Number.isFinite(x) && x > 0 ? Math.round(x) : 0
}
const objek = (v: unknown): Record<string, unknown> =>
  (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {})
/** Baca kunci-kunci yang dikenal saja. Kunci lain dari server diabaikan. */
const hitung = <K extends string>(kunci: readonly K[], v: unknown): Record<K, number> => {
  const o = objek(v)
  return Object.fromEntries(kunci.map(k => [k, n(o[k])])) as Record<K, number>
}
const ymd = (v: unknown): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)

export interface LangkahCorong {
  kunci: LangkahCorongPasar
  orang: number
  /**
   * Persen bulat dari langkah sebelumnya. null untuk langkah pertama, bila
   * langkah sebelumnya nol, atau bila lebih dari 100 (halaman resmi juga dibuka
   * dari jawaban Domi, jadi bisa lebih banyak dari yang mengetuk sumber).
   */
  persen: number | null
}
export interface SumberPasar {
  /** Id sumber yang aman tampil, atau 'lain'. */
  sumber: string
  /** Nama merek bila id-nya dikenal, null untuk 'lain' dan id baru. */
  nama: string | null
  /** null = jenis yang belum dikenal console. */
  jenis: JenisSumberPasar | null
  ketuk: number
  orang: number
}
export interface TopikDomiPasar { topik: TopikDomi; tanya: number; orang: number }
export interface MinatPasar {
  hari: number
  dari: string
  sampai: string
  ringkas: Record<MetrikPasar, number>
  corong: LangkahCorong[]
  /** Satu baris per tanggal, urut naik. */
  harian: Array<{ tanggal: string } & Record<MetrikPasar, number>>
  tab: Record<TabPasar, number>
  detailDari: Record<DetailDari, number>
  /** Paling sering diketuk dulu, paling banyak MAKS_SUMBER_PASAR baris. */
  sumber: SumberPasar[]
  dariPromo: Record<DariPromo, number>
  halaman: {
    asal: Record<AsalHalaman, number>
    lama: Record<LamaBaca, number>
    /** Jumlah halaman yang tercatat ditutup (jumlah semua kelompok lama). */
    tutup: number
    browser: number
    pindah: number
  }
  tanyaKartu: Record<TopikKartu, number>
  /** Urutan tetap kurs, emas, saham, promo, umum. */
  domi: TopikDomiPasar[]
  /** true bila tidak ada satu pun angka di jawaban ini. */
  kosong: boolean
}

/** Persen bulat a dari b, null bila b nol atau hasilnya lebih dari 100. */
export function persenCorong(a: number, b: number): number | null {
  if (!(b > 0)) return null
  const p = Math.round((a / b) * 100)
  return p > 100 ? null : p
}

const jenisSumber = (v: unknown): JenisSumberPasar | null =>
  (JENIS_SUMBER_PASAR as readonly unknown[]).includes(v) ? v as JenisSumberPasar : null

/** Id sumber yang aman tampil. Nilai di luar bentuk id katalog dibaca 'lain', tidak diteruskan. */
export const idSumberAman = (v: unknown): string => (typeof v === 'string' && POLA_ID_SUMBER.test(v) ? v : 'lain')
export const namaSumberPasar = (id: string): string | null =>
  (id !== 'lain' && Object.hasOwn(NAMA_SUMBER_PASAR, id) ? NAMA_SUMBER_PASAR[id]! : null)

function keSumber(v: unknown): SumberPasar[] {
  const gabung = new Map<string, SumberPasar>()
  for (const b of Array.isArray(v) ? v : []) {
    if (!b || typeof b !== 'object') continue
    const r = b as Record<string, unknown>
    const sumber = idSumberAman(r.sumber)
    const jenis = jenisSumber(r.jenis)
    const kunci = `${sumber}|${jenis ?? ''}`
    const ada = gabung.get(kunci)
    /* Server tidak mengirim pasangan ganda. Kalau dua baris rusak jatuh ke
       pasangan yang sama, ketukan dijumlah dan orang diambil yang terbesar:
       orang berbeda tidak bisa dijumlah tanpa tahu siapa saja orangnya. */
    if (ada) { ada.ketuk += n(r.ketuk); ada.orang = Math.max(ada.orang, n(r.orang)); continue }
    gabung.set(kunci, { sumber, nama: namaSumberPasar(sumber), jenis, ketuk: n(r.ketuk), orang: n(r.orang) })
  }
  return [...gabung.values()]
    .filter(s => s.ketuk > 0 || s.orang > 0)
    .sort((a, b) => b.ketuk - a.ketuk || a.sumber.localeCompare(b.sumber) || (a.jenis ?? '').localeCompare(b.jenis ?? ''))
    .slice(0, MAKS_SUMBER_PASAR)
}

export function keMinatPasar(d: MinatPasarDTO | null | undefined): MinatPasar {
  const ringkas = hitung(METRIK_PASAR, d?.ringkas)
  const harian = (Array.isArray(d?.harian) ? d.harian : [])
    .map(h => ({ tanggal: ymd(objek(h).tanggal), ...hitung(METRIK_PASAR, h) }))
    .filter((h): h is { tanggal: string } & Record<MetrikPasar, number> => h.tanggal !== null)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  const hal = objek(d?.halaman)
  const lama = hitung(LAMA_BACA, hal.lama)
  const domiMentah = objek(d?.domi)
  const domi = TOPIK_DOMI.map(topik => ({ topik, ...hitung(['tanya', 'orang'] as const, domiMentah[topik]) }))
  const hasil: Omit<MinatPasar, 'kosong'> = {
    hari: n(d?.hari),
    dari: ymd(d?.dari) ?? '',
    sampai: ymd(d?.sampai) ?? '',
    ringkas,
    corong: LANGKAH_CORONG_PASAR.map((kunci, i) => ({
      kunci, orang: ringkas[kunci], persen: i === 0 ? null : persenCorong(ringkas[kunci], ringkas[LANGKAH_CORONG_PASAR[i - 1]!]),
    })),
    harian,
    tab: hitung(TAB_PASAR, d?.tab),
    detailDari: hitung(DETAIL_DARI, d?.detail_dari),
    sumber: keSumber(d?.sumber),
    dariPromo: hitung(DARI_PROMO, d?.dari_promo),
    halaman: {
      asal: hitung(ASAL_HALAMAN, hal.asal),
      lama,
      tutup: LAMA_BACA.reduce((a, k) => a + lama[k], 0),
      browser: n(hal.browser),
      pindah: n(hal.pindah),
    },
    tanyaKartu: hitung(TOPIK_KARTU, d?.tanya_kartu),
    domi,
  }
  return { ...hasil, kosong: !adaAngka(hasil) }
}

/** Ada angka di atas nol di mana pun (hari dan tanggal tidak dihitung)? */
function adaAngka(m: Omit<MinatPasar, 'kosong'>): boolean {
  const { hari: _h, dari: _d, sampai: _s, ...isi } = m
  const cari = (v: unknown): boolean => {
    if (typeof v === 'number') return v > 0
    if (Array.isArray(v)) return v.some(cari)
    if (v && typeof v === 'object') return Object.values(v).some(cari)
    return false
  }
  return cari(isi)
}

/** Seri harian satu metrik, urut tanggal naik. */
export const seriPasar = (m: MinatPasar, metrik: MetrikPasar): number[] => m.harian.map(h => h[metrik])
