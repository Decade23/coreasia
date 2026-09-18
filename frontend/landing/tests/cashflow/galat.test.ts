/**
 * Jenis galat admin. 22023 dari server BUKAN selalu soal alasan: server
 * memakainya untuk argumen apa pun yang ditolak (jendela pengumuman terbalik,
 * level tak dikenal, kunci konfigurasi kosong). Dulu semuanya dipetakan ke
 * 'alasan' dan tampil sebagai "Alasan masih terlalu pendek."
 */
import { describe, expect, it } from 'vitest'
import { GalatAdmin, petakanGalat, alasanBerpelaku } from '~/composables/cashflow/useCashflowAdmin'
import { alasanInvestigasi, POLA_AUDIT_INVESTIGASI } from '~/adapters/cashflow'

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
  it('42501 bukan-milik-subjek (catatan transaksi) → argumen dengan kalimat server', () => {
    const g = petakanGalat({ code: '42501', hint: 'bukan-milik-subjek', message: 'Tidak satu pun dibuka.' })
    expect(g.jenis).toBe('argumen')
    expect(g.message).toBe('Tidak satu pun dibuka.')
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

/** LIKE Postgres ('%' = apa saja) → RegExp, untuk membandingkan dengan pola uji SQL. */
const dariLike = (pola: string) =>
  new RegExp(`^${pola.split('%').map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)

describe('alasanBerpelaku (p_alasan yang dikirim rpc())', () => {
  it('awalan pelaku di depan setiap alasan', () => {
    expect(alasanBerpelaku('admin@coreasia.id', '  Keluhan pengguna — tiket 42 ')).toBe('[admin@coreasia.id] Keluhan pengguna — tiket 42')
  })
  it('alasan investigasi tersimpan sebagai "[pelaku] INVESTIGASI — …" dan cocok dengan POLA_AUDIT_INVESTIGASI', () => {
    const kirim = alasanBerpelaku('admin@coreasia.id', alasanInvestigasi('Investigasi galat — tiket 42'))
    expect(kirim).toBe('[admin@coreasia.id] INVESTIGASI — Investigasi galat — tiket 42')
    expect(kirim).toMatch(dariLike(POLA_AUDIT_INVESTIGASI))
    expect('INVESTIGASI — tiket 42').not.toMatch(dariLike(POLA_AUDIT_INVESTIGASI))
  })
  it('awalan INVESTIGASI tidak memenuhi syarat 8 aksara atas nama pengguna', () => {
    for (const a of [alasanInvestigasi(''), alasanInvestigasi('pendek'), 'INVESTIGASI —', '   ']) {
      expect(() => alasanBerpelaku('admin@coreasia.id', a), a).toThrow(GalatAdmin)
      try { alasanBerpelaku('x', a) } catch (e) { expect((e as GalatAdmin).jenis).toBe('alasan') }
    }
    expect(() => alasanBerpelaku('x', alasanInvestigasi('tiket 4242'))).not.toThrow()
  })
})
