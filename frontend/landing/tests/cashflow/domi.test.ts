/**
 * Pembaca percakapan Domi di console (adapters/cashflowDomi.ts): semua blok
 * tergambar, blok asing tidak hilang, foto dipetakan benar, teks dirapikan
 * seperti aplikasi. Data karangan saja.
 */
import { describe, expect, it } from 'vitest'
import {
  alasanDomiOtomatis, barisTeks, kePesanDaftar, keDaftarPercakapan, kolomUang, petaPesanBerfoto,
  rancangDraf, rancangTransaksi, ringkasInfo, susunBlok, type AlatDraf, type SusunanDomi,
} from '~/adapters/cashflowDomi'

const UID = '11111111-1111-4111-8111-111111111111'
const P = '22222222-2222-4222-8222-222222222222'
const J1 = `${UID}/${P}/33333333-3333-4333-8333-333333333331.jpg`
const J2 = `${UID}/${P}/33333333-3333-4333-8333-333333333332.png`
const alat: AlatDraf = {
  t: (k, ...a) => (a.length ? `${k}(${a.join(',')})` : k),
  tanggal: iso => `tgl:${iso}`,
}

describe('alasan kasus anak Domi', () => {
  it('menyebut percakapan Domi dan cap waktu', () => {
    expect(alasanDomiOtomatis(new Date('2026-11-10T01:02:03Z'))).toMatch(/^Percakapan Domi dibuka dari console CashFlow · 2026-11-10 08\.02\.03 WIB$/)
  })
})

describe('keDaftarPercakapan', () => {
  it('bentuk RPC jadi domain, kursor dan total dipertahankan', () => {
    const h = keDaftarPercakapan({
      baris: [{ id: P, judul: 'Belanja', jumlah_pesan: 3, dibuat: '2026-11-01T00:00:00Z', diperbarui: '2026-11-02T00:00:00Z' }],
      kursor_berikut: { d: '2026-11-02T00:00:00Z', i: P }, total: 9, halaman_pertama: true,
    })
    expect(h.baris[0]).toMatchObject({ id: P, judul: 'Belanja', jumlahPesan: 3 })
    expect(h.kursorBerikut).toEqual({ d: '2026-11-02T00:00:00Z', i: P })
    expect(h.total).toBe(9)
  })
  it('bentuk asing tidak melempar', () => {
    expect(keDaftarPercakapan(null).baris).toEqual([])
    expect(keDaftarPercakapan({ baris: [{ judul: 'tanpa id' }] }).baris).toEqual([])
  })
})

describe('kePesanDaftar', () => {
  const dasar = (pesan: unknown[], ekstra = {}) => ({ percakapan: { id: P, judul: 'x', jumlah_pesan: pesan.length, dibuat: '', diperbarui: '' }, pesan, kursor_sebelum: null, ada_lagi: false, halaman_pertama: true, ...ekstra })
  it('pesan pengguna: teks, foto daftar, foto lama satu jalur, teks bawaan gambar disembunyikan', () => {
    const h = kePesanDaftar(dasar([
      { id: 1, peran: 'user', isi: { teks: 'Halo', gambar: true, gambar_jalur: J1, gambar_jalur_daftar: [J1, J2], gambar_jumlah: 3 }, dibuat: '2026-11-01T01:00:00Z' },
      { id: 2, peran: 'user', isi: { teks: 'Tolong baca gambar ini.', gambar: true, gambar_jalur: J1 }, dibuat: '2026-11-01T02:00:00Z' },
      { id: 3, peran: 'user', isi: { teks: 'Tanpa jalur', gambar: true }, dibuat: '2026-11-01T03:00:00Z' },
    ]))
    expect(h.pesan[0]).toMatchObject({ peran: 'user', teks: 'Halo', gambar: true, jalur: [J1, J2], jumlahGambar: 3 })
    expect(h.pesan[1]).toMatchObject({ teks: '', jalur: [J1] })
    expect(h.pesan[2]).toMatchObject({ gambar: true, jalur: [] })
  })
  it('jawaban: blok, saran, info admin, jalur draf', () => {
    const h = kePesanDaftar(dasar([{
      id: 4, peran: 'asisten', dibuat: '2026-11-01T01:00:00Z', model: 'model-uji', token_masuk: 1200, token_keluar: 300, biaya: 79.4,
      isi: { blok: [
        { tipe: 'teks', teks: 'Siap' },
        { tipe: 'draf', aksi: 'struk', kunci: 'k', ruang: { id: P, nama: 'bisnis' }, isi: { toko: 'Toko', total: 5000, subtotal: 5000, item: [{ nama: 'Teh', jumlah: 5000 }], gambar_jalur: J2 } },
        { tipe: 'saran', pilihan: ['Lagi?', 'Cukup'] },
      ] },
    }]))
    const a = h.pesan[0]!
    expect(a.peran).toBe('asisten')
    if (a.peran !== 'asisten') return
    expect(a.jalur).toEqual([J2])
    expect(a.saran).toEqual(['Lagi?', 'Cukup'])
    expect(a.info).toMatchObject({ model: 'model-uji', tokenMasuk: 1200, tokenKeluar: 300, kredit: null })
    expect(a.susunan.map(s => s.jenis)).toEqual(['teks', 'draf'])
    expect(ringkasInfo(a.info, { kredit: n => `kredit ${n}`, token: n => `${n} token` })).toBe('Rp 79 · 1.500 token · model-uji')
  })
  it('kredit tersimpan di isi ditampilkan bila suatu saat ada', () => {
    const h = kePesanDaftar(dasar([{ id: 5, peran: 'asisten', dibuat: '', isi: { kredit_dipakai: 3, blok: [{ tipe: 'teks', teks: 'x' }] } }]))
    const a = h.pesan[0]!
    expect(a.peran === 'asisten' && ringkasInfo(a.info, { kredit: n => `kredit ${n}`, token: n => n })).toBe('kredit 3')
  })
  it('peran alat tidak tampil', () => {
    expect(kePesanDaftar(dasar([{ id: 1, peran: 'alat', isi: {}, dibuat: '' }])).pesan).toEqual([])
  })
})

describe('susunBlok', () => {
  it('teks berurutan jadi satu gelembung, aksi menempel, rupiah jadi satu kertas, utama', () => {
    const s = susunBlok([
      { tipe: 'teks', teks: 'Halo' }, { tipe: 'teks', teks: 'Dunia' }, { tipe: 'aksi', label: 'Buka', tautan: '/anggaran' },
      { tipe: 'angka', label: 'Saldo', nilai: 100000, satuan: 'rupiah', utama: true },
      { tipe: 'angka', label: 'Tagihan', nilai: -5000, satuan: 'rupiah' },
      { tipe: 'angka', label: 'Rasio', nilai: 12.34, satuan: 'persen' },
      { tipe: 'tabel', kolom: ['Nama', 'Total'], baris: [['A', 'Rp 1.000']] },
      { tipe: 'grafik', spec: { jenis: 'garis', judul: 'G', satuan: 'rupiah', data: [{ label: 'a', nilai: 1 }, { label: 'b', nilai: 2 }] } },
      { tipe: 'transaksi', kunci: 'k', draf: { jenis: 'expense', nominal: 5000, catatan: 'Kopi', kategori: 'Makan', gambar_jalur: J1 } },
    ])
    expect(s.map(x => x.jenis)).toEqual(['teks', 'kertas', 'angka', 'tabel', 'grafik', 'transaksi'])
    const t = s[0]!
    expect(t.jenis === 'teks' && t.teks).toEqual(['Halo', 'Dunia'])
    expect(t.jenis === 'teks' && t.aksi).toEqual([{ label: 'Buka', tautan: '/anggaran' }])
    const k = s[1]!
    expect(k.jenis === 'kertas' && k.utama?.label).toBe('Saldo')
    expect(k.jenis === 'kertas' && k.baris.map(b => b.label)).toEqual(['Tagihan'])
  })
  it('blok tidak dikenal dan draf aksi tidak dikenal tampil sebagai kotak nama tipe', () => {
    const s = susunBlok([{ tipe: 'peta_panas', x: 1 }, { tipe: 'draf', aksi: 'pinjam_uang', kunci: 'k', ruang: {}, isi: {} }, { x: 'tanpa tipe' }, null])
    expect(s).toHaveLength(4)
    expect(s.every(x => x.jenis === 'asing')).toBe(true)
    expect(s.map(x => (x as Extract<SusunanDomi, { jenis: 'asing' }>).label)).toEqual(['peta_panas', 'draf:pinjam_uang', 'tanpa-tipe', 'tanpa-tipe'])
  })
  it('blok teks kosong jadi kotak, bukan hilang', () => {
    expect(susunBlok([{ tipe: 'teks', teks: '   ' }])[0]).toMatchObject({ jenis: 'asing' })
  })
  it('draf rencana diterima sebagai aksi', () => {
    const s = susunBlok([{ tipe: 'draf', aksi: 'rencana', kunci: 'k', ruang: { id: P, nama: 'r' }, isi: { nama: 'Nikah', target: 90000000, tenggat: '2027-06-01', pos: [{ nama: 'Gedung', nominal: 30000000 }] } }])
    expect(s[0]).toMatchObject({ jenis: 'draf', aksi: 'rencana' })
    const r = rancangDraf(s[0] as Extract<SusunanDomi, { jenis: 'draf' }>, alat)
    expect(r).toMatchObject({ jenis: 'rencana', nama: 'Nikah', target: 'Rp 90.000.000', tenggat: 'tgl:2027-06-01' })
    expect(r?.jenis === 'rencana' && r.pos).toEqual([{ nama: 'Gedung', nilai: 'Rp 30.000.000' }])
  })
})

describe('rancangDraf: semua jenis tergambar', () => {
  const draf = (aksi: string, isi: Record<string, unknown>) => ({ jenis: 'draf', kunci: 'k', aksi, ruang: 'r', isi, lipatAwal: false }) as Extract<SusunanDomi, { jenis: 'draf' }>
  const contoh: Record<string, Record<string, unknown>> = {
    transfer: { dari_nama: 'A', ke_nama: 'B', nominal: 1000, tanggal: '2026-11-01', catatan: '' },
    ubah_transaksi: { sebelum: { jenis: 'expense', nominal: 1000, kategori: 'Makan', dompet: 'A', tanggal: '2026-11-01', catatan: '' }, sesudah: { jenis: 'expense', nominal: 2000, kategori: 'Makan', dompet: 'A', tanggal: '2026-11-01', catatan: '' } },
    hapus_transaksi: { jenis: 'expense', nominal: 1000, kategori: 'x', dompet: 'A', tanggal: '2026-11-01', catatan: '' },
    buat_jadwal: { nama: 'Listrik', jenis: 'expense', nominal: 200000, irama: 'month', sifat: 'ulang', tanggal: '2026-11-20', dompet: 'A', kategori: 'Tagihan', catatan: '', jumlah: null, sudah_jalan: 0 },
    bayar_jadwal: { judul: 'Listrik', jenis: 'expense', mode: 'bayar', periode: 1, nominal: 200000, dompet: 'A', tanggal: '2026-11-20', tempo: '2026-11-20', biaya: 0 },
    lewati_jadwal: { judul: 'Sewa', sebab: 'tutup', tempo: '2026-11-01', berikut: '2026-12-01' },
    arsip_jadwal: { judul: 'Lama' },
    target_anggaran: { kategori: 'Makan', bulan: '2026-11', nominal: 500000, berulang: true, hentikan_seri: false, sebelum: { nominal: 400000, berulang: false } },
    tambah_dompet: { nama: 'Bank X', jenis: 'bank', saldo_awal: 100000, batas_minus: null },
    tambah_kategori: { nama: 'Kopi', jenis: 'expense' },
    struk: { toko: 'Toko', tanggal: '2026-11-01', dompet_nama: 'A', total: 5000, subtotal: 5000, pajak: 0, layanan: 0, diskon: 0, item: [{ nama: 'Teh', jumlah: 5000, qty: 1, harga: 5000, tambahan: false }] },
    rencana: { nama: 'Nikah', target: 90000000, pos: [{ nama: 'Gedung', nominal: 30000000 }] },
  }
  for (const [aksi, isi] of Object.entries(contoh)) {
    it(`${aksi} tidak null`, () => {
      expect(rancangDraf(draf(aksi, isi), alat)).not.toBeNull()
    })
  }
  it('ubah transaksi mencoret nilai lama yang berubah saja', () => {
    const r = rancangDraf(draf('ubah_transaksi', contoh.ubah_transaksi!), alat)
    expect(r?.jenis === 'kartu' && r.baris.find(b => b.label === 'draf.nominal')?.lama).toBe('Rp 1.000')
    expect(r?.jenis === 'kartu' && r.baris.find(b => b.label === 'draf.kategori')?.lama).toBeNull()
  })
  it('struk: ringkasan, foto jepit, terlipat untuk struk kedua', () => {
    const s = susunBlok([
      { tipe: 'draf', aksi: 'struk', kunci: 'a', ruang: {}, isi: { ...contoh.struk, gambar_jalur: J1, pajak: 500, subtotal: 4500 } },
      { tipe: 'draf', aksi: 'struk', kunci: 'b', ruang: {}, isi: contoh.struk },
    ])
    const satu = rancangDraf(s[0] as Extract<SusunanDomi, { jenis: 'draf' }>, alat)
    const dua = rancangDraf(s[1] as Extract<SusunanDomi, { jenis: 'draf' }>, alat)
    expect(satu?.jenis === 'struk' && satu.jalur).toBe(J1)
    expect(satu?.jenis === 'struk' && satu.ringkasan.map(r => r.label)).toEqual(['draf.strukSubtotal', 'draf.strukPajak'])
    expect(dua?.jenis === 'struk' && dua.lipat).toBe(true)
  })
  it('bentuk rusak jatuh ke null, bukan kartu berbohong', () => {
    expect(rancangDraf(draf('transfer', { nominal: 'banyak' }), alat)).toBeNull()
    expect(rancangDraf(draf('struk', { toko: 'x' }), alat)).toBeNull()
  })
  it('transaksi', () => {
    const r = rancangTransaksi({ jenis: 'income', nominal: 7000, catatan: '', kategori: 'Gaji', gambar_jalur: J1, tanggal: '2026-11-01' }, alat)
    expect(r).toMatchObject({ nama: 'draf.masuk', masuk: true, jalur: J1, nominal: '+Rp 7.000' })
  })
})

describe('teks tersusun', () => {
  it('tebal, poin, judul, uang', () => {
    const b = barisTeks('**Ringkasan**\n- Sisa 3782696 rupiah\nTotal **Rp 5000** ya')
    expect(b[0]).toMatchObject({ jenis: 'judul' })
    expect(b[1]).toMatchObject({ jenis: 'poin' })
    expect(b[1]!.potongan[0]!.teks).toBe('Sisa Rp 3.782.696')
    expect(b[2]!.potongan.map(p => p.tebal)).toEqual([false, true, false])
  })
  it('kolomUang', () => {
    expect(kolomUang('Total belanja')).toBe(true)
    expect(kolomUang('Nama')).toBe(false)
  })
})

describe('petaPesanBerfoto', () => {
  it('hanya pesan berfoto, dipecah 12', () => {
    const pesan = Array.from({ length: 30 }, (_, i) => ({ peran: 'user', id: i + 1, dibuatIso: '', teks: '', gambar: true, jalur: i < 25 ? [J1] : [], jumlahGambar: 1 })) as Parameters<typeof petaPesanBerfoto>[0]
    const paket = petaPesanBerfoto(pesan)
    expect(paket.map(x => x.length)).toEqual([12, 12, 1])
    expect(paket.flat()).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
  })
})
