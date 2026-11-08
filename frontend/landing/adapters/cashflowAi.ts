/**
 * Asisten AI CashFlow: setelan penyedia, katalog model, effort, harga paket,
 * dan ringkasan pemakaian.
 *
 * KONTRAK RPC (dibandingkan dengan migrasi oleh tests/cashflow/ai-console.test.ts):
 * - admin_ai_setelan() returns jsonb dengan kunci app_config APA ADANYA,
 *   lengkap dengan awalan `ai_`:
 *   {ai_aktif, ai_provider, ai_base_url, ai_model_chat, ai_model_murah,
 *    ai_model_embed, ai_effort_chat, ai_effort_analisa, ai_effort_laporan,
 *    ai_kredit_gratis, ai_harga: {"30": 10000, ...}, ai_prompt_versi}.
 *   Awalan itu TIDAK dibuang di server, jadi adapter yang membacanya.
 * - admin_ai_setelan_simpan(p jsonb) menerima kunci BERAWALAN `ai_` yang
 *   sama (fungsi menolak kunci lain dengan 22023) dan menuntut
 *   cashflow:pii. nilaiSimpanAi() merakit bentuk itu.
 * - admin_ai_ringkas() returns jsonb BERSARANG:
 *   {kredit: {pengguna, beredar, terpakai, gratis, beli, kembali},
 *    pemakaian: {percakapan, pesan, token_masuk, token_keluar, biaya,
 *                pesan_30hari},
 *    pembelian: {...}, mcp: {...}}.
 *   biaya numeric bisa pulang sebagai string.
 *
 * KUNCI PENYEDIA. OPENAI_API_KEY hanya hidup di env server
 * (server/api/console/ai/models.get.ts dan uji.post.ts). Adapter ini dan
 * peramban tidak pernah memegang atau menerimanya. Katalog dari route hanya
 * berisi id model, tanda model penalaran, dan daftar effort yang sah.
 *
 * Model dianggap punya effort bila id-nya berawalan gpt-5, gpt-6, o1, o3,
 * atau o4 (spek November 2026). Selain itu `alasan` false dan `effort` kosong.
 *
 * Fungsi MURNI semua: tanpa jaringan, tanpa state, aman dipakai klien dan
 * server Nitro sekaligus.
 */

/** Penyedia yang didukung. Satu dulu, kunci lain menyusul. */
export const PENYEDIA_AI = ['openai'] as const
export type PenyediaAi = typeof PENYEDIA_AI[number]
export const PENYEDIA_AI_BAWAAN: PenyediaAi = 'openai'

/** Base URL bawaan bila setelan belum diisi atau bentuknya tidak sah. */
export const BASE_URL_AI_BAWAAN = 'https://api.openai.com/v1'

/** Model bawaan (spek November 2026). */
export const MODEL_CHAT_AI_BAWAAN = 'gpt-6.1-sol'
export const MODEL_MURAH_AI_BAWAAN = 'gpt-5.4-nano'
export const MODEL_EMBED_AI_BAWAAN = 'text-embedding-3-small'

/** Tingkat effort yang dikenal Responses API untuk model penalaran. */
export const EFFORT_AI = ['minimal', 'low', 'medium', 'high'] as const
export type EffortAi = typeof EFFORT_AI[number]

/** Effort bawaan per keperluan. */
export const EFFORT_CHAT_AI_BAWAAN: EffortAi = 'low'
export const EFFORT_ANALISA_AI_BAWAAN: EffortAi = 'medium'
export const EFFORT_LAPORAN_AI_BAWAAN: EffortAi = 'high'

/** Awalan id model yang menerima parameter reasoning.effort. */
export const AWALAN_EFFORT_AI = ['gpt-5', 'gpt-6', 'o1', 'o3', 'o4'] as const

/** Paket kredit: jumlah kredit, urut naik (dipakai juga sebagai kunci harga JSON). */
export const PAKET_KREDIT = ['30', '100', '300'] as const
export type PaketKredit = typeof PAKET_KREDIT[number]

/** Harga bawaan dalam rupiah. Kunci sama dengan kunci kredit pada ai_harga. */
export const HARGA_AI_BAWAAN: Readonly<Record<PaketKredit, number>> = { 30: 10000, 100: 25000, 300: 60000 }

/** Kredit gratis sekali untuk pengguna baru. */
export const KREDIT_GRATIS_AI_BAWAAN = 10
/** Versi prompt yang tercatat di app_config; halaman hanya menampilkannya. */
export const PROMPT_VERSI_AI_BAWAAN = 1

/** Batas jawaban uji di layar dan di route (aksara, bukan byte). */
export const BATAS_JAWABAN_UJI = 200
/**
 * Satu kalimat pendek yang dikirim route uji. Tetap di server: admin tidak
 * bisa memakai tombol uji untuk mengirim prompt bebas dan menghabiskan kuota.
 */
export const KALIMAT_UJI = 'Jawab dalam satu kalimat: apa itu anggaran bulanan?'

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
/** bigint dan numeric bisa pulang sebagai string. */
type Angka = number | string | null
export interface SetelanAiDTO {
  ai_aktif?: boolean | null
  ai_provider?: string | null
  ai_base_url?: string | null
  ai_model_chat?: string | null
  ai_model_murah?: string | null
  ai_model_embed?: string | null
  ai_effort_chat?: string | null
  ai_effort_analisa?: string | null
  ai_effort_laporan?: string | null
  ai_kredit_gratis?: Angka
  ai_harga?: Partial<Record<PaketKredit, Angka>> | null
  ai_prompt_versi?: Angka
}
/** Bentuk `admin_ai_ringkas()`: empat kelompok, bukan angka datar. */
export interface RingkasAiDTO {
  kredit?: { beredar?: Angka; pengguna?: Angka; terpakai?: Angka } | null
  pemakaian?: {
    percakapan?: Angka; pesan?: Angka; token_masuk?: Angka; token_keluar?: Angka;
    biaya?: Angka; pesan_30hari?: Angka;
  } | null
  pembelian?: { lunas?: Angka; nominal_lunas?: Angka; menunggu?: Angka } | null
  mcp?: { token_aktif?: Angka; token_dicabut?: Angka } | null
}
export interface KatalogAiDTO {
  daftar?: unknown
  sumber?: string | null
  belum_terkonfigurasi?: boolean | null
  galat?: string | null
}
export interface HasilUjiAiDTO {
  waktu_ms?: Angka
  jawaban?: string | null
  dipotong?: boolean | null
  model?: string | null
  effort?: string | null
}

// ── Domain ───────────────────────────────────────────────────────────────
export interface HargaAi { 30: number; 100: number; 300: number }
export interface SetelanAi {
  aktif: boolean
  provider: string
  baseUrl: string
  modelChat: string
  modelMurah: string
  modelEmbed: string
  effortChat: EffortAi
  effortAnalisa: EffortAi
  effortLaporan: EffortAi
  kreditGratis: number
  harga: HargaAi
  promptVersi: number
}
export interface RingkasAi {
  /** Semua pesan tercatat, user dan asisten. */
  pesan: number
  tokenMasuk: number
  tokenKeluar: number
  /** tokenMasuk + tokenKeluar. */
  token: number
  biaya: number
  saldoBeredar: number
}
export interface ModelAi {
  id: string
  /** Model penalaran: menerima effort minimal, low, medium, high. */
  alasan: boolean
  /** Daftar effort yang sah; kosong bila model tidak memakai effort. */
  effort: EffortAi[]
}
export interface KatalogAi {
  daftar: ModelAi[]
  sumber: 'penyedia' | 'bawaan'
  /** Kunci penyedia belum dipasang di server. */
  belumTerkonfigurasi: boolean
  /** Keterangan jujur saat katalog penyedia gagal dibaca (bukan kunci). */
  galat: string | null
}
export interface HasilUjiAi {
  waktuMs: number
  jawaban: string
  dipotong: boolean
  model: string | null
  effort: EffortAi | null
}

// ── Pembantu bentuk ──────────────────────────────────────────────────────
const teksIsi = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null
const bulat = (v: Angka | undefined, min: number, maks: number, bawaan: number): number => {
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) return bawaan
  const b = Math.trunc(n)
  return b >= min && b <= maks ? b : bawaan
}
const pilihan = <T extends string>(daftar: readonly T[], v: unknown): T | null =>
  (typeof v === 'string' && (daftar as readonly string[]).includes(v) ? v as T : null)
/** Angka pecahan (biaya rupiah): numeric(14,6), jangan dipotong jadi bulat. */
const desimal = (v: Angka | undefined, min: number, maks: number, bawaan: number): number => {
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) return bawaan
  return n >= min && n <= maks ? Math.round(n * 1e6) / 1e6 : bawaan
}

/** Model ini menerima effort? Aturan awalan id (spek November 2026). */
export function punyaEffortAi(id: string): boolean {
  const v = (id ?? '').trim().toLowerCase()
  return !!v && AWALAN_EFFORT_AI.some(a => v.startsWith(a))
}

/** Effort yang sah untuk model; kosong bila model tidak memakai effort. */
export function effortUntukModel(id: string): EffortAi[] {
  return punyaEffortAi(id) ? [...EFFORT_AI] : []
}

const modelAi = (id: string): ModelAi => ({ id, alasan: punyaEffortAi(id), effort: effortUntukModel(id) })

/** Daftar bawaan saat katalog penyedia belum bisa dibaca. */
export const MODEL_AI_BAWAAN: readonly ModelAi[] = [
  modelAi(MODEL_CHAT_AI_BAWAAN),
  modelAi(MODEL_MURAH_AI_BAWAAN),
  modelAi(MODEL_EMBED_AI_BAWAAN),
]

/** Base URL http(s) tanpa kredensial di dalamnya. */
export function baseUrlAiSah(v: string): boolean {
  const t = (v ?? '').trim()
  if (!t || t.length > 300) return false
  try {
    const u = new URL(t)
    return (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password
  } catch {
    return false
  }
}

/** Base URL tanpa garis miring di ujung; bawaan bila kosong/bentuknya salah. */
export function baseUrlAiBersih(v: string): string {
  const t = (v ?? '').trim().replace(/\/+$/, '')
  return baseUrlAiSah(t) ? t : BASE_URL_AI_BAWAAN
}

/** Id model: tanpa spasi, panjang wajar. Model fine-tune memakai ':' dan '/'. */
export function modelAiSah(v: string): boolean {
  const t = (v ?? '').trim()
  return /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/.test(t)
}

/** Harga rupiah: bilangan bulat 1..100 juta. Nol ditolak karena SQL
 *  (`admin_ai_setelan_simpan`) menolak harga <= 0 dengan 22023. */
export const hargaAiSah = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 100_000_000

/** Kredit gratis: bilangan bulat 0..1.000. */
export const kreditGratisAiSah = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1_000

// ── Setelan ──────────────────────────────────────────────────────────────
export function keSetelanAi(d: SetelanAiDTO | null | undefined): SetelanAi {
  const base = teksIsi(d?.ai_base_url)
  const model = (v: unknown, bawaan: string): string => {
    const t = teksIsi(v)
    return t && modelAiSah(t) ? t : bawaan
  }
  const harga = (p: PaketKredit) =>
    bulat(d?.ai_harga?.[p] ?? undefined, 1, 100_000_000, HARGA_AI_BAWAAN[p])
  return {
    aktif: d?.ai_aktif === true,
    provider: teksIsi(d?.ai_provider) ?? PENYEDIA_AI_BAWAAN,
    baseUrl: base && baseUrlAiSah(base) ? base.replace(/\/+$/, '') : BASE_URL_AI_BAWAAN,
    modelChat: model(d?.ai_model_chat, MODEL_CHAT_AI_BAWAAN),
    modelMurah: model(d?.ai_model_murah, MODEL_MURAH_AI_BAWAAN),
    modelEmbed: model(d?.ai_model_embed, MODEL_EMBED_AI_BAWAAN),
    effortChat: pilihan(EFFORT_AI, d?.ai_effort_chat) ?? EFFORT_CHAT_AI_BAWAAN,
    effortAnalisa: pilihan(EFFORT_AI, d?.ai_effort_analisa) ?? EFFORT_ANALISA_AI_BAWAAN,
    effortLaporan: pilihan(EFFORT_AI, d?.ai_effort_laporan) ?? EFFORT_LAPORAN_AI_BAWAAN,
    kreditGratis: bulat(d?.ai_kredit_gratis, 0, 1_000, KREDIT_GRATIS_AI_BAWAAN),
    harga: { 30: harga('30'), 100: harga('100'), 300: harga('300') },
    promptVersi: bulat(d?.ai_prompt_versi, 1, 1_000_000, PROMPT_VERSI_AI_BAWAAN),
  }
}

/**
 * Nilai yang dikirim ke admin_ai_setelan_simpan(p). Kunci mengikuti nama
 * kolom app_config APA ADANYA, termasuk awalan `ai_`: fungsi SQL menolak
 * kunci lain dengan 22023. Harga tetap objek berkunci teks "30", "100", "300".
 */
export function nilaiSimpanAi(s: SetelanAi): Record<string, unknown> {
  return {
    ai_aktif: s.aktif === true,
    ai_provider: s.provider.trim() || PENYEDIA_AI_BAWAAN,
    ai_base_url: baseUrlAiBersih(s.baseUrl),
    ai_model_chat: s.modelChat.trim(),
    ai_model_murah: s.modelMurah.trim(),
    ai_model_embed: s.modelEmbed.trim(),
    ai_effort_chat: s.effortChat,
    ai_effort_analisa: s.effortAnalisa,
    ai_effort_laporan: s.effortLaporan,
    ai_kredit_gratis: Math.trunc(s.kreditGratis),
    ai_harga: { 30: Math.trunc(s.harga[30]), 100: Math.trunc(s.harga[100]), 300: Math.trunc(s.harga[300]) },
    ai_prompt_versi: Math.trunc(s.promptVersi),
  }
}

/** Setelan sama persis dengan yang tersimpan? Dasar tombol Simpan. */
export const samaSetelanAi = (a: SetelanAi, b: SetelanAi): boolean =>
  JSON.stringify(nilaiSimpanAi(a)) === JSON.stringify(nilaiSimpanAi(b))

// ── Ringkasan pemakaian ──────────────────────────────────────────────────
export function keRingkasAi(d: RingkasAiDTO | null | undefined): RingkasAi {
  const pakai = d?.pemakaian
  const kredit = d?.kredit
  const masuk = bulat(pakai?.token_masuk, 0, Number.MAX_SAFE_INTEGER, 0)
  const keluar = bulat(pakai?.token_keluar, 0, Number.MAX_SAFE_INTEGER, 0)
  return {
    pesan: bulat(pakai?.pesan, 0, Number.MAX_SAFE_INTEGER, 0),
    tokenMasuk: masuk,
    tokenKeluar: keluar,
    token: masuk + keluar,
    biaya: desimal(pakai?.biaya, 0, Number.MAX_SAFE_INTEGER, 0),
    saldoBeredar: bulat(kredit?.beredar, 0, Number.MAX_SAFE_INTEGER, 0),
  }
}

// ── Katalog model ────────────────────────────────────────────────────────
/** Larik model dari jawaban penyedia: {data:[…]}, {models:[…]}, atau larik. */
function larikModel(j: unknown): unknown[] {
  if (Array.isArray(j)) return j
  if (j && typeof j === 'object') {
    const o = j as { data?: unknown; models?: unknown }
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.models)) return o.models
  }
  return []
}

/** Daftar ternormalisasi {id, alasan, effort}; duplikat dibuang, urut id. */
export function normalkanDaftarModel(j: unknown): ModelAi[] {
  const dilihat = new Set<string>()
  const hasil: ModelAi[] = []
  for (const x of larikModel(j)) {
    const id = typeof x === 'string' ? x.trim() : (x && typeof x === 'object' ? teksIsi((x as { id?: unknown }).id) : null)
    if (!id || dilihat.has(id)) continue
    dilihat.add(id)
    hasil.push(modelAi(id))
  }
  return hasil.sort((a, b) => a.id.localeCompare(b.id))
}

/** Jawaban route models → domain. Daftar kosong/rusak jatuh ke daftar bawaan. */
export function keKatalogAi(d: KatalogAiDTO | null | undefined): KatalogAi {
  const daftar = normalkanDaftarModel(d?.daftar)
  return {
    daftar: daftar.length ? daftar : MODEL_AI_BAWAAN.map(m => ({ ...m, effort: [...m.effort] })),
    sumber: d?.sumber === 'penyedia' ? 'penyedia' : 'bawaan',
    belumTerkonfigurasi: d?.belum_terkonfigurasi === true,
    galat: teksIsi(d?.galat),
  }
}

// ── Uji koneksi ──────────────────────────────────────────────────────────
/** Teks jawaban dari badan Responses API (output_text atau output[].content[].text). */
export function teksDariRespons(j: unknown): string {
  if (!j || typeof j !== 'object') return ''
  const o = j as { output_text?: unknown; output?: unknown }
  if (typeof o.output_text === 'string' && o.output_text.trim()) return o.output_text.trim()
  const bagian = Array.isArray(o.output) ? o.output : []
  return bagian
    .flatMap(x => (x && typeof x === 'object' && Array.isArray((x as { content?: unknown }).content)
      ? (x as { content: unknown[] }).content : []))
    .filter(c => c && typeof c === 'object' && typeof (c as { text?: unknown }).text === 'string')
    .map(c => (c as { text: string }).text)
    .join(' ')
    .trim()
}

/** Rapikan dan potong jawaban ke batas aksara (titik kode, bukan byte). */
export function potongJawabanAi(teks: string, maks: number = BATAS_JAWABAN_UJI): { teks: string; dipotong: boolean } {
  const rapi = String(teks ?? '').replace(/\s+/g, ' ').trim()
  const titik = Array.from(rapi)
  if (titik.length <= maks) return { teks: rapi, dipotong: false }
  return { teks: titik.slice(0, maks).join(''), dipotong: true }
}

/** Pesan penyedia yang aman ditampilkan: tanpa kunci/token, satu baris, pendek. */
export function pesanAmanAi(v: unknown, maks = 240): string {
  return String(v ?? '')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{8,}/gi, '[kunci disembunyikan]')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, '[kunci disembunyikan]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maks)
}

export function keHasilUjiAi(d: HasilUjiAiDTO | null | undefined): HasilUjiAi {
  const { teks, dipotong } = potongJawabanAi(typeof d?.jawaban === 'string' ? d.jawaban : '')
  return {
    waktuMs: bulat(d?.waktu_ms, 0, 600_000, 0),
    jawaban: teks,
    dipotong: d?.dipotong === true || dipotong,
    model: teksIsi(d?.model),
    effort: pilihan(EFFORT_AI, d?.effort),
  }
}

/** Kode galat route uji yang punya kalimat sendiri di kamus. */
export const KODE_GALAT_UJI_AI = [
  'masukan', 'lintas-situs', 'tanpa-header-konsol', 'ikatan', 'tanpa-cookie', 'cookie-ditolak',
  'tanpa-izin', 'gateway-gagal', 'belum-terkonfigurasi', 'penyedia-gagal', 'kunci-ditolak',
  'batas-penyedia', 'model-ditolak', 'jawaban-kosong', 'waktu-habis', 'penyedia-tidak-terjangkau', 'dibatasi', 'jaringan',
] as const
export type KodeGalatUjiAi = typeof KODE_GALAT_UJI_AI[number]

const KODE_SAH = new Set<string>(KODE_GALAT_UJI_AI)
const kodeDikenal = (v: unknown): v is KodeGalatUjiAi => typeof v === 'string' && KODE_SAH.has(v)

/**
 * Galat $fetch route uji → kode kamus + detail penyedia yang aman.
 * `e.data.statusMessage` datang dari Nitro (badan JSON); `e.statusMessage`
 * dipakai saat statusText kosong di HTTP/2; tanpa keduanya = jaringan.
 */
export function sebabGalatUjiAi(e: unknown): { kode: KodeGalatUjiAi; detail: string } {
  const g = (e ?? {}) as {
    status?: unknown; statusCode?: unknown; statusMessage?: unknown
    data?: { statusMessage?: unknown; message?: unknown; data?: { pesan?: unknown; message?: unknown } }
  }
  const status = typeof g.status === 'number' ? g.status : (typeof g.statusCode === 'number' ? g.statusCode : null)
  const kodeMentah = g.data?.statusMessage ?? g.statusMessage
  const kode = kodeDikenal(kodeMentah)
    ? kodeMentah
    : status === 401 || status === 403 ? 'tanpa-izin'
      : status === 429 ? 'batas-penyedia'
        : status === 400 ? 'masukan'
          : status && status >= 500 ? 'penyedia-gagal'
            : 'jaringan'
  const detail = pesanAmanAi(g.data?.data?.pesan ?? g.data?.data?.message ?? g.data?.message ?? '')
  return { kode, detail }
}
