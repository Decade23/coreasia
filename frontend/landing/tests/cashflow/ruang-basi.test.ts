/**
 * Ruang 360: muatKepala (useCashflowRuang) — padanan pengguna-basi.test.ts.
 *
 * - kepala dengan hitungan (sesi ber-pii) → lingkup [W] lalu kasus ruang
 *   dibuka otomatis; kepala tanpa hitungan → lingkup null, tahap 'izin',
 *   tanpa kasusBuka;
 * - staf pindah /ruang/W1 → /ruang/W2 sebelum kepala W1 tiba: kepala W1 yang
 *   basi tidak menimpa `cf_kepala_ruang` (useState global) dan tidak menyentuh
 *   lingkup/kasus W2.
 *
 * Tanpa Nuxt (lihat vitest.config.ts): auto-import dipasang sebagai global
 * tiruan; useCashflowKasus yang asli. Dua "halaman" dengan route berbeda,
 * urutan jawaban kepala diatur dari luar.
 */
import { computed, ref, type Ref } from 'vue'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { KasusDTO } from '~/adapters/cashflowKasus'
import type { KepalaRuangDTO } from '~/adapters/cashflowRuang'

const W1 = '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const W2 = 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b'

function kepalaDto(ws: string, nama: string, pii = true): KepalaRuangDTO {
  return {
    workspace_id: ws, nama, jenis: 'usaha', pemilik_email: 'ded***@gmail.com', dibuat: '2026-01-01T00:00:00Z',
    jumlah_anggota: pii ? 2 : null, jumlah_transaksi: pii ? 10 : null, jumlah_dompet: pii ? 1 : null, akses_30hari: 0,
  }
}
let nomor = 0
function kasusDto(subjek: string, ruang: string[]): KasusDTO {
  const kini = Date.now()
  return {
    id: `k${++nomor}`, induk: null, subjek_tipe: 'workspace', subjek_id: subjek, ruang, jumlah_ruang: ruang.length,
    skenario: 'ruang_360', preset: 'keluhan', alasan: 'Dibuka dari console CashFlow — Ruang 360 · x',
    ranah: ['dompet', 'jejak', 'ruang', 'transaksi'], tingkat: 'T2', lanjutan_dari: null,
    dibuka: new Date(kini).toISOString(), akar_dibuka: new Date(kini).toISOString(),
    berlaku_sampai: new Date(kini + 30 * 60_000).toISOString(),
    batas_perpanjang: new Date(kini + 120 * 60_000).toISOString(),
    ditutup: null, status: 'aktif', jumlah_terdampak: 1,
  }
}

function tunda<T>() {
  let selesai!: (v: T) => void
  const janji = new Promise<T>((a) => { selesai = a })
  return { janji, selesai }
}
const kepalaTertunda = new Map<string, ((v: KepalaRuangDTO) => void)[]>()
function jawabKepala(id: string, d: KepalaRuangDTO) {
  const daftar = kepalaTertunda.get(id) ?? []
  expect(daftar.length).toBeGreaterThan(0)
  kepalaTertunda.delete(id)
  for (const f of daftar) f(d)
}
const api = {
  kepalaRuang: vi.fn((id: string) => {
    const t = tunda<KepalaRuangDTO>()
    kepalaTertunda.set(id, [...(kepalaTertunda.get(id) ?? []), t.selesai])
    return t.janji
  }),
  kasusAktif: vi.fn(async () => ({ kasus: null, investigasi: [] })),
  kasusAktifRuang: vi.fn(async () => ({ kasus: null, investigasi: [] })),
  kasusBuka: vi.fn(async (subjek: string, _s: unknown, _p: unknown, _r: unknown, ruang: string[]) => kasusDto(subjek, ruang)),
  kasusTambah: vi.fn(),
  kasusPerpanjang: vi.fn(),
  kasusInvestigasi: vi.fn(),
  teks: vi.fn(),
  ruang360: vi.fn(),
}
const rute = { params: { id: W1 } as Record<string, string>, fullPath: `/console/cashflow/ruang/${W1}` }
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
  keadaanNuxt.clear()
  ;(await import('~/composables/cashflow/useCashflowKasus')).lupakanKasus()
})

/** Induk ruang/[id].vue dipasang untuk `id`: kepala dikosongkan, lalu muat(muatKepala). */
async function pasangInduk(id: string) {
  rute.params = { id }
  rute.fullPath = `/console/cashflow/ruang/${id}`
  const { useCashflowRuang } = await import('~/composables/cashflow/useCashflowRuang')
  const { useCashflowMuat } = await import('~/composables/cashflow/useCashflowMuat')
  const r = useCashflowRuang()
  const m = useCashflowMuat({ awal: true })
  r.kepala.value = null
  const jalan = m.muat(r.muatKepala)
  return { r, m, jalan }
}
const kasusMod = async () => (await import('~/composables/cashflow/useCashflowKasus')).useCashflowKasus()
const tunggu = () => new Promise(r => setTimeout(r, 0))

describe('kepala menentukan lingkup kasus ruang', () => {
  it('kepala dengan hitungan (pii) → lingkup [W], kasus ruang dibuka otomatis', async () => {
    const a = await pasangInduk(W1)
    jawabKepala(W1, kepalaDto(W1, 'Wa····'))
    await a.jalan
    await tunggu()
    const kasus = await kasusMod()
    expect(a.r.kepala.value?.id).toBe(W1)
    expect(kasus.keadaan.value.lingkup).toEqual([W1])
    expect(api.kasusAktifRuang).toHaveBeenCalledWith(W1)
    expect(api.kasusBuka.mock.calls.map(c => [c[0], c[4], c[6]])).toEqual([[W1, [W1], 'workspace']])
    expect(kasus.keadaan.value.tahap).toBe('siap')
  })

  it('kepala tanpa hitungan (sesi tanpa pii) → lingkup null, tahap izin, tanpa kasusBuka', async () => {
    const a = await pasangInduk(W1)
    jawabKepala(W1, kepalaDto(W1, 'Wa····', false))
    await a.jalan
    await tunggu()
    const kasus = await kasusMod()
    expect(a.r.kepala.value?.pii).toBe(false)
    expect(kasus.keadaan.value.lingkup).toBeNull()
    expect(kasus.keadaan.value.tahap).toBe('izin')
    expect(api.kasusBuka).not.toHaveBeenCalled()
  })
})

describe('pindah W1 → W2 sebelum kepala W1 tiba', () => {
  for (const denganBatal of [true, false]) {
    const judul = denganBatal ? 'batal() saat dilepas' : 'tanpa batal() — penjaga subjek saja'
    it(`${judul}: kepala W1 tiba SESUDAH kepala W2 → kepala & lingkup tetap milik W2`, async () => {
      const a = await pasangInduk(W1)
      const b = await pasangInduk(W2)
      if (denganBatal) a.m.batal()
      jawabKepala(W2, kepalaDto(W2, 'Ko····'))
      await b.jalan
      await tunggu()
      jawabKepala(W1, kepalaDto(W1, 'Wa····'))
      await a.jalan
      await tunggu()
      const kasus = await kasusMod()
      expect(kasus.keadaan.value.subjek).toBe(W2)
      expect(b.r.kepala.value?.id).toBe(W2)
      expect(b.r.kepala.value?.namaTersamar).toBe('Ko····')
      expect(kasus.keadaan.value.lingkup).toEqual([W2])
      expect(api.kasusBuka.mock.calls.map(c => [c[0], c[4]])).toEqual([[W2, [W2]]])
    })

    it(`${judul}: kepala W1 tiba sebelum kepala W2 → kepala W1 tidak tampil, tanpa kasus`, async () => {
      const a = await pasangInduk(W1)
      const b = await pasangInduk(W2)
      if (denganBatal) a.m.batal()
      await tunggu()
      jawabKepala(W1, kepalaDto(W1, 'Wa····'))
      await a.jalan
      await tunggu()
      expect(b.r.kepala.value).toBeNull()
      expect(api.kasusBuka).not.toHaveBeenCalled()
      expect((await kasusMod()).keadaan.value.lingkup).toBeNull()
      jawabKepala(W2, kepalaDto(W2, 'Ko····'))
      await b.jalan
      await tunggu()
      expect(b.r.kepala.value?.id).toBe(W2)
      expect(api.kasusBuka.mock.calls.map(c => [c[0], c[4]])).toEqual([[W2, [W2]]])
    })
  }

  it('server menjawab kepala ruang LAIN (bukan subjek halaman) → diabaikan', async () => {
    const a = await pasangInduk(W1)
    jawabKepala(W1, kepalaDto(W2, 'Ko····'))
    await a.jalan
    await tunggu()
    expect(a.r.kepala.value).toBeNull()
    expect(api.kasusBuka).not.toHaveBeenCalled()
  })
})
