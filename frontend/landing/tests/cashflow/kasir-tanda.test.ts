/**
 * Tanda Kasir di console (migrasi CashFlow 20261117180000).
 *
 * Kasir = Anggota yang boleh menjual dan menerima bayaran kasbon tanpa
 * melihat harga modal. admin_ruang_360 mengirim `kasir` di anggota dan
 * undangan, admin_pengguna_360 di ruang DALAM lingkup saja. Console
 * menampilkan lencana Kasir di samping peran member, dan tanpa kunci itu
 * (server lama) semuanya tampil seperti sebelumnya.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { adaMigrasiNomor, fungsiTerakhir, pohonDengan, semuaPohonJsonb } from './migrasi'
import { keRuang360, type Ruang360DTO } from '../../adapters/cashflowRuang'
import { ke360, tandaKasir, type Pengguna360DTO } from '../../adapters/cashflowBuku'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const ADA = adaMigrasiNomor('20261117180000')
const W = '5a60c1e2-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const W2 = '6b71d2f3-3e4b-4c6d-9e8f-0a1b2c3d4e5f'
const P = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const A = '7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f'
const B = '8d9e0f1a-2b3c-4d5e-8f6a-7b8c9d0e1f2a'

const anggota = (id: string, peran: string, kasir?: boolean) => ({
  user_id: id, email: 'or***@contoh.invalid', peran, joined_at: '2026-11-01T00:00:00+00:00', pemilik: peran === 'owner',
  tx_oleh_dia: 1, terakhir_catat_dia: null, ...(kasir === undefined ? {} : { kasir }),
})
const undangan = (id: string, peran: string, kasir?: boolean) => ({
  id, peran, status: 'aktif', ada_label: false, target_email: 'ta***@contoh.invalid', diundang_oleh: P, diterima_oleh: null,
  dibuat: '2026-11-10T00:00:00+00:00', kedaluwarsa: '2026-11-17T00:00:00+00:00', diterima_pada: null, dicabut_pada: null,
  ditolak_pada: null, ...(kasir === undefined ? {} : { kasir }),
})
const r360 = (dgnKasir: boolean): Ruang360DTO => ({
  kasus: 'd1e6aa00-1111-4111-8111-111111111111',
  ruang: {
    workspace_id: W, nama: 'Warung Contoh', jenis: 'usaha', owner_nick: null, aturan_hapus: null, fitur_patungan: false,
    ada_cara_bayar: false, ada_qris: false, pemilik_id: P, dibuat: '2026-10-01T00:00:00+00:00',
  },
  hitung: { anggota: 4, bekas_anggota: 0, undangan_aktif: 3, transaksi: 0, dompet: 1, jejak: 0, sampah: 0 },
  agregat: null,
  anggota: [
    anggota(P, 'owner', dgnKasir ? false : undefined),
    anggota(A, 'member', dgnKasir ? true : undefined),
    anggota(B, 'member', dgnKasir ? false : undefined),
    // Tidak pernah terjadi di server (pemicu melepas tanda saat peran berubah); console tetap tidak menyebutnya Kasir.
    anggota('9e0f1a2b-3c4d-4e5f-9a7b-8c9d0e1f2a3b', 'admin', dgnKasir ? true : undefined),
  ],
  bekas: [],
  undangan: [
    undangan('aa000000-0000-4000-8000-000000000001', 'member', dgnKasir ? true : undefined),
    undangan('aa000000-0000-4000-8000-000000000002', 'member', dgnKasir ? false : undefined),
    undangan('aa000000-0000-4000-8000-000000000003', 'admin', dgnKasir ? false : undefined),
  ],
})
const p360 = (dgnKasir: boolean): Pengguna360DTO => ({
  kasus: '9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  akun: {
    user_id: A, email: 'orang@contoh.invalid', display_name: '', nama_meta: null, email_confirmed_at: null, provider: 'email',
    providers: ['email'], daftar: '2026-10-01T00:00:00+00:00', masuk_terakhir: null, banned_until: null, sesi: null, mfa: false,
  },
  hitung: { ruang: 2, ruang_dalam_lingkup: 1, transaksi: 1, jejak: 0, sampah: 0 },
  pertama_catat: null,
  total: { transaksi: 1, masuk_bersih: 0, keluar_bersih: 0 },
  ruang: [
    {
      workspace_id: W, dalam_lingkup: true, nama: 'Warung Contoh', jenis: 'usaha', peran: 'member', pemilik: false,
      bekas_anggota: false, joined_at: '2026-11-01T00:00:00+00:00', jumlah_anggota: 4, tx_oleh_dia: 1, masuk_bersih_dia: 0,
      keluar_bersih_dia: 0, terakhir_catat_dia: null, agregat: null, ...(dgnKasir ? { kasir: true } : {}),
    },
    // Ruang luar lingkup: server tidak pernah mengirim kasir. Kalau pun ada, console mengabaikannya.
    {
      workspace_id: W2, dalam_lingkup: false, nama: 'Wa······', jenis: 'usaha', peran: 'member', pemilik: false,
      bekas_anggota: false, jumlah_anggota: 3, tx_oleh_dia: 0, ...(dgnKasir ? { kasir: true } : {}),
    } as Pengguna360DTO['ruang'][number],
  ],
})

describe('tandaKasir', () => {
  it('Kasir hanya bila kunci kasir benar DAN peran member (sama dengan adalah_kasir di server)', () => {
    expect(tandaKasir(true, 'member')).toBe(true)
    expect(tandaKasir(false, 'member')).toBe(false)
    expect(tandaKasir(undefined, 'member')).toBe(false)
    expect(tandaKasir(null, 'member')).toBe(false)
    expect(tandaKasir('true', 'member')).toBe(false)
    expect(tandaKasir(true, 'admin')).toBe(false)
    expect(tandaKasir(true, 'owner')).toBe(false)
    expect(tandaKasir(true, null)).toBe(false)
  })
})

describe('Ruang 360: lencana Kasir di anggota dan undangan', () => {
  it('server lama tanpa kunci kasir: tidak ada yang Kasir, bidang lain tidak berubah', () => {
    const lama = keRuang360(r360(false))
    const baru = keRuang360(r360(true))
    expect(lama.anggota.map(a => a.kasir)).toEqual([false, false, false, false])
    expect(lama.undangan.map(u => u.kasir)).toEqual([false, false, false])
    const tanpa = <T extends { kasir: boolean }>(xs: T[]) => xs.map(({ kasir: _k, ...x }) => x)
    expect(tanpa(baru.anggota)).toEqual(tanpa(lama.anggota))
    expect(tanpa(baru.undangan)).toEqual(tanpa(lama.undangan))
    expect({ ...baru, anggota: [], undangan: [] }).toEqual({ ...lama, anggota: [], undangan: [] })
  })
  it('server baru: Kasir hanya anggota member bertanda dan undangan Kasir', () => {
    const r = keRuang360(r360(true))
    expect(r.anggota.map(a => [a.peran, a.kasir])).toEqual([['owner', false], ['member', true], ['member', false], ['admin', false]])
    expect(r.undangan.map(u => [u.peran, u.kasir])).toEqual([['member', true], ['member', false], ['admin', false]])
  })
})

describe('Pengguna 360: lencana Kasir di ruang dalam lingkup', () => {
  it('server lama: tidak ada yang Kasir, bidang lain sama', () => {
    const lama = ke360(p360(false))
    const baru = ke360(p360(true))
    expect(lama.ruang.map(r => r.kasir)).toEqual([false, false])
    const tanpa = baru.ruang.map(({ kasir: _k, ...x }) => x)
    expect(tanpa).toEqual(lama.ruang.map(({ kasir: _k, ...x }) => x))
  })
  it('server baru: Kasir di ruang dalam lingkup, ruang luar lingkup tidak pernah', () => {
    const p = ke360(p360(true))
    expect(p.ruang.map(r => [r.dalamLingkup, r.kasir])).toEqual([[true, true], [false, false]])
  })
})

describe('kontrak kunci kasir ↔ migrasi 20261117180000', () => {
  it.skipIf(!ADA)('admin_ruang_360: anggota.kasir = m.kasir, undangan.kasir = i.kasir', () => {
    const { badan } = fungsiTerakhir('admin_ruang_360')
    expect(badan).toMatch(/'kasir',\s+m\.kasir\)/)
    expect(badan).toMatch(/'kasir',\s+i\.kasir\)/)
    expect(pohonDengan(badan, 'terakhir_catat_dia')).toHaveProperty('kasir', null)
    expect(pohonDengan(badan, 'ada_label')).toHaveProperty('kasir', null)
  })
  it.skipIf(!ADA)('admin_pengguna_360: kasir hanya di objek ruang dalam lingkup', () => {
    const { badan } = fungsiTerakhir('admin_pengguna_360')
    expect(pohonDengan(badan, 'dalam_lingkup', 'agregat')).toHaveProperty('kasir', null)
    const luar = semuaPohonJsonb(badan).find(p => 'dalam_lingkup' in p && !('agregat' in p))
    expect(luar).toBeDefined()
    expect(luar).not.toHaveProperty('kasir')
  })
})

describe('halaman: lencana hanya muncul bila bertanda', () => {
  const baca = (jalur: string) => readFileSync(resolve(__dirname, '../..', jalur), 'utf8')
  it('Ruang 360 › Anggota: lencana anggota dan undangan dijaga v-if', () => {
    const vue = baca('pages/console/cashflow/ruang/[id]/anggota.vue')
    expect(vue).toMatch(/<span v-if="a\.kasir"[^>]*>.*tcf\('r360\.kasir'\)/)
    expect(vue).toMatch(/<span v-if="u\.kasir"[^>]*>.*tcf\('r360\.kasir'\)/)
  })
  it('Pengguna 360 › Ruang: lencana di samping peran ruang dalam lingkup; tanpa tanda, baris lama utuh', () => {
    const vue = baca('pages/console/cashflow/pengguna/[id]/ruang.vue')
    expect(vue).toMatch(/<p v-if="r\.kasir"[^>]*>\s*\{\{ peran\(r\) \}\}<span [^>]*data-uji="ruang-kasir"[^>]*>.*tcf\('r360\.kasir'\)/)
    // Baris v-else = baris sebelum fitur ini, satu simpul teks tanpa penanda di tengahnya.
    expect(vue).toContain(`<p v-else class="mt-1 text-xs text-[var(--ca-muted)]">
                {{ peran(r) }} · {{ tcf('ruangTab.anggota')(r.anggota) }}<template v-if="r.gabungIso"> · {{ tcf('ruangTab.gabung') }} {{ formatTanggal(r.gabungIso) }}</template>
              </p>`)
    expect(vue.match(/r\.kasir/g)).toHaveLength(1)
  })
  it('kamus ID dan EN punya teks Kasir', () => {
    expect(KAMUS_CASHFLOW.id.r360.kasir).toBe('Kasir')
    expect(KAMUS_CASHFLOW.en.r360.kasir).toBe('Cashier')
    for (const bahasa of ['id', 'en'] as const) {
      expect(KAMUS_CASHFLOW[bahasa].r360.kasirKet.length).toBeGreaterThan(20)
      expect(KAMUS_CASHFLOW[bahasa].r360.kasirUndanganKet.length).toBeGreaterThan(20)
    }
  })
})
