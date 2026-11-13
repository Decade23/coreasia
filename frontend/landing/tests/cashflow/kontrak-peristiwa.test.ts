import { describe, expect, it } from 'vitest'
import { LANGKAH_CORONG_WA } from '../../adapters/cashflowCorongAlur'
import { adaMigrasiNomor, fungsiTerakhir, pohonJsonb } from './migrasi'

describe.skipIf(!adaMigrasiNomor('20261113194000'))('kontrak Perjalanan', () => {
  it('membuka ranah Jejak dan mencatat setiap halaman yang kembali', () => {
    const { badan } = fungsiTerakhir('admin_perjalanan_pengguna')
    expect(badan).toMatch(/admin_kasus_pakai\(p_kasus, 'jejak', p_user, null\)/)
    expect(badan).toMatch(/admin_catat_baca\(k, 'baca_perjalanan', 'user', p_user,/)
    const keluaran = badan.slice(badan.lastIndexOf('return jsonb_build_object'))
    expect(Object.keys(pohonJsonb(keluaran)).sort())
      .toEqual(['akun_internal', 'baris', 'halaman_pertama', 'kursor_berikut', 'telemetri_sejak'])
    expect(badan).toMatch(/select i\.id, c\.pada, c\.sumber, c\.jenis, c\.langkah, c\.kategori, c\.layar,\s+c\.rincian_aman, c\.sesi, c\.sesi_mulai, c\.versi/)
  })
})

describe.skipIf(!adaMigrasiNomor('20261113200100'))('kontrak Corong WhatsApp', () => {
  it('kode dan urutan tahap cocok, ringkasan mengembalikan batas jam', () => {
    const { badan: langkah } = fungsiTerakhir('corong_nomor_wa_langkah_inti')
    expect([...langkah.matchAll(/\(\s*\d+,\s*'([a-z_]+)'\s*,/g)].map(m => m[1])).toEqual(LANGKAH_CORONG_WA)
    const { badan } = fungsiTerakhir('admin_corong_alur')
    const keluaran = badan.slice(badan.lastIndexOf('select jsonb_build_object'))
    expect(Object.keys(pohonJsonb(keluaran)).sort())
      .toEqual(['alur', 'batas_akhir', 'dari', 'pecahan', 'sampai', 'telemetri', 'total'])
  })
})
