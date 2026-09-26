/**
 * NILAI argumen RPC Fase 2 (0094), bukan sekadar nama kuncinya.
 *
 * rpc-console.test.ts mencocokkan NAMA parameter dengan migrasi, dan
 * kasus-otomatis memalsukan useCashflowAdmin seluruhnya — jadi nilai yang
 * benar-benar dikirim ke sb.rpc tidak dijaga di sana. Di sini klien Supabase
 * dipalsukan dan setiap (nama, argumen) ditangkap.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { argumenJejak, RANAH_RUANG, SKENARIO_SELIDIKI } from '~/adapters/cashflowRuang'

const panggilan: Array<{ nama: string; a: Record<string, unknown> }> = []
const sb = {
  auth: { getSession: async () => ({ data: { session: { access_token: 'x' } } }), signOut: async () => ({}) },
  rpc: async (nama: string, a: Record<string, unknown>) => { panggilan.push({ nama, a }); return { data: {}, error: null } },
}
vi.stubGlobal('useAdminAuth', () => ({ user: ref({ id: 'a', email: 'staf@coreasia.id' }) }))
vi.stubGlobal('useCashflowSesi', () => ({ ambil: async () => sb, sambung: async () => ({ ok: true }), pelaku: ref('staf@coreasia.id') }))
const { useCashflowAdmin } = await import('~/composables/cashflow/useCashflowAdmin')

const U = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const W = '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const W2 = '7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f'
const saringTx = {
  ruang: W2, dompet: null, kategori: null, jenis: null, dari: null, sampai: null, min: null, maks: null, cek: null, sampah: false,
} as never
const terakhir = () => panggilan.at(-1)!

beforeEach(() => { panggilan.length = 0 })

describe('argumen RPC Ruang 360', () => {
  it('kasusBuka tipe workspace → p_subjek_tipe "workspace"; bawaan tetap "user"', async () => {
    const api = useCashflowAdmin()
    await api.kasusBuka(W, 'ruang_360', 'keluhan', RANAH_RUANG, [W], 'Dibuka dari console CashFlow — Ruang 360', 'workspace')
    expect(terakhir().nama).toBe('admin_kasus_buka')
    expect(terakhir().a).toMatchObject({ p_subjek_tipe: 'workspace', p_subjek: W, p_ruang: [W], p_ranah: [...RANAH_RUANG] })
    await api.kasusBuka(U, 'pengguna_360', 'keluhan', ['akun'], [W], 'Dibuka dari console CashFlow — Pengguna 360')
    expect(terakhir().a).toMatchObject({ p_subjek_tipe: 'user', p_subjek: U })
  })

  it('transaksiCari mode ruang → p_user null, p_ws = ruang subjek (bukan saringan)', async () => {
    await useCashflowAdmin().transaksiCari('k1', 'ruang', W, saringTx, null, 50)
    expect(terakhir().nama).toBe('admin_transaksi_cari')
    expect(terakhir().a).toMatchObject({ p_kasus: 'k1', p_user: null, p_ws: W, p_mode: 'ruang', p_limit: 50 })
  })

  it('transaksiCari mode pengguna → p_user = subjek, p_ws = saringan ruang', async () => {
    await useCashflowAdmin().transaksiCari('k1', 'pengguna', U, saringTx, null, 50)
    expect(terakhir().a).toMatchObject({ p_kasus: 'k1', p_user: U, p_ws: W2, p_mode: 'pengguna' })
  })

  it('jejak tanpa aktor (Ruang 360) → p_aktor null, p_ws = ruang', async () => {
    await useCashflowAdmin().jejak('k1', null, { ruang: W, jenis: null, dari: null, sampai: null } as never, null, 20)
    expect(terakhir().nama).toBe('admin_jejak')
    expect(terakhir().a).toMatchObject({ p_kasus: 'k1', p_aktor: null, p_ws: W })
    await useCashflowAdmin().jejak('k1', U, { ruang: null, jenis: null, dari: null, sampai: null } as never, null, 20)
    expect(terakhir().a).toMatchObject({ p_aktor: U, p_ws: null })
  })

  it('jejak dari query tab (argumenJejak → api.jejak, jalur CashflowTabJejak): mode ruang abaikan ?ruang=, p_ws = subjek', async () => {
    const q = { ruang: W2, jenis: 'tx.hapus' as const, dari: '2026-09-01', sampai: '' }
    const r = argumenJejak('ruang', W, q)
    await useCashflowAdmin().jejak('k1', r.aktor, r.saring, null, 100)
    expect(terakhir().a).toMatchObject({ p_kasus: 'k1', p_ws: W, p_aktor: null, p_jenis: 'tx.hapus', p_dari: '2026-09-01', p_sampai: null })
    const p = argumenJejak('pengguna', U, q)
    await useCashflowAdmin().jejak('k1', p.aktor, p.saring, null, 100)
    expect(terakhir().a).toMatchObject({ p_ws: W2, p_aktor: U, p_jenis: 'tx.hapus' })
    const kosong = argumenJejak('pengguna', U, { ruang: '', jenis: '', dari: '', sampai: '' })
    await useCashflowAdmin().jejak('k1', kosong.aktor, kosong.saring, null, 100)
    expect(terakhir().a).toMatchObject({ p_ws: null, p_aktor: U, p_jenis: null, p_dari: null, p_sampai: null })
  })

  it('kasusBukaDariPeristiwa (Selidiki) → p_ranah = ranah tab ruang, skenario Selidiki', async () => {
    await useCashflowAdmin().kasusBukaDariPeristiwa(42, 'Selidiki dari Aktivitas · x')
    expect(terakhir().nama).toBe('admin_kasus_buka_dari_peristiwa')
    expect(terakhir().a).toMatchObject({ p_peristiwa: 42, p_ranah: [...RANAH_RUANG], p_skenario: SKENARIO_SELIDIKI })
  })

  it('kasusAktifRuang dan dompetRuang meneruskan ruang apa adanya (null = semua lingkup)', async () => {
    const api = useCashflowAdmin()
    await api.kasusAktifRuang(W)
    expect(terakhir()).toEqual({ nama: 'admin_kasus_aktif_ruang', a: { p_ws: W } })
    await api.dompetRuang('k1', null)
    expect(terakhir()).toEqual({ nama: 'admin_dompet_ruang', a: { p_kasus: 'k1', p_ws: null } })
    await api.dompetRuang('k1', W)
    expect(terakhir().a).toEqual({ p_kasus: 'k1', p_ws: W })
  })
})
