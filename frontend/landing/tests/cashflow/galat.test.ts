/**
 * Jenis galat admin. 22023 dari server BUKAN selalu soal alasan: server
 * memakainya untuk argumen apa pun yang ditolak (jendela pengumuman terbalik,
 * level tak dikenal, kunci konfigurasi kosong). Dulu semuanya dipetakan ke
 * 'alasan' dan tampil sebagai "Alasan masih terlalu pendek."
 */
import { describe, expect, it } from 'vitest'
import { GalatAdmin, petakanGalat } from '~/composables/cashflow/useCashflowAdmin'

describe('petakanGalat', () => {
  it('22023 server → argumen, dengan kalimat server', () => {
    const g = petakanGalat({ code: '22023', message: 'Waktu berakhir harus sesudah waktu mulai' })
    expect(g.jenis).toBe('argumen')
    expect(g.message).toBe('Waktu berakhir harus sesudah waktu mulai')
  })
  it('42501 sesi-konsol → sesi; 42501 lain → bukan-admin; P0002 → tidak-ada', () => {
    expect(petakanGalat({ code: '42501', hint: 'sesi-konsol' }).jenis).toBe('sesi')
    expect(petakanGalat({ code: '42501' }).jenis).toBe('bukan-admin')
    expect(petakanGalat({ code: 'P0002' }).jenis).toBe('tidak-ada')
  })
  it('GalatAdmin yang sudah jadi (alasan klien) dipulangkan apa adanya', () => {
    const g = new GalatAdmin('alasan', 'Alasan minimal 8 aksara.')
    expect(petakanGalat(g)).toBe(g)
  })
})
