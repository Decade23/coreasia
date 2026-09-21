/**
 * Pengguna 360: jawaban basi subjek sebelumnya tidak menimpa kepala dan
 * lingkup subjek yang sedang dibuka (temuan fe p3 #1).
 *
 * Staf pindah dari Pengguna 360 A ke B sebelum kepala A tiba. Halaman A sudah
 * dilepas, tetapi `kepala` (useState global 'cf_kepala') dan lingkup kasus
 * dibagi dengan halaman B. Uji ini menjalankan muatKepala yang dipakai induk
 * pengguna/[id].vue lewat useCashflowMuat — dua "halaman" dengan route
 * berbeda, urutan jawaban diatur dari luar.
 *
 * Tanpa Nuxt (lihat vitest.config.ts): auto-import dipasang sebagai global
 * tiruan; useCashflowKasus yang asli.
 */
import { computed, ref, type Ref } from 'vue'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { KasusDTO } from '~/adapters/cashflowKasus'
import type { KepalaPenggunaDTO } from '~/adapters/cashflowBuku'

const A = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const B = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
const RUANG_A = '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const RUANG_B = 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b'

function kepalaDto(user: string, ruang: string, email: string): KepalaPenggunaDTO {
  return {
    user_id: user, email, daftar: '2026-01-01T00:00:00Z', masuk_terakhir: null, banned_until: null,
    jumlah_ruang: 1, jumlah_transaksi: 3, akses_30hari: 2,
    ruang: [{ workspace_id: ruang, nama: 'R', jenis: null, peran: 'owner', pemilik: true, bekas_anggota: false, jumlah_anggota: 1, tx_oleh_dia: 3 }],
  }
}
let nomor = 0
function kasusDto(subjek: string, ruang: string[]): KasusDTO {
  const kini = Date.now()
  return {
    id: `k${++nomor}`, induk: null, subjek_tipe: 'user', subjek_id: subjek, ruang, jumlah_ruang: ruang.length,
    skenario: 'pengguna_360', preset: 'keluhan', alasan: 'Dibuka dari console CashFlow — Pengguna 360 · x',
    ranah: ['akun', 'jejak', 'transaksi'], tingkat: 'T2', lanjutan_dari: null,
    dibuka: new Date(kini).toISOString(), akar_dibuka: new Date(kini).toISOString(),
    berlaku_sampai: new Date(kini + 30 * 60_000).toISOString(),
    batas_perpanjang: new Date(kini + 120 * 60_000).toISOString(),
    ditutup: null, status: 'aktif', jumlah_terdampak: 1,
  }
}

/** Janji yang diselesaikan dari luar, untuk mengatur urutan jawaban. */
function tunda<T>() {
  let selesai!: (v: T) => void
  const janji = new Promise<T>((a) => { selesai = a })
  return { janji, selesai }
}

/** Permintaan kepala yang belum dijawab, per id yang diminta. */
const kepalaTertunda = new Map<string, ((v: KepalaPenggunaDTO) => void)[]>()
/** Jawab SEMUA permintaan kepala yang tertunda untuk `id`. */
function jawabKepala(id: string, d: KepalaPenggunaDTO) {
  const daftar = kepalaTertunda.get(id) ?? []
  expect(daftar.length).toBeGreaterThan(0)
  kepalaTertunda.delete(id)
  for (const f of daftar) f(d)
}
const api = {
  kepalaPengguna: vi.fn((id: string) => {
    const t = tunda<KepalaPenggunaDTO>()
    kepalaTertunda.set(id, [...(kepalaTertunda.get(id) ?? []), t.selesai])
    return t.janji
  }),
  kasusAktif: vi.fn(async () => ({ kasus: null, investigasi: [] })),
  kasusBuka: vi.fn(async (subjek: string, _s: unknown, _p: unknown, _r: unknown, ruang: string[]) => kasusDto(subjek, ruang)),
  kasusTambah: vi.fn(),
  kasusPerpanjang: vi.fn(),
  kasusInvestigasi: vi.fn(),
  teks: vi.fn(),
  pengguna360: vi.fn(),
}
const rute = { params: { id: A } as Record<string, string>, fullPath: `/console/cashflow/pengguna/${A}` }
const keadaanNuxt = new Map<string, Ref<unknown>>()

beforeAll(async () => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useRoute', () => rute)
  vi.stubGlobal('useToast', () => ({ success: vi.fn(), error: vi.fn() }))
  vi.stubGlobal('navigateTo', vi.fn())
  vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => k }))
  vi.stubGlobal('useCashflowAdmin', () => api)
  vi.stubGlobal('useState', (k: string, awal: () => unknown) => {
    if (!keadaanNuxt.has(k)) keadaanNuxt.set(k, ref(awal()))
    return keadaanNuxt.get(k)
  })
  const { useCashflowKasus } = await import('~/composables/cashflow/useCashflowKasus')
  vi.stubGlobal('useCashflowKasus', useCashflowKasus)
})
afterAll(() => vi.unstubAllGlobals())

beforeEach(async () => {
  kepalaTertunda.clear()
  for (const f of Object.values(api)) f.mockClear()
  ;(await import('~/composables/cashflow/useCashflowKasus')).lupakanKasus()
})

/** Induk pengguna/[id].vue dipasang untuk `id`: kepala dikosongkan, lalu muat(muatKepala). */
async function pasangInduk(id: string) {
  rute.params = { id }
  rute.fullPath = `/console/cashflow/pengguna/${id}`
  const { useCashflowPengguna } = await import('~/composables/cashflow/useCashflowPengguna')
  const { useCashflowMuat } = await import('~/composables/cashflow/useCashflowMuat')
  const p = useCashflowPengguna()
  const m = useCashflowMuat({ awal: true })
  p.kepala.value = null
  const jalan = m.muat(p.muatKepala)
  return { p, m, jalan }
}
const kasusMod = async () => (await import('~/composables/cashflow/useCashflowKasus')).useCashflowKasus()
const tunggu = () => new Promise(r => setTimeout(r, 0))

describe('pindah A → B sebelum kepala A tiba', () => {
  for (const denganBatal of [true, false]) {
    const judul = denganBatal ? 'batal() saat dilepas' : 'tanpa batal() — penjaga subjek saja'
    it(`${judul}: kepala A tiba SESUDAH kepala B → kepala & lingkup tetap milik B`, async () => {
      const a = await pasangInduk(A)
      const b = await pasangInduk(B)
      if (denganBatal) a.m.batal()
      jawabKepala(B, kepalaDto(B, RUANG_B, 'bella@contoh.id'))
      await b.jalan
      await tunggu()
      jawabKepala(A, kepalaDto(A, RUANG_A, 'andi@contoh.id'))
      await a.jalan
      await tunggu()
      const kasus = await kasusMod()
      expect(kasus.keadaan.value.subjek).toBe(B)
      expect(b.p.kepala.value?.id).toBe(B)
      expect(b.p.kepala.value?.emailTersamar.startsWith('b')).toBe(true)
      expect(kasus.keadaan.value.lingkup).toEqual([RUANG_B])
      expect(api.kasusBuka.mock.calls.map(c => [c[0], c[4]])).toEqual([[B, [RUANG_B]]])
      expect(kasus.kasus.value?.ruang).toEqual([RUANG_B])
    })

    it(`${judul}: kepala A tiba sesudah pulihkan B, sebelum kepala B → tidak ada kasus B dengan ruang A, kepala A tidak tampil`, async () => {
      const a = await pasangInduk(A)
      const b = await pasangInduk(B)
      if (denganBatal) a.m.batal()
      await tunggu()
      jawabKepala(A, kepalaDto(A, RUANG_A, 'andi@contoh.id'))
      await a.jalan
      await tunggu()
      expect(b.p.kepala.value).toBeNull()
      expect(api.kasusBuka).not.toHaveBeenCalled()
      const kasus = await kasusMod()
      expect(kasus.keadaan.value.lingkup).toBeNull()
      jawabKepala(B, kepalaDto(B, RUANG_B, 'bella@contoh.id'))
      await b.jalan
      await tunggu()
      expect(b.p.kepala.value?.id).toBe(B)
      expect(api.kasusBuka.mock.calls.map(c => [c[0], c[4]])).toEqual([[B, [RUANG_B]]])
    })
  }

  it('A → B → A: jawaban halaman A pertama yang sudah dilepas tidak membuka kasus dua kali', async () => {
    const a1 = await pasangInduk(A)
    const b = await pasangInduk(B)
    a1.m.batal()
    const a2 = await pasangInduk(A)
    b.m.batal()
    // Kepala A tiba untuk KEDUA permintaan (halaman A pertama yang sudah dilepas dan A kedua).
    jawabKepala(A, kepalaDto(A, RUANG_A, 'andi@contoh.id'))
    await Promise.all([a1.jalan, a2.jalan])
    await tunggu()
    expect(a2.p.kepala.value?.id).toBe(A)
    expect(api.kasusBuka.mock.calls.map(c => [c[0], c[4]])).toEqual([[A, [RUANG_A]]])
  })
})

describe('kepala untuk subjek halaman ini tetap tampil', () => {
  it('path berhuruf besar, server menjawab huruf kecil → kepala tampil dan kasus dibuka', async () => {
    const besar = A.toUpperCase()
    const a = await pasangInduk(besar)
    jawabKepala(besar, kepalaDto(A, RUANG_A, 'andi@contoh.id'))
    await a.jalan
    await tunggu()
    expect(a.p.kepala.value?.id).toBe(A)
    expect(api.kasusBuka).toHaveBeenCalledTimes(1)
  })

  it('server menjawab kepala orang LAIN (bukan subjek halaman) → diabaikan', async () => {
    const a = await pasangInduk(A)
    jawabKepala(A, kepalaDto(B, RUANG_B, 'bella@contoh.id'))
    await a.jalan
    await tunggu()
    expect(a.p.kepala.value).toBeNull()
    expect(api.kasusBuka).not.toHaveBeenCalled()
  })
})
