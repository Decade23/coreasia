/**
 * Daftar pengguna console: pilihan urut, saringan, dan isi baris dua tingkat.
 *
 * Tabelnya tujuh kolom. Yang tidak lagi punya kolom sendiri (tanggal daftar,
 * transaksi, total nominal, terakhir pakai Domi) tetap bisa dipakai mengurutkan
 * lewat satu pilihan "Urut", dan saringan kolom pindah ke panel "Saring".
 * Nilai yang dikirim ke server (p_urut, p_arah, p_segmen, p_filter) dan
 * parameter URL (?urut, ?arah, ?seg, ?hal) TIDAK berubah: berkas ini yang
 * menjaganya, dan tests/cashflow/pengguna-daftar.test.ts menguncinya.
 *
 * Fungsi murni semua: tanpa jaringan, tanpa state.
 */
import type { Pengguna, StatusPengguna } from './cashflow'
import { FILTER_INTERNAL, SEGMEN_BELI_KREDIT, SEGMEN_PAKAI_DOMI, URUT_DOMI, nilaiInternal, segmenDomi, urutDomi } from './cashflowPenggunaDomi'
import { SEGMEN_BELUM_WA, STATUS_WA_AKUN, type StatusWaAkun } from './cashflowWa'
import type { KepalaPengguna } from './cashflowBuku'

// ── Nilai yang dikenal server dan URL ────────────────────────────────────
export const SEGMEN_PENGGUNA = ['semua', 'catat7', 'belum', 'ditangguhkan', SEGMEN_BELUM_WA, SEGMEN_PAKAI_DOMI, SEGMEN_BELI_KREDIT] as const
export type SegmenPengguna = typeof SEGMEN_PENGGUNA[number]
export const URUT_PENGGUNA = ['email', 'wa', 'versi', 'daftar', 'aktif', 'ruang', 'tx', 'nominal', ...URUT_DOMI] as const
export type UrutPengguna = typeof URUT_PENGGUNA[number]
export type ArahUrut = 'asc' | 'desc'
/** Urutan yang butuh izin data pribadi (server menolaknya tanpa cashflow:pii). */
export const URUT_PRIBADI: readonly UrutPengguna[] = ['ruang', 'tx', 'nominal', ...URUT_DOMI]
/** Kunci p_filter berisi teks bebas atau status akun. */
export const FILTER_KOLOM = ['email', 'wa', 'versi', 'daftar', 'aktif', 'status'] as const
export const STATUS_AKUN: readonly StatusPengguna[] = ['aktif', 'ditangguhkan', 'menunggu_hapus']
/** Kolom tabel yang kepalanya bisa diklik untuk mengurutkan. Sisanya hanya lewat pilihan "Urut". */
export const URUT_BERKOLOM: readonly UrutPengguna[] = ['email', 'wa', 'versi', 'aktif', 'domi', 'kredit', 'ruang']

export const segmenButuhHitungan = (k: string): boolean => k === 'belum' || k === 'catat7' || segmenDomi(k)
export const arahBawaan = (k: UrutPengguna): ArahUrut => (k === 'email' || k === 'wa' ? 'asc' : 'desc')

export interface KeadaanDaftar {
  /** Server memasang daftar v4 (pemakaian Domi, kredit, akun tim). */
  adaDomi: boolean
  /** Sesi tanpa izin data pribadi: urutan dan segmen berhitungan mati. */
  tanpaHitungan: boolean
}

/** Urutan ini boleh dipakai sekarang? */
export function urutBoleh(k: UrutPengguna, o: KeadaanDaftar): boolean {
  if (urutDomi(k) && !o.adaDomi) return false
  return !(o.tanpaHitungan && URUT_PRIBADI.includes(k))
}

/**
 * Isi pilihan "Urut": semua nilai yang dikenal server. Urutan Domi tidak
 * ditawarkan di server lama. Yang butuh izin tetap terlihat tetapi mati.
 */
export function opsiUrut(o: KeadaanDaftar): Array<{ nilai: UrutPengguna; mati: boolean }> {
  return URUT_PENGGUNA.filter(k => o.adaDomi || !urutDomi(k)).map(k => ({ nilai: k, mati: !urutBoleh(k, o) }))
}

/**
 * Memilih urutan, dari kepala kolom atau dari pilihan "Urut". Kunci yang sama
 * membalik arah, kunci lain memakai arah bawaannya. null = tidak boleh.
 */
export function gantiUrut(kini: { urut: string; arah: ArahUrut }, kunci: string, o: KeadaanDaftar): { urut: UrutPengguna; arah: ArahUrut; hal: 1 } | null {
  const k = URUT_PENGGUNA.find(u => u === kunci)
  if (!k || !urutBoleh(k, o)) return null
  const arah: ArahUrut = kini.urut === k ? (kini.arah === 'asc' ? 'desc' : 'asc') : arahBawaan(k)
  return { urut: k, arah, hal: 1 }
}

/**
 * Isian panel Saring menjadi p_filter. Kunci dan nilainya sama dengan saringan
 * kolom tabel sebelumnya: teks apa adanya, status akun berupa kodenya (isian
 * lama boleh berupa labelnya), status WhatsApp hanya untuk server yang
 * mengenalnya, dan akun tim hanya 'ya' atau 'tidak'.
 */
export function filterServer(
  isian: Readonly<Record<string, string | undefined>>,
  o: { serverStatusWa: boolean; labelStatus?: (s: StatusPengguna) => string },
): Record<string, string> {
  const filter: Record<string, string> = {}
  for (const k of FILTER_KOLOM) {
    const v = isian[k]
    if (!v) continue
    if (k === 'status') {
      const nilai = STATUS_AKUN.find(x => x === v || o.labelStatus?.(x) === v)
      if (nilai) filter[k] = nilai
    } else filter[k] = v
  }
  const statusWa = isian.status_wa
  if (o.serverStatusWa && (STATUS_WA_AKUN as readonly unknown[]).includes(statusWa)) filter.status_wa = statusWa!
  const internal = isian[FILTER_INTERNAL]
  if (nilaiInternal(internal)) filter[FILTER_INTERNAL] = internal
  return filter
}

/** Banyaknya saringan yang sedang diisi (untuk lencana tombol Saring). */
export const jumlahSaringan = (isian: Readonly<Record<string, string | undefined>>): number => Object.values(isian).filter(Boolean).length

// ── Isi baris ────────────────────────────────────────────────────────────
export type NadaTitik = 'baik' | 'awas' | 'netral'
export interface BarisWa {
  nada: NadaTitik
  /** Kunci kamus `pengguna.<kunci>` untuk baris kedua. */
  kunci: 'waTerbukti' | 'waLolos' | 'waLolosTanpaNomor' | 'waBelumBukti'
  /** Tanggal siap tampil untuk `waTerbukti`, selain itu null. */
  pada: string | null
}

/**
 * Status WhatsApp versi singkat untuk baris kedua kolom WhatsApp. Kalimat
 * panjangnya (cara nomor dibuktikan) ada di rincian pengguna. null = server
 * belum mengirim statusnya, jadi baris kedua tidak ditulis.
 */
export function barisWa(p: Pick<Pengguna, 'statusWa'>): BarisWa | null {
  const s = p.statusWa
  if (!s) return null
  if (s.status === 'masuk' || s.status === 'kirim') return { nada: 'baik', kunci: 'waTerbukti', pada: s.padaIso ? s.pada : null }
  if (s.status === 'lewat') return { nada: 'awas', kunci: s.sebabLewat === 'tanpa_nomor' ? 'waLolosTanpaNomor' : 'waLolos', pada: null }
  return { nada: 'netral', kunci: 'waBelumBukti', pada: null }
}

/** '14 Nov 2026' menjadi '14 Nov' bila tahunnya tahun berjalan. Tahun lain tetap ditulis. */
export function tanpaTahunIni(tanggal: string, tahunIni: string | number): string {
  const akhir = ` ${tahunIni}`
  return tanggal.endsWith(akhir) ? tanggal.slice(0, -akhir.length) : tanggal
}

/**
 * Kolom tanpa tempat di tabel yang sedang dipakai mengurutkan. Nilainya
 * ditulis kecil di baris kedua kolom terdekat, supaya urutannya terbaca.
 */
export function tambahanUrut(urut: string): 'tx' | 'nominal' | 'domi_terakhir' | null {
  return urut === 'tx' || urut === 'nominal' || urut === 'domi_terakhir' ? urut : null
}

/** Rupiah ringkas untuk baris kecil: 'Rp 950.000', 'Rp 12,5 jt', 'Rp 1,2 M'. */
export function rupiahRingkas(v: number | null | undefined, bahasa: 'id' | 'en' = 'id'): string {
  if (v == null || !Number.isFinite(v)) return '—'
  const n = Math.abs(v)
  const tanda = v < 0 ? '−' : ''
  const satuan: Array<[number, string, string]> = [[1e12, 'T', 'T'], [1e9, 'M', 'B'], [1e6, 'jt', 'M']]
  for (const [batas, id, en] of satuan) {
    if (n < batas) continue
    const x = Math.round((n / batas) * 10) / 10
    const teks = Number.isInteger(x) ? String(x) : x.toFixed(1)
    return bahasa === 'id' ? `${tanda}Rp ${teks.replace('.', ',')} ${id}` : `${tanda}Rp ${teks}${en}`
  }
  return `${tanda}Rp ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

// ── Bawaan ke halaman rincian ────────────────────────────────────────────
/**
 * Yang dibawa dari baris daftar ke halaman rincian pengguna: cara nomor
 * dibuktikan dan kapan terakhir memakai Domi. Halaman rincian tidak
 * mengambilnya sendiri, jadi keduanya hanya terisi bila orang itu dibuka dari
 * daftar di tab yang sama. Tanpa email, nama, atau nomor.
 */
export interface BawaanRinci {
  id: string
  statusWa: Pengguna['statusWa']
  /** null = server lama, atau sesi tanpa izin data pribadi. */
  domiTerakhir: string | null
  /** Hitungan Domi boleh dibaca dan orang itu memang belum pernah bertanya. */
  domiBelumPernah: boolean
}

export function keBawaanRinci(p: Pengguna): BawaanRinci {
  return {
    id: p.id,
    statusWa: p.statusWa,
    domiTerakhir: p.domi?.terakhirIso ? p.domi.terakhir : null,
    domiBelumPernah: p.domi?.tanya === 0,
  }
}

// ── Rincian di kepala Pengguna 360 ───────────────────────────────────────
/**
 * Dua baris rincian di kepala: cara nomor dibuktikan dan pemakaian Domi.
 * `dariServer` = kepala sendiri yang mengirimnya. Bila tidak (server lama),
 * isinya yang dibawa dari daftar, atau kosong bila halaman dibuka langsung.
 */
export interface RinciKepala {
  /** Siap untuk CashflowStatusWaAkun. null = tidak diketahui. */
  statusWa: StatusWaAkun | null
  /** Tanggal terakhir pakai Domi siap tampil. null = tidak ada yang bisa ditulis. */
  domiTerakhir: string | null
  /** Hitungannya boleh dibaca dan orang itu memang belum pernah bertanya. */
  domiBelumPernah: boolean
  /** Jumlah pertanyaan. Hanya dari kepala, null = tidak dikirim atau tidak boleh tahu. */
  domiTanya: number | null
  /** Kepala mengirim kunci Domi: baris jumlah pertanyaan ditampilkan. */
  domiDariServer: boolean
}

/**
 * Kepala didahulukan. Tanda nomor ramai, kredit ditahan, dan sebab lewat tidak
 * dikirim kepala: ketiganya dipinjam dari baris daftar selama statusnya sama.
 * Hitungan Domi hanya untuk sesi berizin data pribadi, dari sumber mana pun.
 */
export function rinciKepala(
  kepala: Pick<KepalaPengguna, 'statusWa' | 'domi'> | null,
  bawaan: BawaanRinci | null | undefined,
  o: { izinPribadi: boolean; tanggal: (iso: string | null) => string },
): RinciKepala {
  const k = kepala?.statusWa ?? null
  const b = bawaan?.statusWa ?? null
  const sama = k && b && b.status === k.status ? b : null
  const statusWa: StatusWaAkun | null = k
    ? {
        status: k.status,
        pada: o.tanggal(k.padaIso),
        padaIso: k.padaIso,
        sebabLewat: sama?.sebabLewat ?? null,
        nomorRamai: sama?.nomorRamai ?? false,
        kreditDitahan: sama?.kreditDitahan ?? false,
      }
    : b
  const d = kepala?.domi ?? null
  const domiDariServer = d !== null
  if (!o.izinPribadi) return { statusWa, domiTerakhir: null, domiBelumPernah: false, domiTanya: null, domiDariServer }
  if (d) {
    return {
      statusWa,
      domiTerakhir: d.tanya !== null && d.tanya > 0 && d.terakhirIso ? o.tanggal(d.terakhirIso) : null,
      domiBelumPernah: d.tanya === 0,
      domiTanya: d.tanya,
      domiDariServer,
    }
  }
  return {
    statusWa,
    domiTerakhir: bawaan?.domiTerakhir ?? null,
    domiBelumPernah: bawaan?.domiBelumPernah === true,
    domiTanya: null,
    domiDariServer,
  }
}
