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
}

export function statusPengumuman(p: { mulai: string; sampai: string | null }, kini = Date.now()): 'terjadwal' | 'aktif' | 'berakhir' {
  if (p.sampai && Date.parse(p.sampai) <= kini) return 'berakhir'
  return Date.parse(p.mulai) > kini ? 'terjadwal' : 'aktif'
}

export type JenisPenerima = 'all' | 'single' | 'users' | 'groups'
export interface KelompokPengumuman { id: string; name: string; updated_at: string; members: number; user_ids?: string[] }
export interface AkunPenerima { id: string; email: string }
export interface HalamanPenerima<T> { total: number; baris: T[] }
export const PILIHAN_PENERIMA = [
  { id: 'all', label: 'Semua pengguna' }, { id: 'single', label: 'Pengguna tertentu' },
  { id: 'users', label: 'Beberapa pengguna' }, { id: 'groups', label: 'Kelompok' },
] as const
export function penerimaSah(jenis: JenisPenerima, pengguna: string[], kelompok: string[]) {
  if (jenis === 'all') return true
  if (jenis === 'single') return pengguna.length === 1
  if (jenis === 'users') return pengguna.length > 0 && pengguna.length <= 1000
  return jenis === 'groups' && kelompok.length > 0 && kelompok.length <= 100
}
