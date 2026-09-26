/**
 * Perilaku bantu tampilan tab ranah buku (adapters/cashflowTampilBuku.ts):
 * bulan, anggaran (rasio null = tanpa target), kelompok kategori, progres
 * cicilan, saringan produk di memori, dan kuantitas stok pecahan; Fase 3
 * Pengguna 360: durasi jeda antrean, tanggal WIB untuk tautan Jejak, pilihan
 * rentang Perangkat, dan saringan baca Kabar.
 */
import { describe, expect, it } from 'vitest'
import { keKatalog, keUsahaRuang, keJadwalBaris, type KatalogDTO, type ProdukDTO, type JadwalBarisDTO } from '../../adapters/cashflowRanahBuku'
import {
  arsipDariPilihan, bulanWibKini, deltaTeks, geserBulan, kategoriProduk, kelompokkanKategori, kuantitas, labelBulan,
  lebarBilah, nadaAnggaran, nadaKeadaan, progresJadwal, saringProduk, susunAnggaran, SARING_PRODUK_KOSONG,
  durasiSingkat, tanggalWibDariIso, belumDariPilihan, pilihanDariBelum, PILIHAN_BACA_KABAR, PILIHAN_HARI_PERANGKAT,
} from '../../adapters/cashflowTampilBuku'
import { hariSah } from '../../adapters/cashflowPerangkat'

const NOL = '00000000-0000-0000-0000-000000000000'
const kat = (id: string, name: string, kind: string, archived = false) => ({
  id, name, kind, icon: null, color: null, tampilan_tak_sah: false, kode_tak_dikenal: false, archived,
  created_at: '2026-01-01T00:00:00Z', user_id: 'u1', jumlah_transaksi: 1, terakhir_dipakai: null,
})
const ang = (category_id: string, target: number, rasio: number | null, tampil: boolean | null, lingkup: 'kategori' | 'keseluruhan' = 'kategori') => ({
  lingkup, category_id, target, berulang: false, sumber_id: null, tepat_id: null, berulang_id: null, terpakai: 0, rasio,
  kategori_kind: null, kategori_archived: null, tampil_di_aplikasi: tampil,
})

describe('bulan', () => {
  it('geserBulan melintasi tahun dan menolak bentuk lain', () => {
    expect(geserBulan('2026-01', -1)).toBe('2025-12')
    expect(geserBulan('2026-12', 1)).toBe('2027-01')
    expect(geserBulan('2026-09', -21)).toBe('2024-12')
    expect(geserBulan('2026-13', 1)).toBe('2026-13')
    expect(geserBulan('R:2026-01', 1)).toBe('R:2026-01')
  })
  it('bulanWibKini memakai tanggal WIB (UTC+7), bukan UTC', () => {
    expect(bulanWibKini(new Date('2026-09-30T18:00:00Z'))).toBe('2026-10')
    expect(bulanWibKini(new Date('2026-09-30T16:59:00Z'))).toBe('2026-09')
  })
  it('labelBulan menulis nama bulan penuh per bahasa', () => {
    expect(labelBulan('2026-09', 'id')).toMatch(/September 2026/)
    expect(labelBulan('2026-08', 'en')).toMatch(/August 2026/)
    expect(labelBulan('salah', 'id')).toBe('salah')
  })
})

describe('anggaran', () => {
  it('rasio null = tanpa target (bukan 0%); nada dari rasio server', () => {
    expect(nadaAnggaran(null)).toBe('tanpa-target')
    expect(lebarBilah(null)).toBe(0)
    expect(nadaAnggaran(0.5)).toBe('aman')
    expect(nadaAnggaran(0.8)).toBe('dekat')
    expect(nadaAnggaran(1.2)).toBe('lewat')
    expect(lebarBilah(1.2)).toBe(100)
    expect(lebarBilah(0.8067)).toBe(81)
  })
  it('susunAnggaran: keseluruhan dulu, lalu yang tampil di aplikasi, lalu yang tidak; nama dari kategori', () => {
    const d: KatalogDTO = {
      kasus: 'k', workspace_id: 'w', bulan: '2026-09',
      kategori: [kat('c1', 'Makan', 'expense'), kat('c2', 'Gaji', 'income'), kat('c3', 'Belanja', 'expense')],
      anggaran: [ang('c2', 100, 0, false), ang('c1', 100, 0.5, true), ang(NOL, 500, null, null, 'keseluruhan'), ang('c3', 100, 1.1, true), ang('cx', 1, 0, true)],
      baris_anggaran: [], terpotong: { kategori: false, baris_anggaran: false },
    }
    const s = susunAnggaran(keKatalog(d), 'Semua')
    expect(s.map(a => a.nama)).toEqual(['Semua', 'Belanja', 'cx', 'Makan', 'Gaji'])
    expect(s[0]!.keseluruhan).toBe(true)
    expect(s[0]!.rasio).toBeNull()
    expect(s.at(-1)!.tampilDiAplikasi).toBe(false)
  })
  it('kelompokkanKategori: pengeluaran, pemasukan, lalu jenis tak dikenal; kelompok kosong dibuang', () => {
    const k = keKatalog({
      kasus: 'k', workspace_id: 'w', bulan: '2026-09', anggaran: [], baris_anggaran: [], terpotong: { kategori: false, baris_anggaran: false },
      kategori: [kat('a', 'A', 'income'), kat('b', 'B', 'expense'), kat('c', 'C', 'aneh')],
    })
    expect(kelompokkanKategori(k.kategori).map(g => [g.arah, g.kategori.map(c => c.id)])).toEqual([['keluar', ['b']], ['masuk', ['a']], ['lain', ['c']]])
    expect(kelompokkanKategori(k.kategori.filter(c => c.id === 'b')).map(g => g.arah)).toEqual(['keluar'])
  })
})

describe('jadwal', () => {
  const j = (total: number | null, paid: number, skipped = 0) => keJadwalBaris({
    id: 's', user_id: null, wallet_id: null, dompet_nama: null, category_id: null, kategori_nama: null, title: 'x', kind: 'expense', amount: 1,
    cadence: 'month', anchor_day: 5, anchor_month: null, start_on: null, next_due: null, total_count: total, paid_count: paid, skipped_count: skipped,
    partial_paid: 0, dibayar_tercatat: 0, dibayar_awal: 0, progress_reset_at: null, archived: false, created_at: '', ada_catatan: false,
    jumlah_pembayaran: 0, jumlah_dilewati: 0, jumlah_penyesuaian: 0, pembayaran_di_sampah: 0, tempo_sekarang: null, next_due_basi: false,
    terlambat: false, selesai: false, keadaan: 'akan-datang', kode_tak_dikenal: false,
  } satisfies JadwalBarisDTO)
  it('progres cicilan "10 dari 24" dari angka server; berulang tanpa total', () => {
    expect(progresJadwal(j(24, 10, 1))).toEqual({ jenis: 'cicilan', dibayar: 10, dilewati: 1, total: 24, persen: 42 })
    expect(progresJadwal(j(null, 7))).toEqual({ jenis: 'berulang', dibayar: 7, dilewati: 0, total: null, persen: null })
    expect(progresJadwal(j(12, 15)).persen).toBe(100)
  })
  it('arsipDariPilihan = p_arsip server', () => {
    expect(arsipDariPilihan('semua')).toBeNull()
    expect(arsipDariPilihan('aktif')).toBe(false)
    expect(arsipDariPilihan('arsip')).toBe(true)
  })
  it('nada keadaan: terlambat bahaya, hari ini emas, selesai hijau', () => {
    expect(nadaKeadaan('terlambat')).toBe('bahaya')
    expect(nadaKeadaan('hari-ini')).toBe('emas')
    expect(nadaKeadaan('selesai')).toBe('hijau')
    expect(nadaKeadaan('arsip')).toBe('netral')
    expect(nadaKeadaan(null)).toBe('netral')
  })
})

describe('usaha', () => {
  const p = (id: string, name: string, kategori: string | null, o: Partial<ProdukDTO> = {}): ProdukDTO => ({
    id, user_id: null, name, unit: null, kategori, ada_kategori: !!kategori, sell_price: null, cost_price: null, track_stock: true, stok_min: null,
    archived: false, created_at: '', masuk: 0, keluar: 0, penyesuaian: 0, stok: 0, menipis: false, minus: false, jumlah_terjual: 0,
    terakhir_terjual: null, ada_foto: false, ...o,
  })
  const u = keUsahaRuang({
    kasus: 'k', workspace_id: 'w', terpotong: false, ringkas: { total: 4, aktif: 4, arsip: 0, berstok: 4, menipis: 1, minus: 1 },
    produk: [p('1', 'Beras 5kg', 'Sembako'), p('2', 'Gula', 'Sembako', { menipis: true }), p('3', 'Sabun', 'Mandi', { minus: true, stok: -2 }), p('4', 'Es batu', null)],
  })
  it('kategoriProduk: chip urut nama dengan jumlah, tanpa kategori tidak ikut', () => {
    expect(kategoriProduk(u.produk)).toEqual([{ nama: 'Mandi', jumlah: 1 }, { nama: 'Sembako', jumlah: 2 }])
  })
  it('saringProduk: cari nama tanpa peka huruf, kategori, dan menipis/minus', () => {
    expect(saringProduk(u.produk, SARING_PRODUK_KOSONG).length).toBe(4)
    expect(saringProduk(u.produk, { ...SARING_PRODUK_KOSONG, cari: ' BERAS ' }).map(x => x.id)).toEqual(['1'])
    expect(saringProduk(u.produk, { ...SARING_PRODUK_KOSONG, kategori: 'Sembako' }).map(x => x.id)).toEqual(['1', '2'])
    expect(saringProduk(u.produk, { ...SARING_PRODUK_KOSONG, perhatian: true }).map(x => x.id)).toEqual(['2', '3'])
  })
  it('kuantitas tidak membulatkan pecahan; delta bertanda +/−', () => {
    expect(kuantitas(2.5, 'id')).toBe('2,5')
    expect(kuantitas(1234.5, 'en')).toBe('1,234.5')
    expect(kuantitas(null)).toBe('—')
    expect(deltaTeks(-2)).toBe('−2')
    expect(deltaTeks(3)).toBe('+3')
    expect(deltaTeks(0)).toBe('0')
    expect(deltaTeks(-1.5, n => kuantitas(n, 'id'))).toBe('−1,5')
  })
})

describe('Perangkat & Kabar', () => {
  it('durasiSingkat: detik → dtk/mnt/jam/hari (jam sampai < 2 hari), tanda negatif, null = —', () => {
    expect(durasiSingkat(0)).toBe('0 dtk')
    expect(durasiSingkat(48)).toBe('48 dtk')
    expect(durasiSingkat(60)).toBe('1 mnt')
    expect(durasiSingkat(3599)).toBe('60 mnt')
    expect(durasiSingkat(21540)).toBe('6 jam')
    expect(durasiSingkat(86400 * 2 - 1)).toBe('48 jam')
    expect(durasiSingkat(86400 * 3)).toBe('3 hari')
    expect(durasiSingkat(-120)).toBe('−2 mnt')
    expect(durasiSingkat(90, 'en')).toBe('2 min')
    expect(durasiSingkat(null)).toBe('—')
    expect(durasiSingkat(Number.NaN)).toBe('—')
  })
  it('tanggalWibDariIso: hari WIB (UTC+7), bukan UTC; rusak → null', () => {
    expect(tanggalWibDariIso('2026-09-24T17:30:00Z')).toBe('2026-09-25')
    expect(tanggalWibDariIso('2026-09-24T16:59:59Z')).toBe('2026-09-24')
    expect(tanggalWibDariIso('bukan-tanggal')).toBeNull()
    expect(tanggalWibDariIso(null)).toBeNull()
  })
  it('rentang Perangkat selalu sah untuk p_hari (1..90)', () => {
    for (const n of PILIHAN_HARI_PERANGKAT) expect(hariSah(n)).toBe(true)
  })
  it('saringan baca Kabar: belum = true, sudah = false, semua = null — bolak-balik', () => {
    expect(PILIHAN_BACA_KABAR.map(belumDariPilihan)).toEqual([null, true, false])
    for (const p of PILIHAN_BACA_KABAR) expect(pilihanDariBelum(belumDariPilihan(p))).toBe(p)
  })
})
