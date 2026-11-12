/**
 * Pembelian kredit Domi di console: siapa membeli, paket apa, lewat jalur
 * mana, dan statusnya.
 *
 * KONTRAK RPC (dibandingkan dengan migrasinya oleh
 * tests/cashflow/pembelian.test.ts begitu fungsinya ada di folder migrasi):
 * admin_ai_pembelian_daftar(p_batas int default 50, p_sebelum timestamptz
 * default null, p_status text default null, p_jalur text default null)
 * returns jsonb
 *   {baris: [{id, kode, waktu, status, jalur, paket, kredit, nominal, uji,
 *             pembeli: {user_id, email, nama},
 *             play: {order, dikonsumsi, batal_pada} | null}],
 *    ringkas: {lunas, nominal_lunas, perkiraan_diterima, batal},
 *    lanjut}
 * - Terbaru dulu. `waktu` = saat lunas, atau saat dibuat bila belum lunas.
 *   Halaman berikutnya lewat p_sebelum = `lanjut` (null = sudah habis).
 * - `kode` sudah disingkat server (8 aksara terakhir kode pembelian).
 * - p_status dan p_jalur null = semua. p_batas dijepit server 1..200.
 *   Nilai saringan yang tidak dikenal: 22023 `masukan_tidak_sah`.
 * - Ringkasan dihitung atas SEMUA baris yang cocok saringan (bukan hanya
 *   halaman ini) dan TIDAK menghitung pembelian uji.
 * - Penjaga dan audit sama dengan RPC admin lain yang membuka data pengguna:
 *   setiap panggilan tercatat di audit, jadi halaman tidak memanggilnya
 *   tanpa tindakan admin (tanpa muat berkala).
 *
 * Email dan nama pembeli ditampilkan sebagai TEKS POLOS (interpolasi biasa,
 * tidak pernah dirender sebagai HTML).
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */

/** Nilai `status` dari server. */
export const STATUS_PEMBELIAN = ['menunggu', 'lunas', 'kedaluwarsa', 'batal'] as const
export type StatusPembelian = typeof STATUS_PEMBELIAN[number]
/** Nilai `jalur` dari server. */
export const JALUR_PEMBELIAN = ['play', 'qris'] as const
export type JalurPembelian = typeof JALUR_PEMBELIAN[number]
/** Saringan di URL: 'semua' = tanpa saringan (null ke server). Lunas lebih dulu karena paling sering dicari. */
export const SARING_STATUS_PEMBELIAN = ['semua', 'lunas', 'menunggu', 'kedaluwarsa', 'batal'] as const
export const SARING_JALUR_PEMBELIAN = ['semua', ...JALUR_PEMBELIAN] as const
export type SaringStatusPembelian = typeof SARING_STATUS_PEMBELIAN[number]
export type SaringJalurPembelian = typeof SARING_JALUR_PEMBELIAN[number]
/** p_batas per halaman (server menjepit 1..200). */
export const BATAS_DAFTAR_PEMBELIAN = 50

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
/** int dan bigint bisa pulang sebagai angka atau teks. */
type Angka = number | string | null
export interface PembeliDTO {
  user_id: string | null
  email: string | null
  nama: string | null
}
export interface PlayPembelianDTO {
  order: string | null
  dikonsumsi: boolean | null
  batal_pada: string | null
}
export interface PembelianDTO {
  id: string
  kode: string | null
  waktu: string | null
  status: string | null
  jalur: string | null
  paket: string | null
  kredit: Angka
  nominal: Angka
  uji: boolean | null
  pembeli: PembeliDTO | null
  play: PlayPembelianDTO | null
}
export interface RingkasPembelianDTO {
  lunas: Angka
  nominal_lunas: Angka
  perkiraan_diterima: Angka
  batal: Angka
}
export interface DaftarPembelianDTO {
  baris: PembelianDTO[] | null
  ringkas: RingkasPembelianDTO | null
  lanjut: string | null
}

// ── Domain: bentuk yang dipakai tabel dan ubin ───────────────────────────
export interface Pembelian {
  id: string
  /** Kode pendek untuk dicocokkan dengan surel notifikasi; '' bila tidak ada. */
  kode: string
  waktuIso: string | null
  /** null = nilai yang tidak dikenal console (tampil apa adanya tidak aman). */
  status: StatusPembelian | null
  jalur: JalurPembelian | null
  paket: string | null
  kredit: number | null
  /** Harga yang ditagih, rupiah. null = tidak terbaca. */
  nominal: number | null
  uji: boolean
  pembeli: { userId: string | null; email: string | null; nama: string | null }
  /** Hanya untuk jalur Google Play. */
  play: { order: string | null; dikonsumsi: boolean; batalIso: string | null } | null
}
export interface RingkasPembelian {
  lunas: number
  nominalLunas: number
  perkiraanDiterima: number
  batal: number
}
export interface HalamanPembelian {
  baris: Pembelian[]
  /** null bila jawaban tidak membawa ringkasan. */
  ringkas: RingkasPembelian | null
  lanjut: string | null
}

/** Bilangan bulat dari angka atau teks angka; selain itu null. */
function bulat(v: unknown): number | null {
  if (typeof v === 'number') return Number.isInteger(v) ? v : null
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) {
    const n = Number(v.trim())
    return Number.isSafeInteger(n) ? n : null
  }
  return null
}
const teks = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const dari = <T extends string>(daftar: readonly T[], v: unknown): T | null =>
  (typeof v === 'string' && (daftar as readonly string[]).includes(v) ? v as T : null)
const objek = (v: unknown): Record<string, unknown> | null =>
  (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null)

export function kePembelian(dto: PembelianDTO): Pembelian {
  const pembeli = objek(dto.pembeli)
  const play = objek(dto.play)
  return {
    id: typeof dto.id === 'string' ? dto.id : '',
    kode: teks(dto.kode) ?? '',
    waktuIso: teks(dto.waktu),
    status: dari(STATUS_PEMBELIAN, dto.status),
    jalur: dari(JALUR_PEMBELIAN, dto.jalur),
    paket: teks(dto.paket),
    kredit: bulat(dto.kredit),
    nominal: bulat(dto.nominal),
    uji: dto.uji === true,
    pembeli: {
      userId: teks(pembeli?.user_id),
      email: teks(pembeli?.email),
      nama: teks(pembeli?.nama),
    },
    play: play
      ? { order: teks(play.order), dikonsumsi: play.dikonsumsi === true, batalIso: teks(play.batal_pada) }
      : null,
  }
}

export function keRingkasPembelian(dto: RingkasPembelianDTO | null | undefined): RingkasPembelian | null {
  const r = objek(dto)
  if (!r) return null
  return {
    lunas: bulat(r.lunas) ?? 0,
    nominalLunas: bulat(r.nominal_lunas) ?? 0,
    perkiraanDiterima: bulat(r.perkiraan_diterima) ?? 0,
    batal: bulat(r.batal) ?? 0,
  }
}

/** Baris dari jawaban, apa pun bentuk luarnya. Baris tanpa id dibuang. */
export function barisPembelian(dto: DaftarPembelianDTO | null | undefined | unknown): PembelianDTO[] {
  const larik = objek(dto)?.baris
  return Array.isArray(larik)
    ? larik.filter((b): b is PembelianDTO => !!objek(b) && typeof (b as { id?: unknown }).id === 'string' && !!(b as { id: string }).id)
    : []
}

/** Satu jawaban daftar → baris, ringkasan, dan kursor halaman berikutnya. */
export function halamanPembelian(dto: DaftarPembelianDTO | null | undefined | unknown): HalamanPembelian {
  const o = objek(dto)
  return {
    baris: barisPembelian(dto).map(kePembelian),
    ringkas: keRingkasPembelian(o?.ringkas as RingkasPembelianDTO | null | undefined),
    lanjut: teks(o?.lanjut),
  }
}

/** Halaman berikutnya ditempel di bawah; id yang sudah ada tidak digandakan
 *  (pembelian yang bergeser karena data baru, atau jawaban yang tiba dua kali). */
export function gabungPembelian(lama: readonly Pembelian[], baru: readonly Pembelian[]): Pembelian[] {
  const ada = new Set(lama.map(p => p.id))
  return [...lama, ...baru.filter(p => !ada.has(p.id))]
}

/** Kursor sesudah "muat lebih banyak". Jawaban yang tidak membawa baris baru
 *  atau kursornya tidak bergerak dianggap habis, supaya tombolnya tidak
 *  memanggil server (dan menulis audit) berulang tanpa hasil. */
export function kursorSesudah(sebelum: string | null, halaman: Pick<HalamanPembelian, 'baris' | 'lanjut'>): string | null {
  if (!halaman.baris.length || !halaman.lanjut || halaman.lanjut === sebelum) return null
  return halaman.lanjut
}

/** Saringan URL → argumen server (null = semua). */
export const saringPembelianKeServer = <T extends string>(v: T | 'semua'): T | null => (v === 'semua' ? null : v)

/** Lencana status: kelas pill yang ada di main.css. */
export function pillStatusPembelian(s: StatusPembelian | null): string {
  switch (s) {
    case 'lunas': return 'ca-pill-emerald'
    case 'menunggu': return 'ca-pill-info'
    case 'batal': return 'ca-pill-danger'
    default: return 'ca-pill-muted'
  }
}

/** Pembelian Play yang sudah lunas tapi belum dikonsumsi: kreditnya mungkin
 *  belum masuk, perlu dilihat. Pembelian yang sudah dibatalkan Google tidak. */
export const playBelumDikonsumsi = (p: Pick<Pembelian, 'status' | 'jalur' | 'play'>): boolean =>
  p.jalur === 'play' && p.status === 'lunas' && !!p.play && !p.play.dikonsumsi && !p.play.batalIso

/** Galat 22023 masukan_tidak_sah: nilai saringan yang tidak dikenal server. */
export const masukanTidakSah = (g: { message?: string } | null | undefined): boolean =>
  !!g && g.message === 'masukan_tidak_sah'
