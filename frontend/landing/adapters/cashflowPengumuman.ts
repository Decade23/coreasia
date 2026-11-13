import type { AturanDTO } from './cashflowPengumumanAturan'

export interface SimpanPengumuman {
  id: string
  versi: string | null
  judul: string
  isi: string
  level: string
  mulai: string
  sampai: string | null
  tombol: string | null
  url: string | null
  alasan: string
  penerima?: JenisPenerima
  pengguna?: string[]
  kelompok?: string[]
  /** Hanya untuk penerima `aturan` (admin_simpan_pengumuman_v4 p_aturan). */
  aturan?: AturanDTO | null
}

export function statusPengumuman(p: { mulai: string; sampai: string | null }, kini = Date.now()): 'terjadwal' | 'aktif' | 'berakhir' {
  if (p.sampai && Date.parse(p.sampai) <= kini) return 'berakhir'
  return Date.parse(p.mulai) > kini ? 'terjadwal' : 'aktif'
}

/** `aturan` hanya ada di server yang memasang sasaran berbasis aturan (v4). */
export type JenisPenerima = 'all' | 'single' | 'users' | 'groups' | 'aturan'
export interface KelompokPengumuman { id: string; name: string; updated_at: string; members: number; user_ids?: string[] }
export interface AkunPenerima { id: string; email: string }
export interface HalamanPenerima<T> { total: number; baris: T[] }
/** Label ID/EN-nya milik kamus (pengumuman.penerimaOpsi). `label` tinggal untuk pemakai lama. */
export const PILIHAN_PENERIMA = [
  { id: 'all', label: 'Semua pengguna' }, { id: 'single', label: 'Pengguna tertentu' },
  { id: 'users', label: 'Beberapa pengguna' }, { id: 'groups', label: 'Kelompok' },
  { id: 'aturan', label: 'Otomatis dengan aturan' },
] as const
/** `aturan`: sah bila editor aturan sudah menghasilkan p_aturan yang terbaca (bukan null). */
export function penerimaSah(jenis: JenisPenerima, pengguna: string[], kelompok: string[], aturan: AturanDTO | null = null) {
  if (jenis === 'aturan') return aturan !== null
  if (jenis === 'all') return true
  if (jenis === 'single') return pengguna.length === 1
  if (jenis === 'users') return pengguna.length > 0 && pengguna.length <= 1000
  return jenis === 'groups' && kelompok.length > 0 && kelompok.length <= 100
}
