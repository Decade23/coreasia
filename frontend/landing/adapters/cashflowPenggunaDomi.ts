/**
 * Pemakaian Domi per akun di daftar pengguna (admin_daftar_pengguna_v4).
 *
 * v4 = v3 ditambah per baris: jumlah pertanyaan ke Domi (seumur akun dan 30
 * hari terakhir, dengan tanda bila angkanya batas bawah), kapan terakhir
 * bertanya, sisa kredit, jumlah pembelian kredit yang lunas, dan tanda akun
 * tim. Kepala hasil membawa jumlah_pakai_domi: dihitung atas seluruh daftar
 * tanpa akun tim, tidak ikut cari, segmen, atau saringan. Server yang belum memasang v4 dijawab lewat v3: kolom,
 * urutan, segmen, dan saringan di berkas ini tidak ditawarkan sama sekali.
 *
 * Tanpa izin cashflow:pii server memulangkan hitungan dan kredit sebagai
 * null, dan menolak urut atau segmen yang memakainya (sama dengan ruang, tx,
 * nominal). Tanda akun tim dan saringannya tetap ada tanpa izin itu. null di sini selalu berarti "tidak boleh tahu", bukan 0.
 *
 * Fungsi murni semua: tanpa jaringan, tanpa state.
 */
import { tanggalPendek, type BahasaWaktu } from './cashflowWaktu'

/** Nilai p_urut yang hanya dikenal v4. Semuanya butuh cashflow:pii. */
export const URUT_DOMI = ['domi', 'domi_terakhir', 'kredit'] as const
export type UrutDomi = typeof URUT_DOMI[number]
/** Nilai p_segmen yang hanya dikenal v4. Keduanya butuh cashflow:pii. */
export const SEGMEN_PAKAI_DOMI = 'pakai_domi' as const
export const SEGMEN_BELI_KREDIT = 'beli_kredit' as const
export const SEGMEN_DOMI: readonly string[] = [SEGMEN_PAKAI_DOMI, SEGMEN_BELI_KREDIT]
/** Kunci p_filter untuk akun tim dan nilainya. Tidak butuh pii. */
export const FILTER_INTERNAL = 'internal' as const
export const NILAI_INTERNAL = ['tidak', 'ya'] as const
export type NilaiInternal = typeof NILAI_INTERNAL[number]

export const urutDomi = (v: unknown): v is UrutDomi => (URUT_DOMI as readonly unknown[]).includes(v)
export const segmenDomi = (v: unknown): boolean => SEGMEN_DOMI.includes(v as string)
export const nilaiInternal = (v: unknown): v is NilaiInternal => (NILAI_INTERNAL as readonly unknown[]).includes(v)

/** Daftar memakai sesuatu yang hanya dikenal v4? Server lama harus melepasnya dulu. */
export function butuhV4(q: { urut: string; seg: string }, filter: Readonly<Record<string, string | undefined>>): boolean {
  return urutDomi(q.urut) || segmenDomi(q.seg) || !!filter[FILTER_INTERNAL]
}

/** Kolom baris yang dibaca di sini. Semuanya TIDAK ADA di jawaban v3. */
export interface DomiAkunDTO {
  domi_tanya?: number | string | null
  domi_tanya_30?: number | string | null
  /** true = domi_tanya batas bawah: orang itu pernah menghapus sebagian riwayatnya. */
  domi_tanya_kira?: boolean | null
  /** Dibulatkan server ke tanggal bila kontak tidak dibuka. */
  domi_terakhir?: string | null
  kredit_sisa?: number | string | null
  kredit_beli?: number | string | null
  internal?: boolean | null
}
/** Kepala hasil v4. null = sesi tanpa pii. */
export interface KepalaDomiDTO { jumlah_pakai_domi?: number | string | null }

export interface DomiAkun {
  /** Pertanyaan ke Domi seumur akun. null = tidak boleh tahu. */
  tanya: number | null
  /** Angka `tanya` paling sedikit segitu (ditulis "42+"). false bila hitungannya ditahan. */
  kira: boolean
  /** 30 hari terakhir, tidak pernah lebih dari `tanya`. */
  tanya30: number | null
  /** '13 Nov 2026', '—' bila belum pernah atau tidak boleh tahu. */
  terakhir: string
  terakhirIso: string | null
  /** null juga untuk akun yang belum punya catatan kredit sama sekali: garis, bukan 0. */
  kreditSisa: number | null
  /** Jumlah pembelian kredit yang lunas. */
  kreditBeli: number | null
}

/** Bilangan bulat tak negatif, atau null untuk kosong dan nilai yang tak terbaca. */
function cacah(v: unknown): number | null {
  if (v == null || v === '' || typeof v === 'boolean') return null
  const x = Number(v)
  return Number.isFinite(x) ? Math.max(0, Math.trunc(x)) : null
}

/** Server sudah mengirim kolom Domi di baris ini? (v3 tidak mengirimnya.) */
export const adaKolomDomi = (d: DomiAkunDTO): boolean => d.domi_tanya !== undefined

/** null = server belum mengirim kolom Domi (jawaban v3). */
export function keDomiAkun(d: DomiAkunDTO, bahasa: BahasaWaktu = 'id'): DomiAkun | null {
  if (!adaKolomDomi(d)) return null
  const tanya = cacah(d.domi_tanya)
  const tiga = cacah(d.domi_tanya_30)
  // Tanggal hanya bermakna bila hitungannya boleh dibaca dan memang pernah bertanya.
  const iso = tanya === null || typeof d.domi_terakhir !== 'string' || Number.isNaN(Date.parse(d.domi_terakhir)) ? null : d.domi_terakhir
  return {
    tanya,
    kira: tanya !== null && d.domi_tanya_kira === true,
    tanya30: tanya === null || tiga === null ? null : Math.min(tiga, tanya),
    terakhir: tanggalPendek(iso, bahasa),
    terakhirIso: iso,
    kreditSisa: cacah(d.kredit_sisa),
    kreditBeli: cacah(d.kredit_beli),
  }
}

/** Akun tim. Hanya `true` yang dihitung, supaya jawaban v3 tidak memberi lencana. */
export const akunTim = (d: DomiAkunDTO): boolean => d.internal === true

/** Angka "sudah pakai Domi" dari kepala hasil. null = tidak dikirim atau tidak boleh tahu. */
export const jumlahPakaiDomi = (kepala: KepalaDomiDTO | null | undefined): number | null => cacah(kepala?.jumlah_pakai_domi)

/**
 * Buang hitungan Domi dan kredit dari baris yang sudah di layar, tanpa
 * jaringan: dipakai saat izin pii hilang di tengah sesi. Kolom yang tidak
 * dikirim server tetap tidak ada, dan tanda akun tim dibiarkan.
 */
export function tanpaHitunganDomi<T extends DomiAkunDTO>(d: T): T {
  if (!adaKolomDomi(d)) return d
  return { ...d, domi_tanya: null, domi_tanya_30: null, domi_tanya_kira: null, domi_terakhir: null, kredit_sisa: null, kredit_beli: null }
}

/**
 * Baca daftar lewat v4, jatuh ke v3 bila v4 belum ada di server.
 *
 * `kenalV4`: yang sudah diketahui tentang server (null = belum tahu, false =
 * v4 tidak ada, jadi langsung v3). `butuh` = permintaan memakai urut, segmen,
 * atau saringan yang hanya dikenal v4. Di server lama permintaan seperti itu
 * tidak dikirim ke v3 (v3 akan menolaknya): `hasil` null, dan pemanggil
 * melepas pilihannya lalu memuat ulang.
 *
 * Hanya "RPC belum ada" yang memicu jatuh-mundur. Galat lain dari v4 (izin,
 * saringan, sesi) diteruskan apa adanya.
 */
export async function bacaDaftarBerjenjang<T>(o: {
  kenalV4: boolean | null
  butuh: boolean
  v4: () => Promise<T>
  v3: () => Promise<T>
}): Promise<{ hasil: T | null; v4: boolean }> {
  if (o.kenalV4 !== false) {
    try {
      return { hasil: await o.v4(), v4: true }
    } catch (e) {
      if ((e as { jenis?: unknown } | null)?.jenis !== 'belum-aktif') throw e
    }
  }
  if (o.butuh) return { hasil: null, v4: false }
  return { hasil: await o.v3(), v4: false }
}
