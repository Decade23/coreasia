/**
 * Kontrak pengumuman: admin_daftar_pengumuman memulangkan `setof
 * public.announcements` (M/0022), jadi DTO = kolom tabel itu, berbahasa
 * Inggris. Halaman dulu membaca judul/isi/mulai/sampai langsung dari jawaban
 * server — judul kosong, waktu selalu "—", Hentikan tampil untuk yang sudah
 * berakhir — dan menawarkan level 'peringatan'/'penting' yang ditolak CHECK.
 */
import { describe, expect, it } from 'vitest'
import {
  kePengumuman, pengumumanBelumBerakhir, LEVEL_PENGUMUMAN, type PengumumanDTO,
} from '../../adapters/cashflow'
import { adaMigrasi, fungsiTerakhir, kolomTabel } from './migrasi'

// Satu baris public.announcements seperti yang dikirim PostgREST.
const BARIS = `{
  "id": "5d1f0a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b",
  "title": "Pemeliharaan server",
  "body": "Aplikasi tidak bisa menyimpan pukul 01.00–02.00 WIB.",
  "level": "warning",
  "starts_at": "2026-09-18T17:00:00+00:00",
  "ends_at": "2026-09-18T19:00:00+00:00",
  "created_by": "3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f",
  "created_at": "2026-09-18T08:12:45.123456+00:00"
}`
const contoh = (): PengumumanDTO => JSON.parse(BARIS) as PengumumanDTO

describe('kontrak PengumumanDTO ↔ public.announcements', () => {
  it.skipIf(!adaMigrasi)('admin_daftar_pengumuman memulangkan baris announcements apa adanya', () => {
    expect(fungsiTerakhir('admin_daftar_pengumuman').kepala).toMatch(/returns\s+setof\s+public\.announcements/i)
  })

  it.skipIf(!adaMigrasi)('contoh memuat persis kolom tabel', () => {
    expect(Object.keys(JSON.parse(BARIS)).sort()).toEqual(kolomTabel('announcements').kolom)
  })

  it.skipIf(!adaMigrasi)('LEVEL_PENGUMUMAN = nilai CHECK kolom level dan penjaga admin_buat_pengumuman', () => {
    const cek = /in\s*\(([^)]*)\)/i.exec(kolomTabel('announcements').definisi.level ?? '')?.[1] ?? ''
    const dariTabel = [...cek.matchAll(/'([^']+)'/g)].map(m => m[1])
    expect([...LEVEL_PENGUMUMAN].sort()).toEqual(dariTabel.sort())
    for (const l of LEVEL_PENGUMUMAN) expect(fungsiTerakhir('admin_buat_pengumuman').badan).toContain(`'${l}'`)
  })
})

describe('kePengumuman', () => {
  it('kolom Inggris server → domain', () => {
    expect(kePengumuman(contoh())).toEqual({
      id: '5d1f0a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b',
      judul: 'Pemeliharaan server',
      isi: 'Aplikasi tidak bisa menyimpan pukul 01.00–02.00 WIB.',
      level: 'warning',
      mulai: '2026-09-18T17:00:00+00:00',
      sampai: '2026-09-18T19:00:00+00:00',
      dibuat: '2026-09-18T08:12:45.123456+00:00',
    })
  })

  it('ends_at null = tanpa akhir', () => {
    expect(kePengumuman({ ...contoh(), ends_at: null }).sampai).toBeNull()
  })
})

describe('pengumumanBelumBerakhir (tombol Hentikan)', () => {
  const p = kePengumuman(contoh())
  const jam = (iso: string) => new Date(iso).getTime()
  it('masih berjalan → bisa dihentikan', () => {
    expect(pengumumanBelumBerakhir(p, jam('2026-09-18T18:00:00Z'))).toBe(true)
  })
  it('terjadwal (belum mulai) → tetap bisa dihentikan', () => {
    expect(pengumumanBelumBerakhir(p, jam('2026-09-18T10:00:00Z'))).toBe(true)
  })
  it('sudah berakhir → tidak (server tidak mengubah apa pun untuknya)', () => {
    expect(pengumumanBelumBerakhir(p, jam('2026-09-18T19:00:00Z'))).toBe(false)
    expect(pengumumanBelumBerakhir(p, jam('2026-09-19T00:00:00Z'))).toBe(false)
  })
  it('tanpa akhir → selalu bisa', () => {
    expect(pengumumanBelumBerakhir({ ...p, sampai: null }, jam('2030-01-01T00:00:00Z'))).toBe(true)
  })
})
