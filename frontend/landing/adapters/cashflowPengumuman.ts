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
}

export function statusPengumuman(p: { mulai: string; sampai: string | null }, kini = Date.now()): 'terjadwal' | 'aktif' | 'berakhir' {
  if (p.sampai && Date.parse(p.sampai) <= kini) return 'berakhir'
  return Date.parse(p.mulai) > kini ? 'terjadwal' : 'aktif'
}
