/**
 * Versi pembanding untuk tanda "belum diperbarui" di daftar pengguna.
 * Build uji milik akun tim dan versi pra-rilis tidak boleh membuat orang di
 * rilis publik terbaru tampak tertinggal.
 */
import { describe, expect, it } from 'vitest'
import { kePengguna, kunciVersi, pembandingVersi, versiTertinggal, type PenggunaDTO } from '~/adapters/cashflow'
import { KAMUS_CASHFLOW } from '~/composables/cashflow/useCashflowI18n'

const dto = (n: number, versi: string | null, platform: string | null, internal = false): PenggunaDTO => ({
  user_id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, email: `orang${n}@contoh.invalid`, display_name: null,
  created_at: '2026-01-01T00:00:00Z', last_sign_in: null, banned_until: null, jumlah_ruang: null, jumlah_tx: null, total_semua: 1,
  versi_aplikasi: versi, platform, internal,
} as PenggunaDTO)
const SERVER = (isi: Record<string, string>) => new Map(Object.entries(isi).map(([k, v]) => [k, kunciVersi(v)!]))
const tanda = (daftar: ReturnType<typeof kePengguna>[], server: Map<string, string>, rilis: string | null = '1.4.1') => {
  const pembanding = pembandingVersi(server, daftar, rilis)
  return daftar.map(p => versiTertinggal(p, pembanding))
}

describe('pembanding versi daftar pengguna', () => {
  it('1.4.1 tidak bertanda walau akun tim memakai 1.4.2-internal.1, 1.3.8 bertanda', () => {
    const daftar = [
      kePengguna(dto(1, '1.4.1', 'android')),
      kePengguna(dto(2, '1.3.8', 'android')),
      kePengguna(dto(3, '1.4.2-internal.1', 'android', true)),
    ]
    expect(tanda(daftar, SERVER({ android: '1.4.2-internal.1' }))).toEqual([false, true, false])
  })
  it('versi rilis yang hanya dilaporkan akun tim tidak jadi pembanding', () => {
    const daftar = [kePengguna(dto(1, '1.4.1', 'android')), kePengguna(dto(2, '1.4.2', 'android', true))]
    expect(tanda(daftar, SERVER({ android: '1.4.2' }))).toEqual([false, false])
  })
  it('pra-rilis di server tidak pernah jadi pembanding, juga -uat dan -rc', () => {
    for (const v of ['1.4.2-uat.3', '1.4.2-rc.1', '1.5.0-internal.12']) {
      const daftar = [kePengguna(dto(1, '1.4.1', 'android'))]
      expect(tanda(daftar, SERVER({ android: v }))).toEqual([false])
    }
  })
  it('akun bukan tim yang sudah di rilis lebih baru menaikkan pembanding (tetapan console belum dinaikkan)', () => {
    const daftar = [kePengguna(dto(1, '1.4.1', 'android')), kePengguna(dto(2, '1.5.0', 'android'))]
    expect(tanda(daftar, SERVER({ android: '1.5.0' }))).toEqual([true, false])
  })
  it('pra-rilis milik akun bukan tim tidak menaikkan pembanding dan tidak bertanda', () => {
    const daftar = [kePengguna(dto(1, '1.4.1', 'android')), kePengguna(dto(2, '1.4.2-rc.1', 'android'))]
    expect(tanda(daftar, SERVER({}))).toEqual([false, false])
  })
  it('platform lain: angka server dipakai bila bentuknya rilis, dilewati bila pra-rilis', () => {
    const daftar = [kePengguna(dto(1, '1.4.0', 'ios')), kePengguna(dto(2, '1.4.1', 'ios'))]
    expect(tanda(daftar, SERVER({ ios: '1.4.1' }))).toEqual([true, false])
    expect(tanda([daftar[0]!], SERVER({ ios: '1.4.2-internal.1' }))).toEqual([false])
  })
  it('rilis Play tidak dipakai untuk iPhone atau build uji', () => {
    const daftar = [kePengguna(dto(1, '1.3.0', 'ios')), kePengguna(dto(2, '1.3.0', 'android_uat'))]
    expect(tanda(daftar, SERVER({}))).toEqual([false, false])
  })
  it('tanpa tetapan rilis dan tanpa data, tidak ada yang bertanda', () => {
    expect(tanda([kePengguna(dto(1, '1.0.0', 'android'))], SERVER({ android: '9.9.9' }), null)).toEqual([false])
  })
  it('labelnya "belum diperbarui", bukan "lama"', () => {
    expect(KAMUS_CASHFLOW.id.pengguna.versiLamaPendek).toBe('belum diperbarui')
    expect(KAMUS_CASHFLOW.en.pengguna.versiLamaPendek).toBe('not updated')
  })
})
