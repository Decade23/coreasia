/**
 * Domi: penyedia cadangan. Domi dijawab penyedia utama, dan bila penyedia
 * utama bermasalah server pindah sendiri ke penyedia cadangan. Halaman
 * console-nya menyalakan cadangan, memilih model, dan mengganti kunci API.
 *
 * KONTRAK RPC (dipakai persis, ketiganya memulangkan bentuk yang sama):
 * - admin_ai_cadangan_baca() → {aktif, model, model_pilihan, kunci_ada,
 *   kunci_sidik, kunci_diubah_pada, terakhir_dipakai_pada, dipakai_24_jam,
 *   terakhir_galat, terakhir_galat_pada, utama_terakhir_galat,
 *   utama_terakhir_galat_pada}.
 * - admin_ai_cadangan_simpan(p_aktif boolean, p_model text). Galat:
 *   `model_tidak_dikenal` (hint model), `kunci_belum_ada` (hint aktif),
 *   `setelan_tidak_sah` (hint aktif, p_aktif null).
 * - admin_ai_cadangan_kunci(p_kunci text). Kosong atau null = hapus kunci dan
 *   matikan cadangan. Galat: `kunci_tidak_sah` (hint kunci). Kunci yang sah:
 *   awalan sk-ant- lalu huruf, angka, garis bawah, atau tanda hubung, panjang
 *   seluruhnya 27 sampai 307.
 * Galat isian memakai SQLSTATE 22023, pesan = kode di atas, hint = nama isian.
 * Izinnya sama dengan Paket kredit: membaca butuh cashflow:view, menulis
 * butuh cashflow:pii.
 *
 * KUNCI. Server tidak pernah memulangkan kunci, hanya sidiknya. Adapter ini
 * tetap berjaga: sidik yang rupanya seperti kunci dibuang, dan catatan galat
 * yang memuat sesuatu berawalan `sk-` disamarkan sebelum sampai ke layar.
 * Kunci yang diketik hanya hidup di memori halaman (useCashflowAiCadangan).
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state.
 */

/** Awalan kunci API penyedia cadangan. */
export const AWALAN_KUNCI = 'sk-ant-'
/** Batas panjang kunci, sama dengan server (awalan ikut dihitung). Server tetap penentu. */
export const KUNCI_MIN = 27
export const KUNCI_MAKS = 307
/** Catatan galat penyedia bisa panjang. Kartu status cukup memuat awalnya. */
export const GALAT_MAKS = 280
const PILIHAN_MAKS = 50
const POLA_SIDIK = /^[A-Za-z0-9:_-]{4,64}$/
/** Apa pun yang rupanya kunci penyedia (sk-…), di mana pun letaknya. */
const POLA_RUPA_KUNCI = /sk-[A-Za-z0-9_-]{8,}/g
export const KUNCI_DISAMARKAN = '[disamarkan]'

export const KODE_GALAT_CADANGAN = ['model_tidak_dikenal', 'kunci_belum_ada', 'kunci_tidak_sah', 'setelan_tidak_sah'] as const
export type KodeGalatCadangan = typeof KODE_GALAT_CADANGAN[number]

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
export interface AiCadanganDTO {
  aktif?: boolean | null
  model?: string | null
  model_pilihan?: string[] | null
  kunci_ada?: boolean | null
  kunci_sidik?: string | null
  kunci_diubah_pada?: string | null
  terakhir_dipakai_pada?: string | null
  dipakai_24_jam?: number | string | null
  terakhir_galat?: string | null
  terakhir_galat_pada?: string | null
  utama_terakhir_galat?: string | null
  utama_terakhir_galat_pada?: string | null
}

// ── Domain: bentuk yang dipakai halaman ──────────────────────────────────
export interface CatatanGalat { pesan: string; pada: string | null }
export interface AiCadangan {
  aktif: boolean
  /** Model yang dipakai cadangan. '' = belum dipilih. */
  model: string
  /** Pilihan dari server. Model yang sedang dipakai selalu ikut. */
  modelPilihan: string[]
  kunciAda: boolean
  /** Sidik kunci tersimpan. null = tidak dikirim, atau rupanya mencurigakan. */
  kunciSidik: string | null
  kunciDiubahPada: string | null
  terakhirDipakaiPada: string | null
  /** null = server tidak mengirim angkanya. */
  dipakai24Jam: number | null
  galatCadangan: CatatanGalat | null
  galatUtama: CatatanGalat | null
}

const teks = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
/** Cap waktu yang terbaca, atau null. */
const waktu = (v: unknown): string | null => {
  const t = teks(v)
  return t && !Number.isNaN(new Date(t).getTime()) ? t : null
}
const hitungan = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : Number.NaN
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null
}

/** Buang apa pun yang rupanya kunci dari sebuah teks. */
export function samarkanKunci(v: string): string {
  return v.replace(POLA_RUPA_KUNCI, KUNCI_DISAMARKAN)
}

/** Catatan galat untuk layar: satu baris, tanpa karakter kendali, tanpa kunci, dipotong. */
function catatan(pesan: unknown, pada: unknown): CatatanGalat | null {
  const rapi = samarkanKunci(teks(pesan).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim())
  if (!rapi) return null
  const huruf = [...rapi]
  return { pesan: huruf.length > GALAT_MAKS ? `${huruf.slice(0, GALAT_MAKS).join('')}…` : rapi, pada: waktu(pada) }
}

function sidik(v: unknown): string | null {
  const s = teks(v)
  return POLA_SIDIK.test(s) && !/^sk-/i.test(s) ? s : null
}

function pilihan(v: unknown, dipakai: string): string[] {
  const dari = Array.isArray(v) ? v.map(teks).filter(Boolean) : []
  const unik = [...new Set(dipakai ? [...dari, dipakai] : dari)]
  return unik.slice(0, PILIHAN_MAKS)
}

/**
 * Jawaban RPC → keadaan cadangan. null bila bentuknya tidak dikenal (bukan
 * objek, atau tanpa satu pun kunci kontrak): halaman membaca ulang, bukan
 * menampilkan keadaan karangan.
 */
export function keAiCadangan(dto: unknown): AiCadangan | null {
  if (!dto || typeof dto !== 'object' || Array.isArray(dto)) return null
  const d = dto as Record<string, unknown>
  if (!('aktif' in d) && !('kunci_ada' in d) && !('model_pilihan' in d)) return null
  const model = teks(d.model)
  const kunciAda = d.kunci_ada === true
  return {
    aktif: d.aktif === true,
    model,
    modelPilihan: pilihan(d.model_pilihan, model),
    kunciAda,
    kunciSidik: kunciAda ? sidik(d.kunci_sidik) : null,
    kunciDiubahPada: kunciAda ? waktu(d.kunci_diubah_pada) : null,
    terakhirDipakaiPada: waktu(d.terakhir_dipakai_pada),
    dipakai24Jam: hitungan(d.dipakai_24_jam),
    galatCadangan: catatan(d.terakhir_galat, d.terakhir_galat_pada),
    galatUtama: catatan(d.utama_terakhir_galat, d.utama_terakhir_galat_pada),
  }
}

// ── Setelan: nyala/mati dan model ────────────────────────────────────────
export interface IsianCadangan { aktif: boolean; model: string }

/** Isian awal form dari keadaan server. Model kosong jatuh ke pilihan pertama. */
export function isianDariKeadaan(k: AiCadangan): IsianCadangan {
  return { aktif: k.aktif, model: k.model || k.modelPilihan[0] || '' }
}

export type AlasanTakSimpan = 'kunciBelumAda' | 'modelKosong' | 'modelAsing' | 'tanpaPerubahan'

/**
 * Kenapa setelan belum bisa disimpan, atau null bila bisa. Menyalakan tanpa
 * kunci ditolak di sini lebih dulu supaya tombolnya mati dengan keterangan.
 * Server tetap penentu (`kunci_belum_ada`, `model_tidak_dikenal`, `setelan_tidak_sah`).
 */
export function alasanTakSimpan(k: AiCadangan, isian: IsianCadangan): AlasanTakSimpan | null {
  if (isian.aktif && !k.kunciAda) return 'kunciBelumAda'
  if (!isian.model) return 'modelKosong'
  if (!k.modelPilihan.includes(isian.model)) return 'modelAsing'
  if (isian.aktif === k.aktif && isian.model === k.model) return 'tanpaPerubahan'
  return null
}

// ── Kunci ────────────────────────────────────────────────────────────────
export type GalatKunci = 'kosong' | 'awalan' | 'spasi' | 'pendek' | 'panjang' | 'server'

/** Kunci yang dikirim: tanpa spasi di ujung (sering ikut saat menempel). */
export function rapikanKunci(v: string): string {
  return v.trim()
}

/** Periksa ringan sebelum dikirim. Sah tidaknya kunci tetap urusan server. */
export function periksaKunci(v: string): Exclude<GalatKunci, 'server'> | null {
  const k = rapikanKunci(v)
  if (!k) return 'kosong'
  if (/\s/.test(k)) return 'spasi'
  if (!k.startsWith(AWALAN_KUNCI)) return 'awalan'
  if (k.length < KUNCI_MIN) return 'pendek'
  if (k.length > KUNCI_MAKS) return 'panjang'
  return null
}

// ── Galat server ─────────────────────────────────────────────────────────
/** Kode galat kontrak dari pesan atau hint server. null = bukan galat kontrak. */
export function kodeGalatCadangan(g: { message?: unknown; hint?: unknown } | null | undefined): KodeGalatCadangan | null {
  const calon = [teks(g?.message), teks(g?.hint)]
  return KODE_GALAT_CADANGAN.find(k => calon.includes(k)) ?? null
}

/**
 * Teks galat yang aman ditampilkan: kunci yang baru dikirim dan apa pun yang
 * rupanya kunci dibuang. Dipakai lapisan RPC sebelum galat sampai ke halaman.
 */
export function tanpaKunci(pesan: string, kunci: string | null | undefined): string {
  const k = typeof kunci === 'string' ? rapikanKunci(kunci) : ''
  return samarkanKunci(k ? pesan.split(k).join(KUNCI_DISAMARKAN) : pesan)
}
