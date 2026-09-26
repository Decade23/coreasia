/**
 * Kasus (Fase 1, migrasi 0089) — DTO persis bentuk jawaban server, tipe
 * domain untuk UI, dan aturan murni pembukaan otomatis.
 *
 * Kasus = izin baca berlingkup yang DICATAT SERVER: subjek, ranah (jenis
 * data), ruang (buku mana), alasan, masa berlaku 30 menit (diperpanjang
 * sampai 2 jam sejak akar anggaran), terikat pelaku. Kasus anak (T3, ranah
 * `teks`) berumur 10 menit dan menuntut alasan BARU. Penegaknya Postgres; di
 * sini hanya bentuk data dan aturan tampilan.
 *
 * Sejak keputusan Master 21 Sep 2026 kasus dibuka OTOMATIS oleh console
 * (lihat "Pembukaan OTOMATIS" di bawah) — tanpa dialog alasan/skenario.
 *
 * Id kasus TIDAK PERNAH masuk URL atau storage: setelah refresh / tab baru,
 * kasus dipulihkan lewat admin_kasus_aktif(subjek).
 *
 * adapters/ tidak di-auto-import Nuxt — selalu impor eksplisit.
 */
import type { ObjekJson } from './cashflow'
import { jamWib, tanggalWib } from './cashflowWaktu'

// ── Nilai yang dikenal server ────────────────────────────────────────────
/** CHECK admin_kasus_preset (0089). `berkala` sengaja TIDAK ada (K12). */
export const PRESET_KASUS = ['keluhan', 'pembayaran', 'galat', 'penyalahgunaan', 'keamanan', 'hukum', 'permintaan_subjek'] as const
export type PresetKasus = typeof PRESET_KASUS[number]
/** Preset yang diterima admin_kasus_investigasi (kasus anak T3). */
export const PRESET_INVESTIGASI = ['galat', 'penyalahgunaan', 'keamanan', 'hukum'] as const
export type PresetInvestigasi = typeof PRESET_INVESTIGASI[number]

/** kasus_ranah_tingkat (0089 §6): ranah → tingkat. */
export const RANAH_T1 = ['akun'] as const
export const RANAH_T2 = ['ruang', 'transaksi', 'dompet', 'jejak', 'katalog', 'jadwal', 'usaha', 'struk', 'perangkat', 'kabar', 'lampiran'] as const
export const RANAH_T3 = ['teks', 'foto', 'pembayaran', 'kontak'] as const
export type Ranah = typeof RANAH_T1[number] | typeof RANAH_T2[number] | typeof RANAH_T3[number]
export type Tingkat = 'T1' | 'T2' | 'T3'
/** Ranah yang punya tab (dan RPC) di Fase 1 = ranah kasus otomatis. Ranah
 *  lain belum dibuka: membukanya tanpa tempat membacanya melanggar "hanya
 *  bagian yang relevan", dan tautan ke tab fase berikutnya dilarang. */
export const RANAH_FASE1 = ['akun', 'transaksi', 'jejak'] as const
export type RanahFase1 = typeof RANAH_FASE1[number]

export function tingkatRanah(r: string): Tingkat | null {
  if ((RANAH_T1 as readonly string[]).includes(r)) return 'T1'
  if ((RANAH_T2 as readonly string[]).includes(r)) return 'T2'
  if ((RANAH_T3 as readonly string[]).includes(r)) return 'T3'
  return null
}

export const STATUS_KASUS = ['aktif', 'ditutup', 'dicabut', 'kedaluwarsa'] as const
export type StatusKasus = typeof STATUS_KASUS[number]

// ── DTO ──────────────────────────────────────────────────────────────────
/** admin_kasus_json_inti (0089 §8) — objek yang dipulangkan buka, tambah,
 *  perpanjang, tutup, investigasi, dan admin_kasus_aktif. `ruang` (workspace_id
 *  lingkup = keanggotaan subjek, ranah akun T1) null untuk sesi TANPA
 *  cashflow:pii (admin_kasus_aktif, admin_kasus_tutup); `jumlah_ruang` selalu. */
export interface KasusDTO {
  id: string
  induk: string | null
  subjek_tipe: string
  subjek_id: string
  ruang: string[] | null
  jumlah_ruang: number
  skenario: string | null
  preset: string
  alasan: string
  ranah: string[]
  tingkat: string
  lanjutan_dari: string | null
  dibuka: string
  akar_dibuka: string
  berlaku_sampai: string
  batas_perpanjang: string
  ditutup: string | null
  status: string | null
  /** null untuk sesi TANPA pii (admin_kasus_aktif): "S berbagi ruang dengan n−1 orang". */
  jumlah_terdampak: number | null
}
/** admin_kasus_aktif (0089 §11). */
export interface KasusAktifDTO { kasus: KasusDTO | null; investigasi: KasusDTO[] }
/** Batas laju admin_kasus_buka: jsonb 200, BUKAN galat (supaya baris audit
 *  batas_akses tidak ikut ter-rollback). Kasus tidak dibuat. */
export interface BatasAksesDTO {
  ditolak: true
  hint: 'batas-akses'
  pesan: string
  batas: { jam: number; hari: number }
  terpakai: { jam: number; hari: number }
}
export type KasusBukaDTO = KasusDTO | BatasAksesDTO

/** admin_daftar_kasus (0089 §11): returns table. Subjek SELALU tersamar;
 *  `ruang` dan `jumlah_terdampak` hanya untuk pemegang pii (selain itu null —
 *  jumlah_ruang saja). */
export interface DaftarKasusDTO {
  /** subjek_id null = kasus bersubjek RUANG untuk sesi tanpa pii (0094). */
  id: string; induk: string | null; pelaku: string; subjek_tipe: string; subjek_id: string | null
  subjek_label: string | null; ruang: string[] | null; jumlah_ruang: number; skenario: string | null; preset: string
  alasan: string | null; alasan_utuh: boolean; ranah: string[]; tingkat: string
  jumlah_terdampak: number | null; lanjutan_dari: string | null; dibuka: string; berlaku_sampai: string
  ditutup: string | null; status: string | null; milik_saya: boolean; total_semua: number
}

/** admin_riwayat_akses (0089 §12): satu baris. `jumlah` = detail->'jumlah' apa adanya. */
export interface RiwayatAksesBarisDTO {
  id: number; pada: string; pelaku: string | null; aksi: string; target_type: string | null
  langsung: boolean | null; kasus: string | null; ranah: string[]; rpc: string | null
  jumlah: number | string | null; alasan: string | null; alasan_utuh: boolean; milik_saya: boolean
}
export interface KursorAkses { t: string; i: number }
export interface RiwayatAksesDTO {
  baris: RiwayatAksesBarisDTO[]
  kursor_berikut: KursorAkses | null
  /** Halaman pertama saja: baris yang bisa ditelusuri pemanggil ini. */
  total: number | null
  /** SELALU null sejak 0089 §12 putaran 3 (kuncinya tetap demi kontrak): angka
   *  baris yang disembunyikan naik tepat saat subjek lain dibuka — orakel
   *  waktu. Yang disembunyikan tidak dihitung dalam bentuk apa pun. */
  tersembunyi: number | null
  halaman_pertama: boolean
}

/** admin_daftar_audit_v3 (0089 §13): target_email SELALU tersamar; alasan
 *  terpotong kecuali pii / baris milik pemanggil. TANPA pii: terdampak dan
 *  jumlah_terdampak null, detail tanpa ruang/tx/ids, dan baris baca-ruang
 *  dari kasus tanpa target_id & kasus — tidak ada yang merangkai orang ke
 *  ruang atau orang ke orang. */
export interface AuditV3DTO {
  id: number; admin_id: string | null; pelaku: string | null; action: string; target_type: string | null
  target_id: string | null; target_email: string | null; detail: ObjekJson | null; reason: string | null
  alasan_utuh: boolean; ranah: string[] | null; kasus: string | null; terdampak: string[] | null
  jumlah_terdampak: number | null; created_at: string; total_semua: number
}

// ── Domain ───────────────────────────────────────────────────────────────
export interface Kasus {
  id: string
  induk: string | null
  anak: boolean
  /** 'workspace' = kasus bersubjek ruang (0094); selain itu 'user'. */
  subjekTipe: 'user' | 'workspace'
  subjekId: string
  /** Lingkup ruang; [] bila server tidak mengirimnya (sesi tanpa pii). */
  ruang: string[]
  /** false = server menahan `ruang` (sesi tanpa pii); jumlahnya tetap. */
  lingkupTerlihat: boolean
  jumlahRuang: number
  skenario: string | null
  preset: string
  alasan: string
  ranah: string[]
  tingkat: Tingkat | null
  lanjutanDari: string | null
  dibukaIso: string
  akarIso: string
  sampaiIso: string
  batasPerpanjangIso: string
  ditutupIso: string | null
  status: StatusKasus | null
  /** null = server menahannya (sesi tanpa pii), bukan 0. */
  terdampak: number | null
}

const STATUS_SET: ReadonlySet<string> = new Set(STATUS_KASUS)
const larikTeks = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
/** Hitungan yang BOLEH ditahan server: null tetap null (bukan "0 orang"). */
const angkaAtauNull = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

export function keKasus(d: KasusDTO): Kasus {
  const t = d.tingkat === 'T1' || d.tingkat === 'T2' || d.tingkat === 'T3' ? d.tingkat : null
  return {
    id: d.id,
    induk: d.induk ?? null,
    anak: !!d.induk,
    subjekTipe: d.subjek_tipe === 'workspace' ? 'workspace' : 'user',
    subjekId: d.subjek_id,
    ruang: larikTeks(d.ruang),
    lingkupTerlihat: Array.isArray(d.ruang),
    jumlahRuang: Number(d.jumlah_ruang ?? (Array.isArray(d.ruang) ? d.ruang.length : 0)) || 0,
    skenario: d.skenario ?? null,
    preset: d.preset,
    alasan: d.alasan ?? '',
    ranah: larikTeks(d.ranah),
    tingkat: t,
    lanjutanDari: d.lanjutan_dari ?? null,
    dibukaIso: d.dibuka,
    akarIso: d.akar_dibuka,
    sampaiIso: d.berlaku_sampai,
    batasPerpanjangIso: d.batas_perpanjang,
    ditutupIso: d.ditutup ?? null,
    status: d.status && STATUS_SET.has(d.status) ? (d.status as StatusKasus) : null,
    terdampak: angkaAtauNull(d.jumlah_terdampak),
  }
}

export function adalahBatasAkses(d: KasusBukaDTO | null | undefined): d is BatasAksesDTO {
  return !!d && (d as BatasAksesDTO).ditolak === true && (d as BatasAksesDTO).hint === 'batas-akses'
}

/** Sisa detik (≥ 0) sampai kasus berakhir. */
export function sisaDetik(k: Pick<Kasus, 'sampaiIso'>, sekarang: number = Date.now()): number {
  const t = Date.parse(k.sampaiIso)
  return Number.isFinite(t) ? Math.max(0, Math.floor((t - sekarang) / 1000)) : 0
}

/** Masih bisa dipakai menurut jam klien — server tetap penentunya. */
export function kasusBerlaku(k: Pick<Kasus, 'sampaiIso' | 'status' | 'ditutupIso'> | null, sekarang: number = Date.now()): boolean {
  return !!k && !k.ditutupIso && (k.status === null || k.status === 'aktif') && sisaDetik(k, sekarang) > 0
}

/** Perpanjang +30 menit hanya untuk kasus induk yang belum di batas 2 jam. */
export function bisaPerpanjang(k: Pick<Kasus, 'anak' | 'sampaiIso' | 'batasPerpanjangIso'>): boolean {
  return !k.anak && Date.parse(k.sampaiIso) < Date.parse(k.batasPerpanjangIso)
}

/** 'mm:ss' atau 'h:mm:ss' untuk chip hitung mundur. */
export function hitungMundur(detik: number): string {
  const d = Math.max(0, Math.floor(detik))
  const j = Math.floor(d / 3600)
  const m = Math.floor((d % 3600) / 60)
  const s = d % 60
  const dua = (n: number) => String(n).padStart(2, '0')
  return j > 0 ? `${j}:${dua(m)}:${dua(s)}` : `${dua(m)}:${dua(s)}`
}

// ── Tab Pengguna 360 ─────────────────────────────────────────────────────
/** Tab Pengguna 360 (segmen path; '' = Ringkas). Fase 2: dompet; Fase 3
 *  (0095): perangkat dan kabar — ranah milik orang, hanya di halaman ini. */
export const TAB_PENGGUNA = ['', 'ruang', 'transaksi', 'jejak', 'akses', 'dompet', 'perangkat', 'kabar'] as const
export type TabPengguna = typeof TAB_PENGGUNA[number]
/** Ranah Fase 3 milik orang: ditambah hanya saat tabnya DIAKTIFKAN pengguna
 *  (spek §6), tidak ikut kasus otomatis (RANAH_FASE1 tetap). */
export const RANAH_ORANG_FASE3 = ['perangkat', 'kabar'] as const
export const tabAktivasiPengguna = (t: TabPengguna): t is typeof RANAH_ORANG_FASE3[number] =>
  (RANAH_ORANG_FASE3 as readonly string[]).includes(t)

/** Hitungan lencana Pengguna 360 yang dibaca (subset hitung{} admin_pengguna_360). */
export interface HitungLencanaPengguna {
  ruang: number; transaksi: number; jejak: number; sampah: number
  /** 0095; null = server sebelum 0095 (belum diketahui). */
  perangkat: number | null; kabar: number | null
}
/**
 * Lencana tab Pengguna 360 (null = belum diketahui; tab tidak dipindah ke
 * "Lainnya"). Transaksi = transaksi + sampah (tab memuat keduanya). Perangkat
 * dan Kabar dari hitung{} 0095 (K-F3-7), tanpa memanggil RPC tab.
 */
export function lencanaTabPengguna(t: TabPengguna, h: HitungLencanaPengguna | null, akses30: number | null): number | null {
  if (t === 'akses') return akses30
  if (!h) return null
  switch (t) {
    case 'ruang': return h.ruang
    case 'transaksi': return h.transaksi + h.sampah
    case 'jejak': return h.jejak
    case 'perangkat': return h.perangkat
    case 'kabar': return h.kabar
    default: return null
  }
}

// ── Pembukaan OTOMATIS (keputusan Master 21 Sep 2026) ────────────────────
/*
 * Membuka Pengguna 360, transaksi, jejak, akses, dan catatan = SATU KLIK.
 * Tidak ada dialog alasan, skenario, preset, ranah, atau lingkup. Syarat
 * satu-satunya: sesi console ber-TOTP (izin cashflow:pii / investigasi, yang
 * ditegakkan server). Kasus TETAP dibuka di server dan setiap pembacaan TETAP
 * diaudit — hanya isinya yang diisi otomatis oleh console:
 *   preset  'keluhan'; ranah = semua ranah Fase 1; lingkup = SEMUA ruang
 *           subjek dari kepala (termasuk bekas anggota yang sah);
 *   alasan  kalimat tetap + cap waktu WIB (audit terbaca per pembukaan).
 *           0089 terbaru tidak lagi menuntut alasan yang berbeda untuk
 *           anggaran baru atau kasus anak; cap waktu tetap membuat setiap
 *           alasan unik, jadi console tidak bergantung pada aturan itu.
 * Kasus diperpanjang otomatis selama halaman aktif (useCashflowKasus); lewat
 * batas 2 jam, kasus baru dibuka otomatis dan ikut batas laju server.
 */
/** Skenario yang tercatat di admin_kasus untuk pembukaan otomatis (terbaca di /kasus). */
export const SKENARIO_OTOMATIS = 'pengguna_360'
/** Pola CHECK admin_kasus_skenario (0089). */
export const POLA_SKENARIO = /^[a-z0-9_]{1,40}$/
export const PRESET_OTOMATIS: PresetKasus = 'keluhan'
/** Kasus anak T3 hanya menerima galat/penyalahgunaan/keamanan/hukum; 'galat'
 *  yang paling netral untuk "lihat catatan yang dikeluhkan". */
export const PRESET_T3_OTOMATIS: PresetInvestigasi = 'galat'
/** Perpanjang otomatis bila sisa ≤ 5 menit (dan halaman aktif). */
export const AMBANG_PERPANJANG_DETIK = 300
/** "Halaman aktif" = terlihat DAN ada interaksi dalam 30 menit terakhir.
 *  Layar yang ditinggal terbuka tidak memperpanjang kasus tanpa batas. */
export const BATAS_DIAM_MS = 30 * 60_000

/** Cap waktu WIB sampai detik: 'YYYY-MM-DD HH.mm.ss WIB'. */
export function capWaktuWib(sekarang: Date): string {
  const detik = String(sekarang.getUTCSeconds()).padStart(2, '0')
  return `${tanggalWib(sekarang)} ${jamWib(sekarang)}.${detik} WIB`
}
/** Alasan kasus otomatis (≥ 8 aksara, unik per detik). Bahasa Indonesia apa
 *  pun bahasa layar: audit dibaca lintas admin. */
export const alasanOtomatis = (sekarang: Date = new Date()): string =>
  `Dibuka dari console CashFlow — Pengguna 360 · ${capWaktuWib(sekarang)}`
/** Alasan kasus anak T3 otomatis — berbeda dari alasan induk (alasan_kunci). */
export const alasanT3Otomatis = (sekarang: Date = new Date()): string =>
  `Catatan dibuka dari console CashFlow · ${capWaktuWib(sekarang)}`

/** Ruang calon lingkup, dari kepala (admin_pengguna_kepala.ruang[], hanya pemegang pii). */
export interface RuangCalon {
  id: string
  nama: string
  jenis: string | null
  peran: string | null
  pemilik: boolean
  bekas: boolean
  anggota: number
  tx: number
}

/** Lingkup otomatis = SEMUA ruang subjek (anggota kini + bekas anggota yang
 *  pernah ia catati), unik dan terurut. */
export const lingkupSemua = (ruang: readonly Pick<RuangCalon, 'id'>[]): string[] =>
  [...new Set(ruang.map(r => r.id).filter(Boolean))].sort()

/** Jawaban server (user_id kepala) milik subjek yang diminta? UUID dibanding
 *  tanpa peka huruf: path bisa berhuruf besar, server menjawab huruf kecil. */
export const samaSubjek = (dariServer: string | null | undefined, subjek: string): boolean =>
  !!dariServer && dariServer.toLowerCase() === subjek.toLowerCase()

/** Yang belum ada di kasus yang dipulihkan (dibuka sebelum ruang/ranah baru
 *  ada): ditambahkan otomatis lewat admin_kasus_tambah, alasan diwarisi.
 *  `wajib` = ranah halaman ini (Pengguna 360: RANAH_FASE1; Ruang 360:
 *  RANAH_RUANG — juga untuk kasus PENGGUNA yang lingkupnya memuat ruang itu). */
export function kurangDariKasus(
  k: Pick<Kasus, 'ranah' | 'ruang' | 'lingkupTerlihat'>, lingkup: readonly string[], wajib: readonly string[] = RANAH_FASE1,
): { ranah: string[]; ruang: string[] } {
  return {
    ranah: wajib.filter(r => !k.ranah.includes(r)),
    ruang: k.lingkupTerlihat ? lingkup.filter(w => !k.ruang.includes(w)) : [],
  }
}

// ── Alasan ───────────────────────────────────────────────────────────────
export const MIN_ALASAN = 8
export const alasanCukup = (a: string): boolean => a.trim().length >= MIN_ALASAN

// ── Daftar kasus & riwayat akses ─────────────────────────────────────────
export interface BarisKasus {
  id: string
  induk: string | null
  pelaku: string
  subjekTipe: 'user' | 'workspace'
  /** null = disembunyikan server (kasus ruang, sesi tanpa pii). */
  subjekId: string | null
  subjekLabel: string
  /** Kepala subjek (Pengguna 360 / Ruang 360); null bila id disembunyikan. */
  subjekKe: string | null
  ruang: number
  skenario: string | null
  preset: string
  alasan: string
  alasanUtuh: boolean
  ranah: string[]
  tingkat: string
  /** null = server menahannya (sesi tanpa pii), bukan 0. */
  terdampak: number | null
  lanjutanDari: string | null
  dibukaIso: string
  sampaiIso: string
  ditutupIso: string | null
  status: StatusKasus | null
  milikSaya: boolean
}

export function keBarisKasus(d: DaftarKasusDTO): BarisKasus {
  return {
    id: d.id,
    induk: d.induk ?? null,
    pelaku: d.pelaku,
    subjekTipe: d.subjek_tipe === 'workspace' ? 'workspace' : 'user',
    subjekId: d.subjek_id ?? null,
    subjekLabel: d.subjek_label || '—',
    subjekKe: d.subjek_id ? `/console/cashflow/${d.subjek_tipe === 'workspace' ? 'ruang' : 'pengguna'}/${d.subjek_id}` : null,
    ruang: Number(d.jumlah_ruang ?? larikTeks(d.ruang).length) || 0,
    skenario: d.skenario ?? null,
    preset: d.preset,
    alasan: d.alasan ?? '',
    alasanUtuh: d.alasan_utuh === true,
    ranah: larikTeks(d.ranah),
    tingkat: d.tingkat,
    terdampak: angkaAtauNull(d.jumlah_terdampak),
    lanjutanDari: d.lanjutan_dari ?? null,
    dibukaIso: d.dibuka,
    sampaiIso: d.berlaku_sampai,
    ditutupIso: d.ditutup ?? null,
    status: d.status && STATUS_SET.has(d.status) ? (d.status as StatusKasus) : null,
    milikSaya: d.milik_saya === true,
  }
}

export interface BarisAkses {
  id: number
  padaIso: string
  pelaku: string
  aksi: string
  langsung: boolean
  kasus: string | null
  ranah: string[]
  rpc: string | null
  jumlah: number | null
  alasan: string
  alasanUtuh: boolean
  milikSaya: boolean
}

export function keBarisAkses(d: RiwayatAksesBarisDTO): BarisAkses {
  const n = d.jumlah == null || d.jumlah === '' ? Number.NaN : Number(d.jumlah)
  return {
    id: Number(d.id),
    padaIso: d.pada,
    pelaku: d.pelaku || '—',
    aksi: d.aksi,
    langsung: d.langsung === true,
    kasus: d.kasus ?? null,
    ranah: larikTeks(d.ranah),
    rpc: d.rpc ?? null,
    jumlah: Number.isFinite(n) ? n : null,
    alasan: d.alasan ?? '',
    alasanUtuh: d.alasan_utuh === true,
    milikSaya: d.milik_saya === true,
  }
}

/** Baris audit v3 yang dipakai /audit. */
export interface BarisAudit {
  id: number
  waktuIso: string
  aksi: string
  pelaku: string
  targetTipe: string | null
  targetId: string | null
  targetLabel: string | null
  alasan: string
  alasanUtuh: boolean
  ranah: string[]
  kasus: string | null
  /** null = server menahannya (sesi tanpa pii), bukan 0. */
  terdampak: number | null
}

export function keBarisAudit(d: AuditV3DTO): BarisAudit {
  return {
    id: Number(d.id),
    waktuIso: d.created_at,
    aksi: d.action,
    pelaku: d.pelaku || '—',
    targetTipe: d.target_type ?? null,
    targetId: d.target_id ?? null,
    targetLabel: d.target_email ?? null,
    alasan: d.reason ?? '',
    alasanUtuh: d.alasan_utuh === true,
    ranah: larikTeks(d.ranah),
    kasus: d.kasus ?? null,
    terdampak: d.jumlah_terdampak != null ? angkaAtauNull(d.jumlah_terdampak)
      : Array.isArray(d.terdampak) ? d.terdampak.length : null,
  }
}
