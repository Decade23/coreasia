/**
 * Hitungan T0 per orang dan per ruang hanya untuk sesi ber-pii (M/0089 §15 (d),
 * temuan sql p2 putaran 2).
 *
 * Daftar pengguna tersamar (jumlah_ruang, jumlah_tx), kepala (jumlah_ruang,
 * jumlah_transaksi), dan daftar ruang v2 (jumlah_anggota, jumlah_tx,
 * undangan_aktif) mengirim null ke sesi {view}/{}. Dari hitungan-hitungan itu
 * graf keanggotaan bisa disusun tanpa kasus dan tanpa audit. Yang dikunci di sini:
 * - server: definisi TERAKHIR ketiga fungsi hanya menghitung di cabang v_pii;
 * - adapter: null tetap null (tabel dan kepala menulis "—" bertanda butuh TOTP),
 *   bukan 0 — "0 ruang" terbaca sebagai fakta tentang orang itu.
 */
import { describe, expect, it } from 'vitest'
import { kePengguna, keRuang, type PenggunaDTO, type RuangDTO } from '../../adapters/cashflow'
import { keKepala, type KepalaPenggunaDTO } from '../../adapters/cashflowBuku'
import { adaMigrasi, fungsiTerakhir } from './migrasi'

const pengguna = (ruang: number | null, tx: number | null): PenggunaDTO => ({
  user_id: 'u01', email: 'ded***@gmail.com', display_name: '', created_at: '2026-09-01T00:00:00+00:00',
  last_sign_in: null, aktivitas_terakhir: null, terbuka: false, banned_until: null,
  jumlah_ruang: ruang, jumlah_tx: tx, total_semua: 1,
})
const ruang = (n: number | null): RuangDTO => ({
  workspace_id: '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e', nama: 'Wa······', pemilik_email: 'ded***@gmail.com',
  jenis: 'usaha', jumlah_anggota: n, jumlah_tx: n, undangan_aktif: n, created_at: '2026-09-01T00:00:00+00:00', total_semua: 1,
})
const kepala = (n: number | null): KepalaPenggunaDTO => ({
  user_id: 'u01', email: 'ded***@gmail.com', daftar: '2026-09-01T00:00:00+00:00', masuk_terakhir: null,
  banned_until: null, jumlah_ruang: n, jumlah_transaksi: n, akses_30hari: 0, ruang: null,
})

describe('adapter: hitungan yang ditahan server tetap null', () => {
  it('daftar pengguna', () => {
    expect(kePengguna(pengguna(null, null))).toMatchObject({ ruang: null, tx: null })
    expect(kePengguna(pengguna(2, 0))).toMatchObject({ ruang: 2, tx: 0 })
  })
  it('daftar ruang', () => {
    expect(keRuang(ruang(null))).toMatchObject({ anggota: null, tx: null, undangan: null })
    expect(keRuang(ruang(0))).toMatchObject({ anggota: 0, tx: 0, undangan: 0 })
  })
  it('kepala', () => {
    expect(keKepala(kepala(null))).toMatchObject({ jumlahRuang: null, jumlahTransaksi: null })
    expect(keKepala(kepala(3))).toMatchObject({ jumlahRuang: 3, jumlahTransaksi: 3 })
  })
})

describe.skipIf(!adaMigrasi)('server: hitungan hanya di cabang pii', () => {
  const pii = /v_pii\s*:=\s*public\.konsol_boleh\('cashflow:pii'\)/
  it('admin_daftar_pengguna_v2 (cabang tersamar)', () => {
    const { badan } = fungsiTerakhir('admin_daftar_pengguna_v2')
    expect(badan).toMatch(pii)
    const tersamar = badan.slice(badan.lastIndexOf('return query'))
    expect(tersamar).toMatch(/case when v_pii then \(select count\(\*\) from public\.workspace_members m where m\.user_id = u\.id\) end/)
    expect(tersamar).toMatch(/case when v_pii then \(select count\(\*\) from public\.transactions t where t\.user_id = u\.id\) end/)
  })
  it('admin_daftar_ruang_v2', () => {
    const { badan } = fungsiTerakhir('admin_daftar_ruang_v2')
    expect(badan).toMatch(pii)
    for (const tabel of ['workspace_members', 'transactions', 'workspace_invites']) {
      expect(badan).toMatch(new RegExp(`case when v_pii then \\(select count\\(\\*\\) from public\\.${tabel} `))
    }
  })
  it('admin_pengguna_kepala', () => {
    const { badan } = fungsiTerakhir('admin_pengguna_kepala')
    expect(badan).toMatch(/'jumlah_ruang',\s*case when v_pii then/)
    expect(badan).toMatch(/'jumlah_transaksi',\s*case when v_pii then/)
  })
  it('jumlah terdampak (daftar kasus, audit v3, kasus aktif) hanya pii; riwayat akses tanpa penghitung tersembunyi', () => {
    expect(fungsiTerakhir('admin_daftar_kasus').badan).toMatch(/case when v_pii then cardinality\(c\.terdampak\) end/)
    expect(fungsiTerakhir('admin_daftar_audit_v3').badan).toMatch(/case when v_pii then cardinality\(a\.terdampak\) end/)
    expect(fungsiTerakhir('admin_kasus_aktif').badan).toMatch(/'jumlah_terdampak', null/)
    expect(fungsiTerakhir('admin_riwayat_akses').badan).toMatch(/'tersembunyi', null/)
  })
})
