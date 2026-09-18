/**
 * Urut, saring kolom, dan paginasi daftar console CashFlow — fungsi murni.
 *
 * Urutannya wajib: saring → urut → potong per halaman. Kalau tabel yang
 * mengurutkan baris yang sudah dipotong, urutan hanya berlaku di 25 baris
 * yang tampil, dan "terbaru" di halaman 2 bisa lebih baru dari halaman 1.
 * Urut juga memakai nilai MENTAH (ISO, angka), bukan teks tampilan: '3 Sep
 * 2026' < '28 Agu 2026' secara teks, dan itu salah.
 */

export type Arah = 'asc' | 'desc'
export type JenisUrut = 'angka' | 'waktu' | 'teks'
export interface AturanUrut<T> {
  jenis: JenisUrut
  nilai: (baris: T) => string | number | null | undefined
}
export interface KolomSaring { key: string; type?: string }

const kosong = (v: unknown) => v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v))

function keNilai(jenis: JenisUrut, v: string | number | null | undefined): string | number | null {
  if (kosong(v)) return null
  if (jenis === 'angka') { const n = Number(v); return Number.isFinite(n) ? n : null }
  if (jenis === 'waktu') { const t = typeof v === 'number' ? v : Date.parse(String(v)); return Number.isNaN(t) ? null : t }
  return String(v).toLocaleLowerCase('id-ID')
}

/** Urutan stabil; nilai kosong SELALU di bawah (arah apa pun) — "belum pernah
 *  aktif" bukan yang paling baru maupun paling lama. Seri diputus `pemutus`
 *  (mis. id) supaya urutan sama di setiap muat. */
export function urutkan<T>(baris: readonly T[], aturan: AturanUrut<T>, arah: Arah, pemutus?: (b: T) => string): T[] {
  const kali = arah === 'asc' ? 1 : -1
  return baris
    .map(b => ({ b, v: keNilai(aturan.jenis, aturan.nilai(b)) }))
    .sort((x, y) => {
      if (x.v === null && y.v === null) return 0
      if (x.v === null) return 1
      if (y.v === null) return -1
      const beda = typeof x.v === 'number' && typeof y.v === 'number'
        ? x.v - y.v
        : String(x.v).localeCompare(String(y.v), 'id-ID')
      if (beda !== 0) return beda * kali
      return pemutus ? pemutus(x.b).localeCompare(pemutus(y.b)) : 0
    })
    .map(x => x.b)
}

/** Semantik sama dengan saringan internal DataTable: status/badge = cocok
 *  persis, lainnya = memuat (tanpa beda huruf besar). Dijalankan atas SEMUA
 *  baris, bukan halaman yang tampil. */
export function saringKolom<T extends object>(baris: readonly T[], saringan: Record<string, string>, kolom: readonly KolomSaring[]): T[] {
  let hasil = [...baris]
  for (const [key, isi] of Object.entries(saringan)) {
    if (!isi) continue
    const col = kolom.find(c => c.key === key)
    if (!col) continue
    const q = isi.toLowerCase()
    hasil = hasil.filter((row) => {
      const v = (row as Record<string, unknown>)[key]
      if (col.type === 'status' || col.type === 'badge') return String(v).toLowerCase() === q
      return v != null && String(v).toLowerCase().includes(q)
    })
  }
  return hasil
}

export function jumlahHalaman(total: number, per: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, per)))
}

/** Halaman yang benar-benar ditampilkan: di antara 1 dan halaman terakhir. */
export function halamanAman(hal: number, total: number, per: number): number {
  const h = Number.isFinite(hal) ? Math.trunc(hal) : 1
  return Math.min(Math.max(1, h), jumlahHalaman(total, per))
}

export function potongHalaman<T>(baris: readonly T[], hal: number, per: number): T[] {
  const h = halamanAman(hal, baris.length, per)
  return baris.slice((h - 1) * per, h * per)
}
