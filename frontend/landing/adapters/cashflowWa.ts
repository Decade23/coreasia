/**
 * Status WhatsApp OTP di console (admin_wa_status, migrasi 20261110120000,
 * diperluas 20261113150000 untuk cara terbalik).
 *
 * Bentuk jawaban server dipetakan di sini, supaya komponen hanya tahu empat
 * keadaan: sehat, sebagian, gangguan, atau nonaktif. Kode gangguan yang belum
 * dikenal tetap dihitung gangguan, bukan hilang diam-diam.
 *
 * DUA BENTUK SERVER. Sebelum migrasi cara terbalik, jawaban hanya punya kunci
 * lama dan `gangguan` adalah satu-satunya sumber keadaan. Sesudahnya ada kunci
 * `mode`, `lapis`, `cara_sehat`, dan seterusnya. Kunci yang tidak ada berarti
 * bagian itu disembunyikan (nilainya null di domain), bukan galat.
 *
 * Dengan kunci baru, keadaan dihitung dari cara yang sehat: tanpa cara sehat
 * berarti gangguan (pengguna baru lewat dengan email), satu cara sakit di
 * mode keduanya berarti sebagian. Lapis cara yang tidak dipakai mode sekarang
 * tidak ikut jadi sebab, sama dengan riwayat gangguan di server.
 *
 * Status WhatsApp per akun di daftar pengguna (admin_daftar_pengguna_v3) juga
 * dipetakan di sini: keStatusWaAkun.
 */
import { tanggalPendek, type BahasaWaktu } from './cashflowWaktu'

// ── Kode yang dikirim server ─────────────────────────────────────────────
/** Nilai sakelar nomor_wa.mode (nomor_wa_sakelar_lengkap_inti). */
export const MODE_WA = ['kirim', 'terbalik', 'keduanya', 'mati'] as const
export type ModeWa = typeof MODE_WA[number] | 'lain'
/** Cara verifikasi, urutan server: terbalik dulu (nomor_wa_cara_inti). */
export const CARA_WA = ['terbalik', 'kirim'] as const
export type CaraWa = typeof CARA_WA[number]
/** Lapis per kelompok (nomor_wa_lapis_inti dan nomor_wa_lapis_masuk_inti). */
export const LAPIS_WA = {
  bersama: ['darurat', 'sesi', 'basi'],
  kirim: ['kirim', 'tak_diketik', 'batas'],
  masuk: ['tanpa_tujuan', 'masuk_belum_ada', 'masuk_tertahan', 'tak_masuk', 'batas_masuk'],
} as const
export const KELOMPOK_LAPIS_WA = ['bersama', 'kirim', 'masuk'] as const
export type KelompokLapisWa = typeof KELOMPOK_LAPIS_WA[number]
/** Semua kode gangguan. `mode_mati` hanya muncul di riwayat gangguan dan
 *  sebagai sebab saat mode Mati, bukan sebagai lapis. */
export const KODE_GANGGUAN_WA = [...LAPIS_WA.bersama, ...LAPIS_WA.kirim, ...LAPIS_WA.masuk, 'mode_mati'] as const
export type KodeGangguanWa = typeof KODE_GANGGUAN_WA[number] | 'lain'
export const STATUS_SESI_WA = ['connected', 'connecting', 'disconnected', 'unknown', 'reconnecting', 'pairing',
  'logged_out', 'replaced', 'wrong_number', 'stopped', 'tak_terjangkau', 'lain'] as const
/** Hasil pesan masuk 24 jam (masuk_24j), urut tampil. */
export const ANGKA_MASUK_WA = ['dibuat', 'pesan', 'berhasil', 'beda', 'tanpa_nomor', 'lid', 'habis', 'kedaluwarsa',
  'tak_dikenal', 'batas'] as const
export type AngkaMasukWa = typeof ANGKA_MASUK_WA[number]
/** Hitungan pengguna (pengguna), urut tampil. */
export const ANGKA_PENGGUNA_WA = ['terverifikasi_masuk', 'terverifikasi_kirim', 'lewat_gangguan_7h', 'kredit_ditahan',
  'nomor_ramai_30h'] as const
export type AngkaPenggunaWa = typeof ANGKA_PENGGUNA_WA[number]

// ── DTO: persis seperti yang dipulangkan RPC ─────────────────────────────
export interface WaModeDTO {
  mode: string | null; uji_mode: string | null; tujuan_tersamar: string | null; balas: boolean | null
  ambang_tak_masuk: number | null; batas_harian_masuk: number | null
  /** Sakelar tahan kredit gratis saat gangguan (bawaan false). Tidak ada di
   *  versi migrasi yang lebih awal. */
  tahan_kredit?: boolean | null
}
export interface WaLapisDTO { bersama: string[] | null; kirim: string[] | null; masuk: string[] | null }
export interface WaMasukSapaDTO {
  ada: boolean | null; aktif: boolean | null; tertahan: number | null; tertua_detik: number | null
  terakhir_ok: string | null; dicek_pada: string | null
}
export type WaMasuk24jDTO = Record<AngkaMasukWa, number | null>
export interface WaJendelaDTO { mulai: string; selesai: string | null; lapis: string[] | null; wajib: boolean | null }
export type WaPenggunaDTO = Record<AngkaPenggunaWa, number | null>

export interface WaStatusDTO {
  sekarang: string
  sesi: { status: string | null; sejak: string | null; dicek_pada: string | null; galat: string | null } | null
  gangguan: string[] | null
  kirim_gangguan_sampai: string | null
  otp: { aktif: boolean; wajib: boolean; darurat: boolean }
  batas: { terpakai_hari_ini: number; harian: number }
  kiriman_24j: { diminta: number; terkirim: number; gagal: number; tanpa_wa: number; diketik: number }
  sebab_gagal_24j: { sebab: string; jumlah: number }[] | null
  terkirim_terakhir: string | null
  // 20261113150000. Tidak ada di server yang belum memasang migrasinya.
  mode?: WaModeDTO | null
  lapis?: WaLapisDTO | null
  cara_sehat?: string[] | null
  masuk_sapa?: WaMasukSapaDTO | null
  masuk_24j?: WaMasuk24jDTO | null
  masuk_batas?: { terpakai_hari_ini: number | null; harian: number | null } | null
  jendela_7h?: WaJendelaDTO[] | null
  pengguna?: WaPenggunaDTO | null
}

// ── Domain ───────────────────────────────────────────────────────────────
export type TingkatWa = 'sehat' | 'sebagian' | 'gangguan' | 'nonaktif'
export type KeadaanCaraWa = 'sehat' | 'sakit' | 'diluarMode'
export type SatuanLama = 'detik' | 'menit' | 'jam' | 'hari'
export interface LamaWa { n: number; satuan: SatuanLama }

export interface LapisKelompokWa {
  kelompok: KelompokLapisWa
  kode: KodeGangguanWa[]
  /** false = cara kelompok ini tidak dipakai mode sekarang, jadi tidak
   *  memengaruhi pengguna. Bersama selalu berpengaruh. */
  berpengaruh: boolean
}
export interface JendelaWa {
  mulai: string
  selesai: string | null
  /** Jendela belum ditutup: gangguan masih berlangsung. */
  berlangsung: boolean
  lama: LamaWa
  lapis: KodeGangguanWa[]
  /** OTP wajib saat itu: akun baru di jendela ini lewat tanpa nomor. */
  wajib: boolean
}
export interface SapaMasukWa {
  /** false = Sapa belum melaporkan bagian pesan masuk sama sekali. */
  ada: boolean
  aktif: boolean | null
  tertahan: number
  tertua: LamaWa | null
  tertuaDetik: number | null
  terakhirOk: string | null
  dicekPada: string | null
}
/** Bagian cara terbalik. Setiap bagian null bila kuncinya tidak dikirim server. */
export interface CaraVerifikasiWa {
  mode: {
    mode: ModeWa
    /** Mode khusus akun uji; null = ikut mode umum. */
    ujiMode: ModeWa | null
    tujuanTersamar: string | null
    balas: boolean
    /** Kredit gratis akun yang lewat saat gangguan ditahan. null = server
     *  tidak mengirim sakelarnya (baris disembunyikan). */
    tahanKredit: boolean | null
  } | null
  /** Keadaan tiap cara untuk klien penuh di mode umum, urutan server. */
  cara: Array<{ cara: CaraWa; keadaan: KeadaanCaraWa }> | null
  lapis: LapisKelompokWa[] | null
  sapa: SapaMasukWa | null
  angka24j: Record<AngkaMasukWa, number> | null
  batasMasuk: { terpakai: number; harian: number | null } | null
  jendela: JendelaWa[] | null
  pengguna: Record<AngkaPenggunaWa, number> | null
}

export interface StatusWa {
  tingkat: TingkatWa
  /** Pengguna baru sedang melewati OTP karena gangguan. */
  lewatOtp: boolean
  sebab: KodeGangguanWa[]
  /** Kunci label status sesi, selalu ada di kamus. */
  statusSesi: string
  sejak: string | null
  dicekPada: string | null
  otp: 'wajib' | 'tidakWajib' | 'mati'
  batas: { terpakai: number; harian: number }
  kiriman: WaStatusDTO['kiriman_24j']
  sebabGagal: { sebab: string; jumlah: number }[]
  terkirimTerakhir: string | null
  /** Ambang lapis tak_masuk (bawaan server 8), untuk kalimat sebabnya. */
  ambangTakMasuk: number
  /** null = server belum memasang cara terbalik (bentuk lama). */
  cara: CaraVerifikasiWa | null
}

// ── Pembantu ─────────────────────────────────────────────────────────────
const kodeSebab = (k: string): KodeGangguanWa => ((KODE_GANGGUAN_WA as readonly string[]).includes(k) ? k as KodeGangguanWa : 'lain')
const kodeMode = (k: unknown): ModeWa => ((MODE_WA as readonly unknown[]).includes(k) ? k as ModeWa : 'lain')
const larik = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const unik = <T>(xs: T[]): T[] => [...new Set(xs)]
const bilangan = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : Number.NaN
  return Number.isFinite(n) ? n : 0
}
const bilanganAtauNull = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)
const objek = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Detik → angka bulat dan satuan terbesar yang masih ≥ 1. Kalimatnya milik kamus. */
export function lamaDari(detik: number): LamaWa {
  const d = Math.max(0, Math.round(detik))
  if (d < 60) return { n: d, satuan: 'detik' }
  if (d < 3600) return { n: Math.round(d / 60), satuan: 'menit' }
  if (d < 86400 * 2) return { n: Math.round(d / 3600), satuan: 'jam' }
  return { n: Math.round(d / 86400), satuan: 'hari' }
}

/** Cara yang dipakai sebuah mode. Mode tak dikenal dianggap memakai semua,
 *  supaya lapisnya tidak hilang dari sebab. */
export function caraDalamMode(mode: ModeWa): CaraWa[] {
  if (mode === 'kirim') return ['kirim']
  if (mode === 'terbalik') return ['terbalik']
  if (mode === 'mati') return []
  return ['terbalik', 'kirim']
}
const KELOMPOK_CARA: Record<CaraWa, KelompokLapisWa> = { terbalik: 'masuk', kirim: 'kirim' }

function keCara(d: WaStatusDTO): CaraVerifikasiWa | null {
  const adaBaru = ['mode', 'lapis', 'cara_sehat', 'masuk_sapa', 'masuk_24j', 'masuk_batas', 'jendela_7h', 'pengguna']
    .some(k => (d as unknown as Record<string, unknown>)[k] !== undefined)
  if (!adaBaru) return null
  const m = objek(d.mode) ? d.mode : null
  const mode = m ? kodeMode(m.mode) : null
  const caraSehat = Array.isArray(d.cara_sehat) ? larik(d.cara_sehat) : null
  const dipakai = mode ? caraDalamMode(mode) : null
  const l = objek(d.lapis) ? d.lapis : null
  const s = objek(d.masuk_sapa) ? d.masuk_sapa : null
  const a = objek(d.masuk_24j) ? d.masuk_24j : null
  const b = objek(d.masuk_batas) ? d.masuk_batas : null
  const p = objek(d.pengguna) ? d.pengguna : null
  const sekarang = Date.parse(d.sekarang)
  return {
    mode: m && mode ? {
      mode,
      ujiMode: m.uji_mode === null || m.uji_mode === undefined ? null : kodeMode(m.uji_mode),
      tujuanTersamar: typeof m.tujuan_tersamar === 'string' && m.tujuan_tersamar.trim() ? m.tujuan_tersamar : null,
      balas: m.balas === true,
      tahanKredit: typeof m.tahan_kredit === 'boolean' ? m.tahan_kredit : null,
    } : null,
    cara: mode && caraSehat && dipakai
      ? CARA_WA.map(c => ({ cara: c, keadaan: (caraSehat.includes(c) ? 'sehat' : dipakai.includes(c) ? 'sakit' : 'diluarMode') as KeadaanCaraWa }))
      : null,
    lapis: l ? KELOMPOK_LAPIS_WA.map(k => ({
      kelompok: k,
      kode: unik(larik(l[k]).map(kodeSebab)),
      berpengaruh: k === 'bersama' || !dipakai || dipakai.some(c => KELOMPOK_CARA[c] === k),
    })) : null,
    sapa: s ? {
      ada: s.ada === true,
      aktif: typeof s.aktif === 'boolean' ? s.aktif : null,
      tertahan: bilangan(s.tertahan),
      tertua: bilanganAtauNull(s.tertua_detik) === null ? null : lamaDari(bilangan(s.tertua_detik)),
      tertuaDetik: bilanganAtauNull(s.tertua_detik),
      terakhirOk: s.terakhir_ok ?? null,
      dicekPada: s.dicek_pada ?? null,
    } : null,
    angka24j: a ? Object.fromEntries(ANGKA_MASUK_WA.map(k => [k, bilangan(a[k])])) as Record<AngkaMasukWa, number> : null,
    batasMasuk: b ? { terpakai: bilangan(b.terpakai_hari_ini), harian: bilanganAtauNull(b.harian) } : null,
    jendela: Array.isArray(d.jendela_7h) ? d.jendela_7h.filter(objek).map((j) => {
      const mulai = Date.parse(j.mulai)
      const ujung = j.selesai ? Date.parse(j.selesai) : sekarang
      return {
        mulai: j.mulai,
        selesai: j.selesai ?? null,
        berlangsung: !j.selesai,
        lama: lamaDari(Number.isFinite(mulai) && Number.isFinite(ujung) ? (ujung - mulai) / 1000 : 0),
        lapis: unik(larik(j.lapis).map(kodeSebab)),
        wajib: j.wajib === true,
      }
    }) : null,
    pengguna: p ? Object.fromEntries(ANGKA_PENGGUNA_WA.map(k => [k, bilangan(p[k])])) as Record<AngkaPenggunaWa, number> : null,
  }
}

export function keStatusWa(d: WaStatusDTO): StatusWa {
  const cara = keCara(d)
  const nonaktif = !d.otp.aktif
  const status = d.sesi?.status ?? null
  const caraSehat = Array.isArray(d.cara_sehat) ? larik(d.cara_sehat) : null
  let tingkat: TingkatWa
  let sebab: KodeGangguanWa[]
  let lewatOtp: boolean
  if (caraSehat && cara?.lapis) {
    // Bentuk baru: sebab = lapis bersama, mode mati, dan lapis cara yang dipakai mode.
    const mode = cara.mode?.mode ?? 'lain'
    sebab = unik([
      ...(mode === 'mati' ? ['mode_mati' as const] : []),
      ...cara.lapis.filter(k => k.berpengaruh).flatMap(k => k.kode),
    ])
    tingkat = nonaktif ? 'nonaktif' : caraSehat.length === 0 ? 'gangguan' : sebab.length ? 'sebagian' : 'sehat'
    lewatOtp = !nonaktif && d.otp.wajib && caraSehat.length === 0
  } else {
    sebab = unik((d.gangguan ?? []).map(kodeSebab))
    tingkat = nonaktif ? 'nonaktif' : sebab.length ? 'gangguan' : 'sehat'
    lewatOtp = !nonaktif && d.otp.wajib && sebab.length > 0
  }
  return {
    tingkat,
    lewatOtp,
    sebab,
    statusSesi: status === null ? 'kosong' : (STATUS_SESI_WA as readonly string[]).includes(status) ? status : 'lain',
    sejak: d.sesi?.sejak ?? null,
    dicekPada: d.sesi?.dicek_pada ?? null,
    otp: nonaktif ? 'mati' : d.otp.wajib ? 'wajib' : 'tidakWajib',
    batas: { terpakai: d.batas.terpakai_hari_ini, harian: d.batas.harian },
    kiriman: d.kiriman_24j,
    sebabGagal: d.sebab_gagal_24j ?? [],
    terkirimTerakhir: d.terkirim_terakhir,
    ambangTakMasuk: bilanganAtauNull(d.mode?.ambang_tak_masuk) ?? 8,
    cara,
  }
}

/**
 * Angka yang dibutuhkan kalimat sebab sebuah kode (kalimatnya milik kamus,
 * kesehatan.wa.sebab). Kode tanpa angka: larik kosong. `sesi` memakai label
 * status sesi, jadi dirakit komponen.
 */
export function angkaSebabWa(k: KodeGangguanWa, s: StatusWa): number[] {
  if (k === 'batas') return [s.batas.terpakai, s.batas.harian]
  if (k === 'batas_masuk') return [s.cara?.batasMasuk?.terpakai ?? 0, s.cara?.batasMasuk?.harian ?? 0]
  if (k === 'tak_masuk') return [s.ambangTakMasuk]
  if (k === 'masuk_tertahan') {
    const detik = s.cara?.sapa?.tertuaDetik ?? null
    return [s.cara?.sapa?.tertahan ?? 0, detik === null ? 0 : Math.max(1, Math.round(detik / 60))]
  }
  return []
}

// ── Status WhatsApp per akun (admin_daftar_pengguna_v3) ──────────────────
/** Nilai status_wa dan saringan p_filter.status_wa. */
export const STATUS_WA_AKUN = ['masuk', 'kirim', 'lewat', 'belum'] as const
export type StatusWaAkunKode = typeof STATUS_WA_AKUN[number] | 'lain'
/** Nilai lewat_sebab (nomor_wa_lewat_inti). */
export const SEBAB_LEWAT_WA = ['gangguan', 'tanpa_nomor'] as const
export type SebabLewatWa = typeof SEBAB_LEWAT_WA[number]
/** Segmen daftar pengguna untuk akun tanpa nomor terbukti (lewat atau belum). */
export const SEGMEN_BELUM_WA = 'belum_wa' as const

/** Kolom baris daftar pengguna yang dibaca di sini. Kolomnya TIDAK ADA di
 *  server sebelum migrasi cara terbalik. */
export interface StatusWaAkunDTO {
  status_wa?: string | null
  status_wa_pada?: string | null
  lewat_sebab?: string | null
  nomor_ramai?: boolean | null
  kredit_ditahan?: boolean | null
}
export interface StatusWaAkun {
  status: StatusWaAkunKode
  /** Tanggal terverifikasi atau lewat ('13 Nov 2026'), '—' bila tidak ada.
   *  Tanpa alasan server sudah membulatkannya ke awal hari WIB. */
  pada: string
  padaIso: string | null
  /** Hanya untuk status lewat. null = sebab tidak dikenal. */
  sebabLewat: SebabLewatWa | null
  /** Nomor ini tersambung ke 3 akun atau lebih dalam 30 hari (C4). */
  nomorRamai: boolean
  /** Kredit Domi gratis ditahan sampai nomor tersambung (K2). */
  kreditDitahan: boolean
}

/** null = server belum mengirim kolom status WhatsApp. Nilai asing → 'lain'. */
export function keStatusWaAkun(d: StatusWaAkunDTO, bahasa: BahasaWaktu = 'id'): StatusWaAkun | null {
  if (d.status_wa === undefined) return null
  const status: StatusWaAkunKode = (STATUS_WA_AKUN as readonly unknown[]).includes(d.status_wa) ? d.status_wa as StatusWaAkunKode : 'lain'
  const padaIso = status === 'belum' ? null : (d.status_wa_pada ?? null)
  return {
    status,
    pada: tanggalPendek(padaIso, bahasa),
    padaIso,
    sebabLewat: status === 'lewat' && (SEBAB_LEWAT_WA as readonly unknown[]).includes(d.lewat_sebab) ? d.lewat_sebab as SebabLewatWa : null,
    nomorRamai: d.nomor_ramai === true,
    kreditDitahan: d.kredit_ditahan === true,
  }
}
