/**
 * Urut dan paginasi daftar console: urut atas nilai MENTAH, sebelum dipotong.
 */
import { describe, expect, it } from 'vitest'
import { urutkan, potongHalaman, halamanAman, jumlahHalaman, saringKolom, type AturanUrut } from '../../adapters/cashflowDaftar'
import { kePengguna, type PenggunaDTO } from '../../adapters/cashflow'

const dto = (i: number, created: string, aktif: string | null, tx: number): PenggunaDTO => ({
  user_id: `u${String(i).padStart(2, '0')}`, email: `orang${i}***@contoh.id`, display_name: '', created_at: created,
  last_sign_in: null, aktivitas_terakhir: aktif, terbuka: false, banned_until: null,
  jumlah_ruang: 1, jumlah_tx: tx, total_semua: 60,
})

describe('urutkan', () => {
  // '3 Sep 2026' vs '28 Agu 2026': urut teks tampilan menaruh 28 Agu setelah 3 Sep.
  const baris = [
    kePengguna(dto(1, '2026-08-28T10:00:00+00:00', null, 5)),
    kePengguna(dto(2, '2026-09-03T10:00:00+00:00', '2026-09-10T01:00:00+00:00', 50)),
    kePengguna(dto(3, '2026-09-10T10:00:00.5+00:00', '2026-09-11T01:00:00+00:00', 9)),
  ]
  const daftar: AturanUrut<typeof baris[number]> = { jenis: 'waktu', nilai: p => p.daftarIso }

  it('waktu diurut sebagai waktu, bukan teks tanggal', () => {
    expect(urutkan(baris, daftar, 'desc').map(p => p.id)).toEqual(['u03', 'u02', 'u01'])
    expect(urutkan(baris, daftar, 'asc').map(p => p.id)).toEqual(['u01', 'u02', 'u03'])
  })

  it('angka diurut sebagai angka (9 < 50)', () => {
    const tx: AturanUrut<typeof baris[number]> = { jenis: 'angka', nilai: p => p.tx }
    expect(urutkan(baris, tx, 'desc').map(p => p.tx)).toEqual([50, 9, 5])
  })

  it('nilai kosong selalu di bawah, arah apa pun', () => {
    const aktif: AturanUrut<typeof baris[number]> = { jenis: 'waktu', nilai: p => p.aktivitasTerakhirIso }
    expect(urutkan(baris, aktif, 'desc').map(p => p.id)).toEqual(['u03', 'u02', 'u01'])
    expect(urutkan(baris, aktif, 'asc').map(p => p.id)).toEqual(['u02', 'u03', 'u01'])
  })

  it('seri diputus pemutus supaya stabil', () => {
    const sama = [{ id: 'b', n: 1 }, { id: 'a', n: 1 }, { id: 'c', n: 2 }]
    const r = urutkan(sama, { jenis: 'angka', nilai: x => x.n }, 'asc', x => x.id)
    expect(r.map(x => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('tidak mengubah larik asal', () => {
    const salin = [...baris]
    urutkan(baris, daftar, 'asc')
    expect(baris).toEqual(salin)
  })
})

describe('urut lintas halaman', () => {
  // 60 orang, terdaftar satu per hari; server mengirim acak.
  const semua = Array.from({ length: 60 }, (_, i) => {
    const hari = String((i % 30) + 1).padStart(2, '0')
    const bulan = i < 30 ? '08' : '09'
    return kePengguna(dto(i, `2026-${bulan}-${hari}T05:00:00+00:00`, null, i))
  }).sort((a, b) => a.id.localeCompare(b.id) * ((a.tx ?? 0) % 2 ? 1 : -1))
  const aturan: AturanUrut<typeof semua[number]> = { jenis: 'waktu', nilai: p => p.daftarIso }

  it('halaman 1 memuat 25 terbaru dari SEMUA baris, halaman 2 melanjutkannya', () => {
    const terurut = urutkan(semua, aturan, 'desc')
    const h1 = potongHalaman(terurut, 1, 25)
    const h2 = potongHalaman(terurut, 2, 25)
    const h3 = potongHalaman(terurut, 3, 25)
    expect(h1).toHaveLength(25)
    expect(h2).toHaveLength(25)
    expect(h3).toHaveLength(10)
    expect(h1[0]!.daftarIso).toBe('2026-09-30T05:00:00+00:00')
    // Baris terakhir halaman 1 lebih baru dari baris pertama halaman 2.
    expect(Date.parse(h1[24]!.daftarIso)).toBeGreaterThan(Date.parse(h2[0]!.daftarIso))
    expect(h3.at(-1)!.daftarIso).toBe('2026-08-01T05:00:00+00:00')
  })
})

describe('paginasi', () => {
  it('jumlah halaman minimal 1', () => {
    expect(jumlahHalaman(0, 25)).toBe(1)
    expect(jumlahHalaman(25, 25)).toBe(1)
    expect(jumlahHalaman(26, 25)).toBe(2)
  })
  it('halaman di luar rentang dijepit, bukan kosong', () => {
    expect(halamanAman(9, 30, 25)).toBe(2)
    expect(halamanAman(0, 30, 25)).toBe(1)
    expect(halamanAman(Number.NaN, 30, 25)).toBe(1)
    expect(potongHalaman([1, 2, 3], 5, 2)).toEqual([3])
  })
})

describe('saringKolom atas seluruh baris', () => {
  const baris = Array.from({ length: 40 }, (_, i) => ({ email: `o${i}***@contoh.id`, status: i % 10 === 0 ? 'Ditangguhkan' : 'Aktif' }))
  const kolom = [{ key: 'email', type: 'text' }, { key: 'status', type: 'status' }]

  it('status = cocok persis, teks = memuat', () => {
    expect(saringKolom(baris, { status: 'ditangguhkan' }, kolom)).toHaveLength(4)
    expect(saringKolom(baris, { email: 'o3' }, kolom).map(b => b.email)).toEqual(
      ['o3***@contoh.id', 'o30***@contoh.id', 'o31***@contoh.id', 'o32***@contoh.id', 'o33***@contoh.id',
        'o34***@contoh.id', 'o35***@contoh.id', 'o36***@contoh.id', 'o37***@contoh.id', 'o38***@contoh.id', 'o39***@contoh.id'])
  })
  it('saringan kosong atau kolom tak dikenal diabaikan', () => {
    expect(saringKolom(baris, { email: '', entah: 'x' }, kolom)).toHaveLength(40)
  })
})
