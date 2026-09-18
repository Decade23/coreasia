/**
 * Kontrak adapter detail pengguna terhadap bentuk jawaban server SEBENARNYA.
 *
 * Contoh di bawah meniru persis jsonb_build_object di
 * admin_detail_pengguna_bangun (cashflow/supabase/migrations/0082:145-171):
 * - kunci atas: user_id, email, display_name (''), created_at, last_sign_in,
 *   banned_until, ruang, jumlah;
 * - ruang[] HANYA {workspace_id, nama, peran, pemilik, anggota} — tanpa angka;
 * - jumlah{} = transaksi/pemasukan/pengeluaran/dompet/jadwal yang DICATAT
 *   pengguna ini (t.user_id), termasuk kaki transfer.
 * Disimpan sebagai TEKS JSON supaya yang diuji persis apa yang diterima
 * peramban dari PostgREST (timestamptz berformat +00:00, numeric jadi angka).
 * Bentuk kuncinya DIBANDINGKAN dengan definisi terakhir fungsi itu di folder
 * migrasi (tests/cashflow/migrasi.ts) — contoh yang menyimpang dari server
 * membuat uji merah, bukan diam-diam dipercaya.
 *
 * Bug yang dikunci uji ini: adapter lama menjumlah ruang[].transaksi dan
 * kawan-kawan — kolom yang tidak pernah dikirim server — sehingga ubin
 * Transaksi/Masuk/Keluar selalu 0 dan kolom per ruang kosong.
 */
import { describe, expect, it } from 'vitest'
import { keDetailPengguna, jedaDaftarKeCatatan, type DetailPenggunaDTO } from '../../adapters/cashflow'
import { adaMigrasi, DIR_MIGRASI, fungsiTerakhir, pohonJsonb, pohonContoh, urutPohon } from './migrasi'

const JAWABAN_SERVER = `{
  "user_id": "3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f",
  "email": "dedi@contoh.id",
  "display_name": "",
  "created_at": "2026-09-01T16:30:00.123456+00:00",
  "last_sign_in": "2026-09-17T18:45:10.5+00:00",
  "banned_until": null,
  "ruang": [
    {"workspace_id": "0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e", "nama": "Keuangan Saya", "peran": "owner", "pemilik": true, "anggota": 1},
    {"workspace_id": "7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f", "nama": "Warung Bu Sri", "peran": "member", "pemilik": false, "anggota": 2}
  ],
  "jumlah": {"transaksi": 42, "pemasukan": 1500000.00, "pengeluaran": 275000.50, "dompet": 3, "jadwal": 1}
}`

const contoh = (): DetailPenggunaDTO => JSON.parse(JAWABAN_SERVER) as DetailPenggunaDTO

describe('kontrak DetailPenggunaDTO ↔ admin_detail_pengguna_bangun', () => {
  it.skipIf(!adaMigrasi)(`contoh memuat persis kunci jsonb_build_object di migrasi (${DIR_MIGRASI})`, () => {
    const { badan } = fungsiTerakhir('admin_detail_pengguna_bangun')
    expect(urutPohon(pohonContoh(JSON.parse(JAWABAN_SERVER)))).toEqual(urutPohon(pohonJsonb(badan)))
  })

  it('ubin memakai jumlah{} dari server, bukan penjumlahan ruang[]', () => {
    const d = keDetailPengguna(contoh())
    expect(d.jumlah.transaksi).toBe(42)
    expect(d.jumlah.pemasukan).toBe(1500000)
    expect(d.jumlah.pengeluaran).toBe(275000.5)
    expect(d.jumlah.dompet).toBe(3)
    expect(d.jumlah.jadwal).toBe(1)
  })

  it('agregat per ruang tidak dikirim server → null (tampil "—"), bukan 0 atau undefined', () => {
    const d = keDetailPengguna(contoh())
    expect(d.ruang).toHaveLength(2)
    for (const r of d.ruang) {
      expect(r.transaksi).toBeNull()
      expect(r.pemasukan).toBeNull()
      expect(r.pengeluaran).toBeNull()
      expect(r.dompet).toBeNull()
      expect(r.jadwal).toBeNull()
    }
  })

  it('keanggotaan ruang terbaca utuh', () => {
    const [pribadi, warung] = keDetailPengguna(contoh()).ruang
    expect(pribadi).toMatchObject({ id: '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e', nama: 'Keuangan Saya', peran: 'owner', pemilik: true, anggota: 1 })
    expect(warung).toMatchObject({ nama: 'Warung Bu Sri', peran: 'member', pemilik: false, anggota: 2 })
  })

  it('nominal numeric yang pulang sebagai string tetap terbaca', () => {
    const dto = contoh()
    dto.jumlah = { ...dto.jumlah, pemasukan: '1500000.00', pengeluaran: '275000.50' }
    const d = keDetailPengguna(dto)
    expect(d.jumlah.pemasukan).toBe(1500000)
    expect(d.jumlah.pengeluaran).toBe(275000.5)
  })

  it('display_name kosong tampil "—"; tanggal daftar memakai hari WIB', () => {
    const d = keDetailPengguna(contoh())
    expect(d.namaTampil).toBe('—')
    // 2026-09-01T16:30Z = 1 Sep 23:30 WIB — masih tanggal 1.
    expect(d.daftar).toBe('1 Sep 2026')
    // 2026-09-17T18:45Z = 18 Sep 01:45 WIB — sudah tanggal 18.
    expect(d.masukTerakhir).toBe('18 Sep 2026')
  })
})

describe('jedaDaftarKeCatatan memulangkan angka, bukan kalimat', () => {
  // Kalimatnya milik i18n (ID/EN); adapter hanya menghitung.
  it('satuan menit/jam/hari', () => {
    expect(jedaDaftarKeCatatan('2026-09-01T00:00:00Z', '2026-09-01T00:25:00Z')).toEqual({ satuan: 'menit', n: 25 })
    expect(jedaDaftarKeCatatan('2026-09-01T00:00:00Z', '2026-09-01T07:00:00Z')).toEqual({ satuan: 'jam', n: 7 })
    expect(jedaDaftarKeCatatan('2026-09-01T00:00:00Z', '2026-09-04T00:00:00Z')).toEqual({ satuan: 'hari', n: 3 })
  })
  it('belum pernah mencatat → null', () => {
    expect(jedaDaftarKeCatatan('2026-09-01T00:00:00Z', null)).toBeNull()
  })
})
