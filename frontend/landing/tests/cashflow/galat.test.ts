/**
 * Jenis galat admin. 22023 dari server BUKAN selalu soal alasan: server
 * memakainya untuk argumen apa pun yang ditolak (jendela pengumuman terbalik,
 * level tak dikenal, kunci konfigurasi kosong). Dulu semuanya dipetakan ke
 * 'alasan' dan tampil sebagai "Alasan masih terlalu pendek."
 */
import { describe, expect, it } from 'vitest'
import { GalatAdmin, petakanGalat, alasanBerpelaku, alasanKasus } from '~/composables/cashflow/useCashflowAdmin'

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
  it('42501 pakai-versi-baru (RPC v1 yang ditutup 0088) → versi-lama, bukan "bukan admin"', () => {
    const g = petakanGalat({ code: '42501', hint: 'pakai-versi-baru', message: 'Pakai admin_baca_transaksi_v2.' })
    expect(g.jenis).toBe('versi-lama')
    expect(g.hint).toBe('pakai-versi-baru')
  })
  it('hint 42501 Fase 1 dipetakan SEBELUM "42501 lainnya → bukan-admin"', () => {
    expect(petakanGalat({ code: '42501', hint: 'kasus-kedaluwarsa' }).jenis).toBe('kasus')
    expect(petakanGalat({ code: '42501', hint: 'kasus-ranah' }).jenis).toBe('ranah')
    expect(petakanGalat({ code: '42501', hint: 'kasus-lingkup' }).jenis).toBe('lingkup')
    expect(petakanGalat({ code: '42501', hint: 'izin-kurang' }).jenis).toBe('izin')
    expect(petakanGalat({ code: '42501', hint: 'batas-investigasi' }).jenis).toBe('batas')
    expect(petakanGalat({ code: '42501', hint: 'hint-baru-tak-dikenal' }).jenis).toBe('bukan-admin')
  })
  it('hint server ikut dibawa (22023 nilai-tersamar)', () => {
    const g = petakanGalat({ code: '22023', hint: 'nilai-tersamar', message: 'Nilai yang dikirim masih tersamar.' })
    expect(g.jenis).toBe('argumen')
    expect(g.hint).toBe('nilai-tersamar')
  })
  it('galat jaringan tanpa bentuk PostgREST tetap terpetakan', () => {
    expect(petakanGalat(new TypeError('Failed to fetch')).jenis).toBe('lain')
    expect(petakanGalat(null).message).toBe('Gagal memanggil server.')
  })
  it('GalatAdmin yang sudah jadi (alasan klien) dipulangkan apa adanya', () => {
    const g = new GalatAdmin('alasan', 'Alasan minimal 8 aksara.')
    expect(petakanGalat(g)).toBe(g)
  })
})

describe('alasanBerpelaku (p_alasan RPC 0b yang dikirim rpc())', () => {
  it('awalan pelaku di depan setiap alasan', () => {
    expect(alasanBerpelaku('admin@coreasia.id', '  Keluhan pengguna — tiket 42 ')).toBe('[admin@coreasia.id] Keluhan pengguna — tiket 42')
  })
  it('syarat 8 aksara diukur SEBELUM awalan pelaku ditambahkan', () => {
    for (const a of ['', 'pendek', '   ', 'tiket 4 ']) {
      expect(() => alasanBerpelaku('admin@coreasia.id', a), a).toThrow(GalatAdmin)
      try { alasanBerpelaku('x', a) } catch (e) { expect((e as GalatAdmin).jenis).toBe('alasan') }
    }
    expect(() => alasanBerpelaku('x', 'tiket 4242')).not.toThrow()
  })
})

describe('alasanKasus (p_alasan kasus: TANPA awalan pelaku)', () => {
  it('dikirim apa adanya (dipangkas): potongan 10 aksara T0 berisi nomor tiket, bukan email admin', () => {
    expect(alasanKasus('  Tiket #4242 saldo ')).toBe('Tiket #4242 saldo')
  })
  it('kurang dari 8 aksara → galat alasan sebelum jaringan', () => {
    expect(() => alasanKasus('tiket 1')).toThrow(GalatAdmin)
    try { alasanKasus('  ') } catch (e) { expect((e as GalatAdmin).jenis).toBe('alasan') }
  })
})
