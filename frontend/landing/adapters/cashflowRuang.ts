/**
 * Ruang 360 (Fase 2, migrasi 0094) — DTO persis bentuk jawaban server, tipe
 * domain untuk UI, dan aturan murni pembukaan otomatis kasus ruang.
 *
 * Kasus bersubjek RUANG (subjek_tipe 'workspace'): lingkup persis {ruang
 * itu}, ranah hanya ranah buku ruang (akun/perangkat/kabar milik ORANG →
 * 22023 ranah-ruang), tingkat T2. Membuka /ruang/W = SATU KLIK (keputusan
 * Master 21 Sep 2026): admin_kasus_aktif_ruang dulu — kasus aktif milik
 * pemanggil yang lingkupnya memuat W, termasuk kasus PENGGUNA yang datang
 * dari Pengguna 360 (tanpa gerbang baru, juga sesudah refresh) — lalu ranah
 * yang kurang ditambah, dan hanya bila tidak ada kasus dibuka kasus ruang
 * baru dengan isian otomatis.
 *
 * Teks bebas tidak pernah ada di sini: nama dompet dan nama ruang (label
 * struktur) tampil utuh di dalam kasus; cara_bayar, qris_path, label/kode
 * undangan, note, judul tidak dikirim server.
 *
 * adapters/ tidak di-auto-import Nuxt — selalu impor eksplisit.
 */
import { samarkanEmail } from './cashflow'
import { bacaObjekKursor, isoSah, keTransaksiBaris, jenisUang, type KursorTransaksi, type TransaksiBarisDTO, type TransaksiBaris, type JenisUang, type CekTransaksi, CEK_TRANSAKSI } from './cashflowBuku'
import { capWaktuWib, type BatasAksesDTO, type KasusDTO } from './cashflowKasus'

// ── Kasus ruang: isian otomatis ──────────────────────────────────────────
/** Ranah tab Ruang 360 = ranah kasus ruang otomatis (admin_kasus_aktif_ruang
 *  mengurutkan kasus menurut irisan dengan himpunan ini). */
export const RANAH_RUANG = ['ruang', 'dompet', 'transaksi', 'jejak'] as const
export type RanahRuang = typeof RANAH_RUANG[number]
/** Ranah yang ditolak server untuk subjek ruang (22023 ranah-ruang). */
export const RANAH_BUKAN_RUANG = ['akun', 'perangkat', 'kabar'] as const
/** Skenario kasus ruang yang dibuka console (terbaca di /kasus). */
export const SKENARIO_RUANG = 'ruang_360'
/** Skenario bawaan admin_kasus_buka_dari_peristiwa (tombol Selidiki). */
export const SKENARIO_SELIDIKI = 'selidiki_aktivitas'
/** Alasan kasus ruang otomatis (≥ 8 aksara, unik per detik). */
export const alasanOtomatisRuang = (sekarang: Date = new Date()): string =>
  `Dibuka dari console CashFlow — Ruang 360 · ${capWaktuWib(sekarang)}`
/** Alasan "Selidiki" dari /aktivitas. */
export const alasanSelidiki = (sekarang: Date = new Date()): string =>
  `Selidiki dari console CashFlow — Aktivitas · ${capWaktuWib(sekarang)}`

// ── Tab Ruang 360 ────────────────────────────────────────────────────────
export const TAB_RUANG = ['', 'anggota', 'transaksi', 'dompet', 'jejak', 'sampah', 'akses'] as const
export type TabRuang = typeof TAB_RUANG[number]
/** Ranah yang dibaca tiap tab (null = T0, tanpa kasus). Sampah = ranah jejak (0094 §7). */
export const RANAH_TAB_RUANG: Readonly<Record<TabRuang, RanahRuang | null>> = {
  '': 'ruang', anggota: 'ruang', transaksi: 'transaksi', dompet: 'dompet', jejak: 'jejak', sampah: 'jejak', akses: null,
}

/**
 * Lencana tab Ruang 360 (null = belum diketahui; tab tidak dipindah ke
 * "Lainnya"). Sampah: hitung.sampah admin_ruang_360 = baris sampah yang
 * transaksinya MASIH terhapus, sedangkan tab Sampah (admin_sampah_ruang)
 * menampilkan SEMUA baris termasuk yang sudah dipulihkan. Lencananya diberi
 * keterangan "masih terhapus" (CashflowTab `judul`), dan 0 dijadikan null:
 * nol yang masih terhapus tidak berarti tab kosong, jadi tab tidak boleh
 * disembunyikan ke "Lainnya (0)".
 */
export function lencanaTabRuang(t: TabRuang, h: HitungRuangDTO | null, akses30: number | null): number | null {
  if (t === 'akses') return akses30
  if (!h) return null
  switch (t) {
    case 'anggota': return h.anggota + h.bekas_anggota
    case 'transaksi': return h.transaksi
    case 'dompet': return h.dompet
    case 'jejak': return h.jejak
    case 'sampah': return h.sampah || null
    default: return null
  }
}

// ── Parameter tab bersama Pengguna 360 / Ruang 360 ──────────────────────
/**
 * p_ws admin_dompet_ruang untuk CashflowTabDompet: mode 'pengguna' = null
 * (semua ruang lingkup kasus); mode 'ruang' = ruang itu SAJA. Ruang yang
 * tidak diketahui di mode ruang = undefined (jangan muat): p_ws null di sana
 * akan menampilkan dompet ruang lain yang kebetulan ada di lingkup kasus
 * (datang dari Pengguna 360 dengan kasus berlingkup W1 dan W2).
 */
export function wsTabDompet(mode: 'pengguna' | 'ruang', ws: string | null): string | null | undefined {
  if (mode === 'pengguna') return null
  return ws || undefined
}
/**
 * Argumen admin_jejak untuk CashflowTabJejak: mode 'pengguna' = peristiwa
 * yang dilakukan subjek (aktor = subjek), di ruang saringan; mode 'ruang' =
 * semua peristiwa di ruang subjek (aktor null, p_ws = subjek).
 */
export function subjekJejak(mode: 'pengguna' | 'ruang', subjek: string, ruangSaring: string | null): { aktor: string | null; ruang: string | null } {
  return mode === 'ruang' ? { aktor: null, ruang: subjek } : { aktor: subjek, ruang: ruangSaring }
}

// ── Kepala ruang (T0) ────────────────────────────────────────────────────
/** admin_ruang_kepala (0094 §5). jumlah_* null untuk sesi tanpa pii. */
export interface KepalaRuangDTO {
  workspace_id: string; nama: string | null; jenis: string | null; pemilik_email: string | null; dibuat: string
  jumlah_anggota: number | null; jumlah_transaksi: number | null; jumlah_dompet: number | null; akses_30hari: number
}
export interface KepalaRuang {
  id: string
  /** Tersamar oleh server (samar_nama). */
  namaTersamar: string
  jenis: string | null
  pemilikTersamar: string
  dibuatIso: string
  anggota: number | null
  transaksi: number | null
  dompet: number | null
  akses30: number
  /** Server mengirim hitungan = sesi memegang cashflow:pii. */
  pii: boolean
}
const angkaAtauNull = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}
const angka0 = (v: unknown): number => angkaAtauNull(v) ?? 0

export function keKepalaRuang(d: KepalaRuangDTO): KepalaRuang {
  const anggota = angkaAtauNull(d.jumlah_anggota)
  return {
    id: d.workspace_id,
    namaTersamar: d.nama || '—',
    jenis: d.jenis ?? null,
    pemilikTersamar: samarkanEmail(d.pemilik_email),
    dibuatIso: d.dibuat,
    anggota,
    transaksi: angkaAtauNull(d.jumlah_transaksi),
    dompet: angkaAtauNull(d.jumlah_dompet),
    akses30: angka0(d.akses_30hari),
    pii: anggota !== null,
  }
}

// ── admin_ruang_360 (ranah ruang) ────────────────────────────────────────
export interface RuangInfoDTO {
  workspace_id: string; nama: string; jenis: string | null; owner_nick: string | null; aturan_hapus: string | null
  fitur_patungan: boolean | null; ada_cara_bayar: boolean; ada_qris: boolean; pemilik_id: string | null; dibuat: string
}
export interface HitungRuangDTO {
  anggota: number; bekas_anggota: number; undangan_aktif: number; transaksi: number; dompet: number; jejak: number; sampah: number
}
export interface AgregatRuang360DTO { transaksi: number; masuk_bersih: number | string; keluar_bersih: number | string; terakhir_catat: string | null }
export interface AnggotaRuangDTO {
  user_id: string; email: string | null; peran: string | null; joined_at: string | null; pemilik: boolean
  tx_oleh_dia: number; terakhir_catat_dia: string | null
}
export interface BekasRuangDTO { user_id: string; email: string | null; tx_oleh_dia: number }
export const STATUS_UNDANGAN = ['aktif', 'diterima', 'dicabut', 'ditolak', 'kedaluwarsa'] as const
export type StatusUndangan = typeof STATUS_UNDANGAN[number]
export interface UndanganRuangDTO {
  id: string; peran: string | null; status: string; ada_label: boolean; target_email: string | null
  diundang_oleh: string | null; diterima_oleh: string | null; dibuat: string; kedaluwarsa: string | null
  diterima_pada: string | null; dicabut_pada: string | null; ditolak_pada: string | null
}
export interface Ruang360DTO {
  kasus: string
  ruang: RuangInfoDTO
  hitung: HitungRuangDTO
  /** null bila kasus tanpa ranah transaksi. */
  agregat: AgregatRuang360DTO | null
  anggota: AnggotaRuangDTO[]
  bekas: BekasRuangDTO[]
  undangan: UndanganRuangDTO[]
}

export interface AnggotaRuang {
  id: string; emailTersamar: string; peran: string | null; gabungIso: string | null; pemilik: boolean
  tx: number; terakhirCatatIso: string | null
}
export interface BekasRuang { id: string; emailTersamar: string; akunAda: boolean; tx: number }
export interface UndanganRuang {
  id: string; peran: string | null; status: StatusUndangan | null; adaLabel: boolean; targetTersamar: string
  diundangOleh: string | null; diterimaOleh: string | null; dibuatIso: string; kedaluwarsaIso: string | null
  selesaiIso: string | null
}
export interface Ruang360 {
  kasus: string
  ruang: {
    id: string; nama: string; jenis: string | null; ownerNick: string | null; aturanHapus: string | null
    patungan: boolean; adaCaraBayar: boolean; adaQris: boolean; pemilikId: string | null; dibuatIso: string
  }
  hitung: HitungRuangDTO
  agregat: { transaksi: number; masukBersih: number; keluarBersih: number; terakhirCatatIso: string | null } | null
  anggota: AnggotaRuang[]
  bekas: BekasRuang[]
  undangan: UndanganRuang[]
}

const STATUS_UNDANGAN_SET: ReadonlySet<string> = new Set(STATUS_UNDANGAN)

export function keRuang360(d: Ruang360DTO): Ruang360 {
  const h = d.hitung
  return {
    kasus: d.kasus,
    ruang: {
      id: d.ruang.workspace_id,
      nama: d.ruang.nama || '—',
      jenis: d.ruang.jenis ?? null,
      ownerNick: d.ruang.owner_nick ?? null,
      aturanHapus: d.ruang.aturan_hapus ?? null,
      patungan: d.ruang.fitur_patungan === true,
      adaCaraBayar: d.ruang.ada_cara_bayar === true,
      adaQris: d.ruang.ada_qris === true,
      pemilikId: d.ruang.pemilik_id ?? null,
      dibuatIso: d.ruang.dibuat,
    },
    hitung: {
      anggota: angka0(h?.anggota), bekas_anggota: angka0(h?.bekas_anggota), undangan_aktif: angka0(h?.undangan_aktif),
      transaksi: angka0(h?.transaksi), dompet: angka0(h?.dompet), jejak: angka0(h?.jejak), sampah: angka0(h?.sampah),
    },
    agregat: d.agregat
      ? {
          transaksi: angka0(d.agregat.transaksi),
          masukBersih: angka0(d.agregat.masuk_bersih),
          keluarBersih: angka0(d.agregat.keluar_bersih),
          terakhirCatatIso: d.agregat.terakhir_catat ?? null,
        }
      : null,
    anggota: (d.anggota ?? []).map(a => ({
      id: a.user_id,
      emailTersamar: samarkanEmail(a.email),
      peran: a.peran ?? null,
      gabungIso: a.joined_at ?? null,
      pemilik: a.pemilik === true,
      tx: angka0(a.tx_oleh_dia),
      terakhirCatatIso: a.terakhir_catat_dia ?? null,
    })),
    bekas: (d.bekas ?? []).map(b => ({
      id: b.user_id,
      emailTersamar: samarkanEmail(b.email),
      akunAda: !!b.email,
      tx: angka0(b.tx_oleh_dia),
    })),
    undangan: (d.undangan ?? []).map(u => ({
      id: u.id,
      peran: u.peran ?? null,
      status: STATUS_UNDANGAN_SET.has(u.status) ? (u.status as StatusUndangan) : null,
      adaLabel: u.ada_label === true,
      targetTersamar: u.target_email ? samarkanEmail(u.target_email) : '—',
      diundangOleh: u.diundang_oleh ?? null,
      diterimaOleh: u.diterima_oleh ?? null,
      dibuatIso: u.dibuat,
      kedaluwarsaIso: u.kedaluwarsa ?? null,
      selesaiIso: u.diterima_pada ?? u.dicabut_pada ?? u.ditolak_pada ?? null,
    })),
  }
}

// ── Dompet (ranah dompet) ────────────────────────────────────────────────
/** admin_dompet_bangun (0094 §6): satu dompet + saldo. */
export interface DompetBarisDTO {
  id: string; workspace_id: string; nama: string | null; tipe: string | null; warna: string | null
  opening_balance: number | string; credit_limit: number | string | null; archived: boolean; dibuat: string
  pembuat: string | null; mutasi: number | string; saldo: number | string; jumlah_transaksi: number
  terakhir_tanggal: string | null; masa_depan: number
}
export interface RingkasDompetDTO {
  workspace_id: string; jumlah_dompet: number; aset: number | string; piutang: number | string; arsip: number | string
}
export interface DompetRuangDTO { kasus: string; baris: DompetBarisDTO[]; ringkas: RingkasDompetDTO[] }

export interface Dompet {
  id: string; ruangId: string; nama: string; tipe: string | null; warna: string | null
  saldoAwal: number; batasKredit: number | null; arsip: boolean; dibuatIso: string; pembuat: string | null
  mutasi: number; saldo: number; transaksi: number; terakhirTanggal: string | null; masaDepan: number
  piutang: boolean
}
export interface RingkasDompet { ruangId: string; jumlah: number; aset: number; piutang: number; arsip: number }

export function keDompet(d: DompetBarisDTO): Dompet {
  return {
    id: d.id,
    ruangId: d.workspace_id,
    nama: d.nama || '—',
    tipe: d.tipe ?? null,
    warna: d.warna ?? null,
    saldoAwal: angka0(d.opening_balance),
    batasKredit: angkaAtauNull(d.credit_limit),
    arsip: d.archived === true,
    dibuatIso: d.dibuat,
    pembuat: d.pembuat ?? null,
    mutasi: angka0(d.mutasi),
    saldo: angka0(d.saldo),
    transaksi: angka0(d.jumlah_transaksi),
    terakhirTanggal: d.terakhir_tanggal ?? null,
    masaDepan: angka0(d.masa_depan),
    piutang: d.tipe === 'piutang',
  }
}
export const keRingkasDompet = (r: RingkasDompetDTO): RingkasDompet => ({
  ruangId: r.workspace_id, jumlah: angka0(r.jumlah_dompet), aset: angka0(r.aset), piutang: angka0(r.piutang), arsip: angka0(r.arsip),
})

/**
 * Kelompok per ruang untuk tab Dompet (urut ringkas server; ruang tanpa
 * dompet tetap tampil ringkasnya). `adaArsip` = kelompok punya dompet
 * terarsip — BUKAN `arsip !== 0`: ringkas.arsip adalah Σ SALDO dompet
 * terarsip (uang, 0094 §6), yang bisa 0 walau dompet terarsipnya ada.
 */
export interface KelompokDompet { r: RingkasDompet; dompet: Dompet[]; adaArsip: boolean }
export function kelompokkanDompet(ringkas: readonly RingkasDompet[], dompet: readonly Dompet[]): KelompokDompet[] {
  return ringkas.map((r) => {
    const milik = dompet.filter(d => d.ruangId === r.ruangId)
    return { r, dompet: milik, adaArsip: milik.some(d => d.arsip) }
  })
}

/** admin_mutasi_dompet (0094 §6): baris = bentuk admin_transaksi_bangun + saldo_setelah. */
export type MutasiBarisDTO = TransaksiBarisDTO & { saldo_setelah: number | string }
export interface MutasiDompetDTO {
  kasus: string
  dompet: {
    id: string; workspace_id: string; nama: string | null; tipe: string | null; opening_balance: number | string
    credit_limit: number | string | null; archived: boolean; saldo: number | string
  }
  baris: MutasiBarisDTO[]
  kursor_berikut: KursorTransaksi | null
  /** Hanya halaman pertama. */
  total: number | null
  halaman_pertama: boolean
}
export type MutasiBaris = TransaksiBaris & { saldoSetelah: number }
export const keMutasiBaris = (d: MutasiBarisDTO): MutasiBaris => ({ ...keTransaksiBaris(d), saldoSetelah: angka0(d.saldo_setelah) })

/** admin_periksa_ruang (0094 §6): hitungan per cek; rinciannya di tab
 *  Transaksi ruang ?cek=<jenis> (server menghitung ulang id-nya). */
export interface PeriksaRuangDTO {
  kasus: string; workspace_id: string; cek: Array<{ cek: string; jumlah: number }>; jumlah_bermasalah: number; diperiksa_pada: string
}
export interface Pemeriksaan { cek: CekTransaksi; jumlah: number }
export function kePemeriksaan(d: PeriksaRuangDTO): { baris: Pemeriksaan[]; bermasalah: number; padaIso: string } {
  const dikenal = new Set<string>(CEK_TRANSAKSI)
  return {
    baris: (d.cek ?? []).filter(c => dikenal.has(c.cek)).map(c => ({ cek: c.cek as CekTransaksi, jumlah: angka0(c.jumlah) })),
    bermasalah: angka0(d.jumlah_bermasalah),
    padaIso: d.diperiksa_pada,
  }
}

// ── Sampah ruang (ranah jejak) ───────────────────────────────────────────
export interface SampahRuangBarisDTO {
  id: string; tx_id: string; workspace_id: string; kind: string | null; amount: number | string | null
  occurred_at: string | null; dompet_id: string | null; dompet_nama: string | null; kategori_id: string | null
  kategori: string | null; transfer_group: string | null; group_id: string | null; schedule_id: string | null
  ada_foto: boolean | null; ada_catatan: boolean; ada_judul: boolean; pencatat: string | null
  dihapus_oleh: string | null; dihapus_pada: string; dipulihkan_oleh: string | null; dipulihkan_pada: string | null
  status: string
}
export interface KursorSampah { d: string; i: string }
export interface SampahRuangDTO {
  kasus: string
  baris: SampahRuangBarisDTO[]
  kursor_berikut: KursorSampah | null
  /** Hanya halaman pertama. */
  total: number | null
  halaman_pertama: boolean
}
export interface SampahRuangBaris {
  id: string; txId: string; jenis: JenisUang | null; nominal: number; tanggal: string | null
  dompet: string; kategori: string; adaCatatan: boolean; adaJudul: boolean; adaFoto: boolean
  pencatat: string | null; dihapusOleh: string | null; dihapusIso: string
  dipulihkanOleh: string | null; dipulihkanIso: string | null; dipulihkan: boolean
}
export function keSampahRuang(d: SampahRuangBarisDTO): SampahRuangBaris {
  return {
    id: d.id,
    txId: d.tx_id,
    jenis: jenisUang(d.kind, d.transfer_group),
    nominal: angka0(d.amount),
    tanggal: d.occurred_at ?? null,
    dompet: d.dompet_nama || '—',
    kategori: d.kategori || '—',
    adaCatatan: d.ada_catatan === true,
    adaJudul: d.ada_judul === true,
    adaFoto: d.ada_foto === true,
    pencatat: d.pencatat ?? null,
    dihapusOleh: d.dihapus_oleh ?? null,
    dihapusIso: d.dihapus_pada,
    dipulihkanOleh: d.dipulihkan_oleh ?? null,
    dipulihkanIso: d.dipulihkan_pada ?? null,
    dipulihkan: d.status === 'dipulihkan',
  }
}
const POLA_UUID_KURSOR = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** ?kursor= sampah → {d, i}; rusak → null (halaman pertama). Server menolak
 *  '{}' dan kursor rusak dengan 22023 kursor, jadi yang rusak tidak dikirim. */
export function kursorSampahDariUrl(teks: string | null | undefined): KursorSampah | null {
  const o = bacaObjekKursor(teks)
  return o && isoSah(o.d) && typeof o.i === 'string' && POLA_UUID_KURSOR.test(o.i) ? { d: o.d, i: o.i } : null
}

// ── Aktivitas v2 (T0) + Selidiki ─────────────────────────────────────────
/** admin_aktivitas_terbaru_v2 (0094 §8): tanpa ruang, aktor, jam. `id` hanya
 *  untuk tombol Selidiki (server menentukan ruangnya). */
export interface AktivitasV2DTO { id: number; jenis: string; rentang_nominal: string; tanggal: string | null }
/** admin_kasus_buka_dari_peristiwa: kasus ruang + peristiwa_id, atau batas laju (tanpa peristiwa_id). */
export type KasusPeristiwaDTO = (KasusDTO & { peristiwa_id: number }) | BatasAksesDTO

/** Tujuan sesudah Selidiki: tab Jejak ruang subjek kasus. */
export const tujuanSelidiki = (k: Pick<KasusDTO, 'subjek_tipe' | 'subjek_id'>): string | null =>
  k.subjek_tipe === 'workspace' && k.subjek_id ? `${AKAR_RUANG}/${k.subjek_id}/jejak` : null

export const AKAR_RUANG = '/console/cashflow/ruang'
