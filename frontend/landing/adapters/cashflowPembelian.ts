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
 *             play: PlayPembelianDTO | null}],
 *    ringkas: RingkasPembelianDTO,
 *    lanjut}
 * - Terbaru dulu. `waktu` = saat lunas, atau saat dibuat bila belum lunas.
 *   Halaman berikutnya lewat p_sebelum = `lanjut` (null = sudah habis).
 * - `kode` sudah disingkat server (kode pendek yang sama dengan di surel
 *   notifikasi). Console menampilkannya apa adanya.
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
 * PEMBELIAN GOOGLE PLAY YANG BELUM MENJADI KREDIT (migrasi CashFlow
 * 20261117140000_play_proses). p_status juga menerima `diproses` (Google
 * masih menunggu pembayarannya, atau pemeriksaannya belum berhasil) dan
 * `ditolak` (tidak akan menjadi kredit). Hanya untuk dua saringan itu:
 *   - baris berasal dari catatan proses, bukan dari pembelian: kode null,
 *     jalur 'play', play null, status = saringannya, nominal = harga paket,
 *     dan kunci tambahan
 *       proses: {keadaan, rinci, produk, sumber, sejak, terakhir,
 *                dicoba_pada, percobaan, bisa_dicoba}
 *   - jawaban membawa kunci tambahan
 *       proses: {diproses, tertunda, gagal_sementara, ditolak, tertua}
 *     dihitung atas SEMUA catatan proses (tanpa akun uji), tidak mengikuti
 *     saringan jalur atau halaman. `ringkas` tetap ada tetapi isinya nol,
 *     jadi halaman tidak menampilkannya di dua saringan ini.
 *   - p_jalur 'qris' memulangkan daftar kosong (keadaan ini hanya ada di Play).
 * Server lama (sebelum migrasi itu) menolak kedua nilai dengan 22023
 * masukan_tidak_sah, hint status. Halaman menulisnya sebagai keadaan tenang.
 * Semua kunci baru dibaca sebagai opsional, dan nilai keadaan atau rinci yang
 * belum dikenal console jatuh ke kalimat umum, tidak pernah tampil mentah.
 *
 * KESEHATAN (migrasi CashFlow 20261117170000_kesehatan_play_proses).
 * admin_kesehatan, RPC agregat tanpa data orang dan tanpa audit, membawa
 * kunci tambahan
 *   play_proses: {diproses, tertunda, gagal_sementara, ditolak, tertua_menit}
 * dengan baris yang sama dengan hitungan `proses` di atas (tanpa akun uji,
 * tanpa catatan yang kreditnya sudah masuk). `tertua_menit` = umur yang paling
 * lama menunggu dalam menit penuh saat server menjawab, null bila tidak ada.
 * Server lama tidak mengirim kuncinya: kePlayProsesKesehatan memulangkan null
 * dan halaman Kesehatan tidak menampilkan apa pun.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */

/** Nilai `status` dari server untuk pembelian yang tercatat. */
export const STATUS_PEMBELIAN = ['menunggu', 'lunas', 'kedaluwarsa', 'batal'] as const
export type StatusPembelian = typeof STATUS_PEMBELIAN[number]
/** Nilai `status` (dan p_status) untuk pembelian Play yang belum atau tidak jadi menjadi kredit. */
export const STATUS_PROSES_PEMBELIAN = ['diproses', 'ditolak'] as const
export type StatusProsesPembelian = typeof STATUS_PROSES_PEMBELIAN[number]
/** Nilai `jalur` dari server. */
export const JALUR_PEMBELIAN = ['play', 'qris'] as const
export type JalurPembelian = typeof JALUR_PEMBELIAN[number]
/** Nilai `proses.keadaan` (cek tabel ai_pembelian_play_proses). */
export const KEADAAN_PROSES = ['tertunda', 'gagal_sementara', 'ditolak'] as const
export type KeadaanProses = typeof KEADAAN_PROSES[number]
/** Nilai `proses.rinci`, hanya untuk keadaan ditolak. */
export const RINCI_PROSES = ['batal_google', 'akun_lain', 'sudah_batal', 'tidak_dikenal'] as const
export type RinciProses = typeof RINCI_PROSES[number]
/** Nilai `proses.sumber`: siapa yang terakhir melaporkan pembelian itu. */
export const SUMBER_PROSES = ['aplikasi', 'rtdn', 'sapu'] as const
export type SumberProses = typeof SUMBER_PROSES[number]
/** Pembelian yang menggantung lebih lama dari ini diberi nada perhatian. */
export const AMBANG_GANTUNG_MENIT = 60
/** Saringan di URL: 'semua' = tanpa saringan (null ke server). Lunas lebih dulu karena paling sering dicari. */
export const SARING_STATUS_PEMBELIAN = ['semua', 'lunas', 'menunggu', 'kedaluwarsa', 'batal', ...STATUS_PROSES_PEMBELIAN] as const
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
  harga_mikro?: Angka
  mata_uang?: string | null
  pajak_mikro?: Angka
  total_mikro?: Angka
  diterima_mikro?: Angka
  sumber_harga?: string | null
  google_lunas_pada?: string | null
  rtdn_pada?: string | null
  aplikasi_lapor_pada?: string | null
  kredit_masuk_pada?: string | null
}
/** Hanya di baris saringan diproses dan ditolak (20261117140000). */
export interface ProsesPembelianDTO {
  keadaan: string | null
  rinci: string | null
  produk: string | null
  sumber: string | null
  sejak: string | null
  terakhir: string | null
  dicoba_pada: string | null
  percobaan: Angka
  bisa_dicoba: boolean | null
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
  proses?: ProsesPembelianDTO | null
}
export interface RingkasPembelianDTO {
  lunas: Angka
  nominal_lunas: Angka
  perkiraan_diterima: Angka
  batal: Angka
  total_tidak_tersedia?: Angka
  diterima_tidak_tersedia?: Angka
  diterima_perkiraan?: Angka
}
/** Hitungan catatan proses, hanya di saringan diproses dan ditolak. */
export interface HitunganProsesDTO {
  diproses: Angka
  tertunda: Angka
  gagal_sementara: Angka
  ditolak: Angka
  tertua: string | null
}
/** Kunci `play_proses` admin_kesehatan (20261117170000). */
export interface PlayProsesKesehatanDTO {
  diproses: Angka
  tertunda: Angka
  gagal_sementara: Angka
  ditolak: Angka
  tertua_menit: Angka
}
export interface DaftarPembelianDTO {
  baris: PembelianDTO[] | null
  ringkas: RingkasPembelianDTO | null
  lanjut: string | null
  proses?: HitunganProsesDTO | null
}

// ── Domain: bentuk yang dipakai tabel dan ubin ───────────────────────────
export interface Pembelian {
  id: string
  /** Kode pendek untuk dicocokkan dengan surel notifikasi; '' bila tidak ada. */
  kode: string
  waktuIso: string | null
  /** null = nilai yang tidak dikenal console (tampil apa adanya tidak aman). */
  status: StatusPembelian | StatusProsesPembelian | null
  jalur: JalurPembelian | null
  paket: string | null
  kredit: number | null
  /** Tagihan QRIS atau harga dasar paket Play, dalam rupiah. */
  nominal: number | null
  uji: boolean
  pembeli: { userId: string | null; email: string | null; nama: string | null }
  /** Hanya untuk jalur Google Play. */
  play: {
    order: string | null
    dikonsumsi: boolean
    batalIso: string | null
    uang?: {
      mataUang: string
      harga: number | null
      pajak: number | null
      total: number | null
      diterima: number | null
      sumber: 'play_orders' | 'perkiraan_aplikasi' | 'perkiraan_paket' | null
    }
    waktu?: {
      googleLunas: string | null
      rtdn: string | null
      aplikasiLapor: string | null
      kreditMasuk: string | null
    }
  } | null
  /** Hanya baris saringan diproses dan ditolak. null = server tidak mengirimnya. */
  proses: ProsesPembelian | null
}
export interface ProsesPembelian {
  /** null = tidak dikirim, atau nilai yang belum dikenal console. */
  keadaan: KeadaanProses | null
  rinci: RinciProses | null
  /** Id produk Play, dipakai bila paketnya tidak ada lagi di tabel paket. */
  produk: string | null
  sumber: SumberProses | null
  sejakIso: string | null
  terakhirIso: string | null
  dicobaIso: string | null
  percobaan: number | null
  /** null = tidak dikirim. true = server masih menyimpan bahan untuk mencoba lagi sendiri. */
  bisaDicoba: boolean | null
}
export interface HitunganProses {
  /** null = tidak dikirim atau tidak terbaca (tampil "Tidak tersedia", bukan 0). */
  diproses: number | null
  tertunda: number | null
  gagalSementara: number | null
  ditolak: number | null
  tertuaIso: string | null
}
/** Pembelian Google Play yang menggantung, untuk halaman Kesehatan. */
export interface PlayProsesKesehatan {
  diproses: number
  /** null = tidak dikirim atau tidak terbaca. */
  tertunda: number | null
  gagalSementara: number | null
  ditolak: number | null
  /** Menit penuh sejak yang paling lama menunggu. null = tidak ada atau tidak terbaca. */
  tertuaMenit: number | null
}
/** kosong = tidak ada yang menunggu, lama = yang paling lama lewat AMBANG_GANTUNG_MENIT. */
export type KeadaanGantung = 'kosong' | 'menunggu' | 'lama'
export interface RingkasPembelian {
  lunas: number
  nominalLunas: number
  perkiraanDiterima: number
  batal: number
  totalTidakTersedia: number | null
  diterimaTidakTersedia: number | null
  diterimaPerkiraan: number | null
}
export interface HalamanPembelian {
  baris: Pembelian[]
  /** null bila jawaban tidak membawa ringkasan. */
  ringkas: RingkasPembelian | null
  lanjut: string | null
  /** Hanya di saringan diproses dan ditolak; null bila server tidak mengirimnya. */
  proses: HitunganProses | null
}

/** Bilangan bulat dari angka atau teks angka; selain itu null. */
function bulat(v: unknown): number | null {
  if (typeof v === 'number') return Number.isSafeInteger(v) ? v : null
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

function positifAtauNol(v: unknown): number | null {
  const n = bulat(v)
  return n !== null && n >= 0 ? n : null
}

function waktuIso(v: unknown): string | null {
  const s = teks(v)
  return s && Number.isFinite(Date.parse(s)) ? s : null
}

function kePlay(play: Record<string, unknown>): NonNullable<Pembelian['play']> {
  const hasil: NonNullable<Pembelian['play']> = {
    order: teks(play.order), dikonsumsi: play.dikonsumsi === true, batalIso: waktuIso(play.batal_pada),
  }
  const mataUang = teks(play.mata_uang)
  if (mataUang && /^[A-Z]{3}$/.test(mataUang)) {
    const sumber = dari(['play_orders', 'perkiraan_aplikasi', 'perkiraan_paket'] as const, play.sumber_harga)
    const terverifikasi = sumber === 'play_orders'
    hasil.uang = {
      mataUang, sumber,
      harga: positifAtauNol(play.harga_mikro),
      pajak: terverifikasi ? positifAtauNol(play.pajak_mikro) : null,
      total: terverifikasi ? positifAtauNol(play.total_mikro) : null,
      diterima: terverifikasi ? bulat(play.diterima_mikro) : null,
    }
  }
  const waktu = {
    googleLunas: waktuIso(play.google_lunas_pada),
    rtdn: waktuIso(play.rtdn_pada),
    aplikasiLapor: waktuIso(play.aplikasi_lapor_pada),
    kreditMasuk: waktuIso(play.kredit_masuk_pada),
  }
  if (Object.values(waktu).some(Boolean)) hasil.waktu = waktu
  return hasil
}

export function uangPlay(mikro: number, mataUang: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency: mataUang, maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  }).format(mikro / 1_000_000)
}

export function jedaKreditPlay(waktu: NonNullable<NonNullable<Pembelian['play']>['waktu']>): number | null {
  if (!waktu.googleLunas || !waktu.kreditMasuk) return null
  const ms = Date.parse(waktu.kreditMasuk) - Date.parse(waktu.googleLunas)
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null
}

function keProses(p: Record<string, unknown>): ProsesPembelian {
  const keadaan = dari(KEADAAN_PROSES, p.keadaan)
  return {
    keadaan,
    // Rinci hanya berarti untuk keadaan ditolak (cek tabel). Selain itu dibuang.
    rinci: keadaan === 'ditolak' || keadaan === null ? dari(RINCI_PROSES, p.rinci) : null,
    produk: teks(p.produk),
    sumber: dari(SUMBER_PROSES, p.sumber),
    sejakIso: waktuIso(p.sejak),
    terakhirIso: waktuIso(p.terakhir),
    dicobaIso: waktuIso(p.dicoba_pada),
    percobaan: positifAtauNol(p.percobaan),
    bisaDicoba: typeof p.bisa_dicoba === 'boolean' ? p.bisa_dicoba : null,
  }
}

export function kePembelian(dto: PembelianDTO): Pembelian {
  const pembeli = objek(dto.pembeli)
  const play = objek(dto.play)
  const proses = objek(dto.proses)
  return {
    id: typeof dto.id === 'string' ? dto.id : '',
    kode: teks(dto.kode) ?? '',
    waktuIso: teks(dto.waktu),
    status: dari(STATUS_PEMBELIAN, dto.status) ?? dari(STATUS_PROSES_PEMBELIAN, dto.status),
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
    play: play ? kePlay(play) : null,
    proses: proses ? keProses(proses) : null,
  }
}

/** Hitungan catatan proses. null bila jawaban tidak membawanya (saringan lain, atau server lama). */
export function keHitunganProses(dto: HitunganProsesDTO | null | undefined | unknown): HitunganProses | null {
  const h = objek(dto)
  if (!h) return null
  return {
    diproses: positifAtauNol(h.diproses),
    tertunda: positifAtauNol(h.tertunda),
    gagalSementara: positifAtauNol(h.gagal_sementara),
    ditolak: positifAtauNol(h.ditolak),
    tertuaIso: waktuIso(h.tertua),
  }
}

/** Kunci play_proses admin_kesehatan. null bila tidak ada (server lama) atau
 *  `diproses` tidak terbaca, supaya halaman tidak menulis angka karangan. */
export function kePlayProsesKesehatan(dto: PlayProsesKesehatanDTO | null | undefined | unknown): PlayProsesKesehatan | null {
  const p = objek(dto)
  const diproses = p ? positifAtauNol(p.diproses) : null
  if (!p || diproses === null) return null
  return {
    diproses,
    tertunda: positifAtauNol(p.tertunda),
    gagalSementara: positifAtauNol(p.gagal_sementara),
    ditolak: positifAtauNol(p.ditolak),
    tertuaMenit: diproses > 0 ? positifAtauNol(p.tertua_menit) : null,
  }
}

/** Nada baris Kesehatan. null = jangan tampil (server lama). */
export function keadaanGantung(p: PlayProsesKesehatan | null): KeadaanGantung | null {
  if (!p) return null
  if (p.diproses === 0) return 'kosong'
  return p.tertuaMenit !== null && p.tertuaMenit > AMBANG_GANTUNG_MENIT ? 'lama' : 'menunggu'
}

/** Tautan ke halaman Pembelian, saringan Sedang diproses. */
export const TAUTAN_PEMBELIAN_DIPROSES = '/console/cashflow/pembelian?status=diproses'

export function keRingkasPembelian(dto: RingkasPembelianDTO | null | undefined): RingkasPembelian | null {
  const r = objek(dto)
  if (!r) return null
  return {
    lunas: bulat(r.lunas) ?? 0,
    nominalLunas: bulat(r.nominal_lunas) ?? 0,
    perkiraanDiterima: bulat(r.perkiraan_diterima) ?? 0,
    batal: bulat(r.batal) ?? 0,
    totalTidakTersedia: positifAtauNol(r.total_tidak_tersedia),
    diterimaTidakTersedia: positifAtauNol(r.diterima_tidak_tersedia),
    diterimaPerkiraan: positifAtauNol(r.diterima_perkiraan),
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
    proses: keHitunganProses(o?.proses),
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
export function pillStatusPembelian(s: StatusPembelian | StatusProsesPembelian | null): string {
  switch (s) {
    case 'lunas': return 'ca-pill-emerald'
    case 'menunggu':
    case 'diproses': return 'ca-pill-info'
    case 'batal': return 'ca-pill-danger'
    default: return 'ca-pill-muted'
  }
}

// ── Pembelian Play yang belum menjadi kredit ─────────────────────────────
/** Saringan yang memanggil daftar catatan proses, bukan daftar pembelian. */
export const saringProses = (s: string): s is StatusProsesPembelian =>
  (STATUS_PROSES_PEMBELIAN as readonly string[]).includes(s)

type BarisProses = Pick<Pembelian, 'status' | 'proses'>

/** Keadaan yang ditampilkan. Tanpa keadaan yang dikenal, status saringannya yang bicara. */
export function keadaanTampil(p: BarisProses): KeadaanProses | 'diproses' {
  if (p.proses?.keadaan) return p.proses.keadaan
  return p.status === 'ditolak' ? 'ditolak' : 'diproses'
}

/** Kunci kamus label keadaan (pembelian.proses.keadaan.*). Selalu ada di ID dan EN. */
export const kunciKeadaanProses = (p: BarisProses): string => `pembelian.proses.keadaan.${keadaanTampil(p)}`

/**
 * Kunci kamus kalimat sebab (pembelian.proses.sebab.*). Selalu ada di ID dan
 * EN, juga untuk nilai yang belum dikenal console: kode server tidak pernah
 * tampil mentah.
 */
export function kunciSebabProses(p: BarisProses): string {
  if (!p.proses) return 'pembelian.proses.sebab.tanpaRincian'
  const k = keadaanTampil(p)
  if (k === 'ditolak') return `pembelian.proses.sebab.${p.proses.rinci ?? 'ditolakLain'}`
  if (k === 'diproses') return 'pembelian.proses.sebab.lain'
  return `pembelian.proses.sebab.${k}`
}

/** Lencana keadaan (cashflow-tema.css). Hanya yang belum bisa diperiksa yang diberi nada awas. */
export function lencanaProses(p: BarisProses): string {
  switch (keadaanTampil(p)) {
    case 'gagal_sementara': return 'cf-lencana cf-lencana-awas'
    case 'ditolak': return 'cf-lencana cf-lencana-galat'
    default: return 'cf-lencana'
  }
}

/** Menit sejak `iso` sampai `kiniMs`. Waktu di depan jam peramban dihitung 0. null bila tidak terbaca. */
export function menitSejak(iso: string | null | undefined, kiniMs: number): number | null {
  if (!iso || !Number.isFinite(kiniMs)) return null
  const t = Date.parse(iso)
  return Number.isFinite(t) ? Math.max(0, Math.floor((kiniMs - t) / 60_000)) : null
}

/** Menggantung lebih lama dari ambang. Yang sudah ditolak tidak menggantung. */
export function menggantungLama(p: BarisProses & { waktuIso?: string | null }, kiniMs: number): boolean {
  if (keadaanTampil(p) === 'ditolak') return false
  const m = menitSejak(p.proses?.sejakIso ?? p.waktuIso ?? null, kiniMs)
  return m !== null && m > AMBANG_GANTUNG_MENIT
}

/** Pecah menit untuk kalimat lama (kamus pembelian.proses.lama). */
export function bagianLama(menit: number): { hari: number; jam: number; menit: number } {
  const m = Math.max(0, Math.floor(menit))
  return { hari: Math.floor(m / 1440), jam: Math.floor((m % 1440) / 60), menit: m % 60 }
}

/** Pembelian Play yang lunas dan belum selesai dikonsumsi di Google. */
export const playBelumDikonsumsi = (p: Pick<Pembelian, 'status' | 'jalur' | 'play'>): boolean =>
  p.jalur === 'play' && p.status === 'lunas' && !!p.play && !p.play.dikonsumsi && !p.play.batalIso

/** Galat 22023 masukan_tidak_sah: nilai saringan yang tidak dikenal server. */
export const masukanTidakSah = (g: { message?: string } | null | undefined): boolean =>
  !!g && g.message === 'masukan_tidak_sah'

/** Server sebelum 20261117140000 belum mengenal saringan diproses dan ditolak:
 *  22023 masukan_tidak_sah dengan hint status (atau tanpa hint). Halaman
 *  menulisnya sebagai keadaan tenang, bukan galat. */
export const prosesBelumDikenalServer = (
  g: { message?: string; hint?: string } | null | undefined, status: string,
): boolean => saringProses(status) && masukanTidakSah(g) && (!g?.hint || g.hint === 'status')
