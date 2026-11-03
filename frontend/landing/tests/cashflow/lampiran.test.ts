/**
 * Foto lampiran (0122): tombol "Lihat foto" di console CashFlow.
 *
 * Yang dikunci di sini:
 * - adapter: bentuk jawaban admin-lampiran, pilihan sasaran per tempat
 *   (transaksi, laci, grup, struk, pelunasan), alasan otomatis, penjaga asal;
 * - pemetaan galat fungsi edge (status + {galat, hint}) ke jenis galat
 *   console dan kalimat ID/EN-nya;
 * - pengambilan berkas: tanpa cache, tanpa Referer, hanya asal Supabase;
 * - useCashflowKasus: kasus anak FOTO dipakai ulang selama hidup, terpisah
 *   dari anak teks; anak yang habis diganti sekali; blob URL dicabut saat
 *   penampil ditutup, foto lain dibuka, anaknya habis, atau logout.
 *
 * Tanpa Nuxt (lihat vitest.config.ts): useCashflowAdmin dipasang sebagai
 * global tiruan, window/document tiruan secukupnya. Semua data rekaan.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
// Vue dimuat SEBELUM document tiruan dipasang: runtime-dom membaca document saat dimuat.
import { computed, ref } from 'vue'
import type { KasusDTO } from '~/adapters/cashflowKasus'
import {
  alasanFotoOtomatis, keLampiran, lampiranGrup, lampiranPelunasan, lampiranRinci, lampiranStruk, lampiranTransaksi,
  urlBerkasSah, BERLAKU_BAWAAN_DETIK,
} from '~/adapters/cashflowLampiran'
import { ambilBerkas, GalatAdmin, petakanGalatLampiran } from '~/composables/cashflow/useCashflowAdmin'
import { KAMUS_CASHFLOW } from '~/composables/cashflow/useCashflowI18n'
import { DIR_TOKO } from './migrasi'

const SB = 'https://contohref.supabase.co'
const TAUTAN = `${SB}/storage/v1/object/sign/receipts/ruang-rekaan/nota.jpg?token=rekaan`
const ID = '5d1e2f3a-4b5c-4d6e-8f70-819203a4b5c6'

describe('adapter: jawaban admin-lampiran', () => {
  it('berkas dipetakan; url kosong = belum terunggah; jenis asing = null', () => {
    const l = keLampiran({
      berkas: [
        { jenis: 'struk', url: TAUTAN, kedaluwarsa_pada: '2026-11-03T05:05:00.000Z' },
        { jenis: 'bukti', url: null, kedaluwarsa_pada: null },
        { jenis: 'aneh', url: '', kedaluwarsa_pada: 5 },
      ],
      berlaku_detik: 300,
    })
    expect(l.berlakuDetik).toBe(300)
    expect(l.berkas).toEqual([
      { jenis: 'struk', url: TAUTAN, kedaluwarsaIso: '2026-11-03T05:05:00.000Z' },
      { jenis: 'bukti', url: null, kedaluwarsaIso: null },
      { jenis: null, url: null, kedaluwarsaIso: null },
    ])
  })
  it('bentuk asing tidak melempar: daftar kosong, umur bawaan', () => {
    for (const d of [null, 'x', { berkas: 'x' }, { berkas: [null, 3] }]) {
      expect(keLampiran(d)).toEqual({ berkas: [], berlakuDetik: BERLAKU_BAWAAN_DETIK })
    }
  })
  it('alasan anak foto sesuai kontrak dan berbeda dari alasan anak teks', () => {
    expect(alasanFotoOtomatis(new Date('2026-11-03T05:00:07Z'))).toBe('Foto lampiran dibuka dari console CashFlow · 2026-11-03 12.00.07 WIB')
  })
  it('hanya tautan bertanda tangan Storage di asal Supabase CashFlow', () => {
    expect(urlBerkasSah(TAUTAN, SB)).toBe(true)
    expect(urlBerkasSah(TAUTAN, `${SB}/rest/v1`)).toBe(true)
    expect(urlBerkasSah('https://lain.supabase.co/storage/v1/object/sign/x', SB)).toBe(false)
    expect(urlBerkasSah(`${SB}/storage/v1/object/public/receipts/x`, SB)).toBe(false)
    expect(urlBerkasSah('javascript:alert(1)', SB)).toBe(false)
    expect(urlBerkasSah(TAUTAN, '')).toBe(false)
  })
})

describe('kapan tombol Lihat muncul, dan dengan jenis apa', () => {
  it('daftar transaksi: ada_lampiran → transaksi', () => {
    expect(lampiranTransaksi({ id: ID, adaLampiran: true })).toEqual({ jenis: 'transaksi', id: ID })
    expect(lampiranTransaksi({ id: ID, adaLampiran: false })).toBeNull()
  })
  it('laci: bukti atau lampiran pada transaksi hidup → transaksi; baris sampah tanpa tombol', () => {
    expect(lampiranRinci({ sumber: 'transaksi', id: ID, lampiran: { adaBukti: true, jumlah: null } })).toEqual({ jenis: 'transaksi', id: ID })
    expect(lampiranRinci({ sumber: 'transaksi', id: ID, lampiran: { adaBukti: false, jumlah: 2 } })).toEqual({ jenis: 'transaksi', id: ID })
    expect(lampiranRinci({ sumber: 'transaksi', id: ID, lampiran: { adaBukti: false, jumlah: 0 } })).toBeNull()
    expect(lampiranRinci({ sumber: 'sampah', id: ID, lampiran: { adaBukti: true, jumlah: 1 } })).toBeNull()
  })
  it('laci, blok grup: hanya grup penuh yang berfoto → struk', () => {
    const grup = { id: ID, kind: 'expense', ocr_status: null, ada_merchant: false, ada_catatan: false, ada_foto: true, ada_kontak: false, uang_diterima: null, created_at: '2026-11-01T00:00:00Z', jumlah_baris: 2 }
    expect(lampiranGrup(grup)).toEqual({ jenis: 'struk', id: ID })
    expect(lampiranGrup({ ...grup, ada_foto: false })).toBeNull()
    expect(lampiranGrup({ id: ID, terbatas: true })).toBeNull()
    expect(lampiranGrup(null)).toBeNull()
  })
  it('tab Struk: ada_foto → struk; riwayat lunas: ada_bukti → pelunasan', () => {
    expect(lampiranStruk({ id: ID, adaFoto: true })).toEqual({ jenis: 'struk', id: ID })
    expect(lampiranStruk({ id: ID, adaFoto: false })).toBeNull()
    expect(lampiranPelunasan({ id: ID, adaBukti: true })).toEqual({ jenis: 'pelunasan', id: ID })
    expect(lampiranPelunasan({ id: ID, adaBukti: false })).toBeNull()
  })
})

describe('galat admin-lampiran → jenis galat console', () => {
  const KASUS: Array<[number | null, unknown, string, string]> = [
    [400, { galat: 'masukan-salah', hint: 'jenis' }, 'argumen', 'lampiran-masukan'],
    [401, { galat: 'tanpa-sesi' }, 'sesi', 'tanpa-sesi'],
    [401, { code: 401, message: 'Invalid JWT' }, 'sesi', 'tanpa-sesi'],
    [403, { galat: 'asal' }, 'lain', 'lampiran-asal'],
    [403, { galat: 'tanpa-hak', hint: 'izin-kurang' }, 'izin', 'izin-kurang'],
    [403, { galat: 'tanpa-hak', hint: 'sesi-konsol' }, 'sesi', 'sesi-konsol'],
    [403, { galat: 'tanpa-hak', hint: 'kasus-kedaluwarsa' }, 'kasus', 'kasus-kedaluwarsa'],
    [403, { galat: 'tanpa-hak', hint: 'kasus-tidak-dikenal' }, 'kasus', 'kasus-tidak-dikenal'],
    [403, { galat: 'tanpa-hak', hint: 'kasus-ranah' }, 'ranah', 'kasus-ranah'],
    [403, { galat: 'tanpa-hak', hint: 'kasus-lingkup' }, 'lingkup', 'kasus-lingkup'],
    [403, { galat: 'tanpa-hak' }, 'bukan-admin', ''],
    [404, { galat: 'tidak-ada', hint: 'baris' }, 'tidak-ada', 'baris'],
    [404, { galat: 'tidak-ada', hint: 'tanpa-lampiran' }, 'tidak-ada', 'tanpa-lampiran'],
    [405, { galat: 'metode' }, 'lain', 'lampiran-server'],
    [500, { galat: 'galat-server', hint: 'bentuk' }, 'lain', 'lampiran-server'],
    [502, { galat: 'penyimpanan' }, 'lain', 'lampiran-penyimpanan'],
    [503, { galat: 'belum-terpasang' }, 'belum-aktif', 'belum-terpasang'],
    [null, null, 'lain', 'lampiran-jaringan'],
  ]
  for (const [status, badan, jenis, hint] of KASUS) {
    it(`${status ?? 'jaringan'} ${JSON.stringify(badan)} → ${jenis}${hint ? ` (${hint})` : ''}`, () => {
      const g = petakanGalatLampiran(status, badan)
      expect(g).toBeInstanceOf(GalatAdmin)
      expect([g.jenis, g.hint]).toEqual([jenis, hint])
    })
  }

  describe('kalimat yang tampil (useCashflowMuat.pesanUntuk), ID dan EN', () => {
    const ambilKamus = (b: 'id' | 'en', jalur: string): unknown =>
      jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])
    beforeAll(() => {
      vi.stubGlobal('ref', ref)
      vi.stubGlobal('computed', computed)
      vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => k }))
      vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/pengguna/x' }))
      vi.stubGlobal('useToast', () => ({ success: vi.fn(), error: vi.fn() }))
      vi.stubGlobal('navigateTo', vi.fn())
    })
    afterAll(() => vi.unstubAllGlobals())

    const HARAP: Array<[number | null, unknown, string]> = [
      [400, { galat: 'masukan-salah' }, 'lampiran.galat.masukan'],
      [403, { galat: 'asal' }, 'lampiran.galat.asal'],
      // Tanpa TOTP: kalimat yang sama dengan "Tampilkan catatan".
      [403, { galat: 'tanpa-hak', hint: 'izin-kurang' }, 'galat.izinKurang'],
      [403, { galat: 'tanpa-hak', hint: 'kasus-ranah' }, 'galat.diLuarRanah'],
      [403, { galat: 'tanpa-hak', hint: 'kasus-lingkup' }, 'galat.diLuarLingkup'],
      [404, { galat: 'tidak-ada', hint: 'tanpa-lampiran' }, 'lampiran.galat.tanpaLampiran'],
      [404, { galat: 'tidak-ada', hint: 'baris' }, 'umum.tidakAda'],
      [500, { galat: 'galat-server' }, 'lampiran.galat.server'],
      [502, { galat: 'penyimpanan' }, 'lampiran.galat.penyimpanan'],
      [503, { galat: 'belum-terpasang' }, 'galat.belumAktif'],
      [null, null, 'lampiran.galat.jaringan'],
    ]
    for (const [status, badan, kunci] of HARAP) {
      it(`${status ?? 'jaringan'} → ${kunci}`, async () => {
        const { useCashflowMuat } = await import('~/composables/cashflow/useCashflowMuat')
        expect(useCashflowMuat().pesanUntuk(petakanGalatLampiran(status, badan))).toBe(kunci)
        for (const b of ['id', 'en'] as const) {
          const teks = ambilKamus(b, kunci)
          expect(typeof teks, `${b}:${kunci}`).toBe('string')
          expect((teks as string).length).toBeGreaterThan(0)
        }
      })
    }
    it('503 belum-terpasang = "Fitur ini belum aktif di server."', () => {
      expect(KAMUS_CASHFLOW.id.galat.belumAktif).toBe('Fitur ini belum aktif di server.')
      expect(KAMUS_CASHFLOW.id.lampiran.belumTerunggah).toBe('Berkasnya belum terunggah.')
    })
  })
})

describe('ambilBerkas: tanpa cache, tanpa Referer, hanya asal Supabase', () => {
  it('fetch dengan cache no-store, referrerPolicy no-referrer, tanpa kredensial', async () => {
    const f = vi.fn(async () => new Response(new Blob(['foto-rekaan']), { status: 200 }))
    const blob = await ambilBerkas(TAUTAN, SB, f as unknown as typeof fetch)
    expect(await blob.text()).toBe('foto-rekaan')
    expect(f).toHaveBeenCalledWith(TAUTAN, { cache: 'no-store', referrerPolicy: 'no-referrer', credentials: 'omit' })
  })
  it('asal lain tidak pernah diambil', async () => {
    const f = vi.fn()
    await expect(ambilBerkas('https://lain.contoh/x.jpg', SB, f as unknown as typeof fetch)).rejects.toMatchObject({ hint: 'lampiran-server' })
    expect(f).not.toHaveBeenCalled()
  })
  it('Storage menolak (tautan lewat 300 detik) → galat penyimpanan', async () => {
    const f = vi.fn(async () => new Response('', { status: 400 }))
    await expect(ambilBerkas(TAUTAN, SB, f as unknown as typeof fetch)).rejects.toMatchObject({ jenis: 'lain', hint: 'lampiran-penyimpanan' })
  })
})

// ── useCashflowKasus: kasus anak foto & blob ──────────────────────────────
const SUBJEK = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const W1 = '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const MENIT = 60_000

let nomor = 0
function kasusDto(x: Partial<KasusDTO> & { menit?: number } = {}): KasusDTO {
  const { menit = 30, ...sisa } = x
  const kini = Date.now()
  return {
    id: `k${++nomor}`, induk: null, subjek_tipe: 'user', subjek_id: SUBJEK, ruang: [W1], jumlah_ruang: 1,
    skenario: 'pengguna_360', preset: 'keluhan', alasan: 'Dibuka dari console CashFlow — Pengguna 360 · x',
    ranah: ['akun', 'jejak', 'transaksi'], tingkat: 'T2', lanjutan_dari: null,
    dibuka: new Date(kini).toISOString(), akar_dibuka: new Date(kini).toISOString(),
    berlaku_sampai: new Date(kini + menit * MENIT).toISOString(),
    batas_perpanjang: new Date(kini + 120 * MENIT).toISOString(),
    ditutup: null, status: 'aktif', jumlah_terdampak: 1,
    ...sisa,
  }
}
const anakDto = (induk: string, ranah: string[]) => kasusDto({ induk, tingkat: 'T3', ranah, preset: 'galat', menit: 10 })

const api = {
  kasusAktif: vi.fn(),
  kasusAktifRuang: vi.fn(),
  kasusBuka: vi.fn(),
  kasusTambah: vi.fn(),
  kasusPerpanjang: vi.fn(),
  kasusInvestigasi: vi.fn(),
  teks: vi.fn(),
  lampiran: vi.fn(),
  ambilBerkas: vi.fn(),
}
const DUA_BERKAS = {
  berkas: [
    { jenis: 'struk', url: TAUTAN, kedaluwarsa_pada: '2026-11-03T05:05:00.000Z' },
    { jenis: 'bukti', url: null, kedaluwarsa_pada: null },
  ],
  berlaku_detik: 300,
}

describe('useCashflowKasus: Lihat foto', () => {
  let dibuat: string[] = []
  let dicabut: string[] = []
  let lepas: (() => void) | null = null

  beforeAll(() => {
    vi.stubGlobal('useCashflowAdmin', () => api)
    vi.stubGlobal('window', { addEventListener: () => {}, removeEventListener: () => {} })
    vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: () => {}, removeEventListener: () => {} })
  })
  afterAll(() => vi.unstubAllGlobals())

  const modul = async () => import('~/composables/cashflow/useCashflowKasus')
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T05:00:00Z'))
    for (const f of Object.values(api)) f.mockReset()
    api.kasusAktif.mockResolvedValue({ kasus: null, investigasi: [] })
    api.kasusBuka.mockImplementation(async () => kasusDto())
    api.lampiran.mockResolvedValue(DUA_BERKAS)
    api.ambilBerkas.mockImplementation(async () => new Blob(['foto-rekaan']))
    dibuat = []
    dicabut = []
    let n = 0
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => { const u = `blob:rekaan/${++n}`; dibuat.push(u); return u })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((u: string) => { dicabut.push(u) })
    ;(await modul()).lupakanKasus()
    dicabut = []
  })
  afterEach(() => {
    lepas?.()
    lepas = null
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  async function siapkan() {
    const m = await modul()
    const k = m.useCashflowKasus()
    lepas = k.pasangHalaman()
    await k.pulihkan(SUBJEK)
    await k.aturLingkup(SUBJEK, [W1])
    const induk = k.kasus.value!.id
    api.kasusInvestigasi.mockImplementation(async (_i: string, _p: string, _a: string, ranah: string) => anakDto(induk, [ranah]))
    return { k, m, induk }
  }

  it('klik pertama membuka anak FOTO (alasan foto), klik berikutnya memakai anak yang sama; tiap klik = satu panggilan', async () => {
    const { k, induk } = await siapkan()
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    expect(api.kasusInvestigasi).toHaveBeenCalledTimes(1)
    const [idInduk, preset, alasan, ranah] = api.kasusInvestigasi.mock.calls[0]!
    expect([idInduk, preset, ranah]).toEqual([induk, 'galat', 'foto'])
    expect(alasan).toBe('Foto lampiran dibuka dari console CashFlow · 2026-11-03 12.00.00 WIB')
    const anak = api.lampiran.mock.calls[0]![0]
    expect(api.lampiran.mock.calls[0]).toEqual([anak, 'transaksi', ID])

    k.tutupFoto()
    await vi.advanceTimersByTimeAsync(4 * MENIT)
    await k.lihatFoto({ jenis: 'struk', id: 'grup-rekaan' })
    expect(api.kasusInvestigasi).toHaveBeenCalledTimes(1)
    expect(api.lampiran.mock.calls.map(c => c[0])).toEqual([anak, anak])
    expect(api.lampiran).toHaveBeenCalledTimes(2)
  })

  it('anak teks dan anak foto terpisah: catatan tidak memakai anak foto, foto tidak memakai anak teks', async () => {
    const { k } = await siapkan()
    api.teks.mockResolvedValue({ jenis: 'transaksi', baris: [] })
    await k.mintaTeks('transaksi', ['a'])
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    expect(api.kasusInvestigasi.mock.calls.map(c => c[3])).toEqual(['teks', 'foto'])
    const anakTeks = api.teks.mock.calls[0]![0]
    expect(api.lampiran.mock.calls[0]![0]).not.toBe(anakTeks)
    // Keduanya hidup: klik berikutnya tidak membuka anak baru di ranah mana pun.
    await k.mintaTeks('transaksi', ['b'])
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    expect(api.kasusInvestigasi).toHaveBeenCalledTimes(2)
    expect(k.ranahAnakHidup.value).toEqual(new Set(['teks', 'foto']))
  })

  it('anak teks yang dipulihkan dari server tidak dipakai untuk foto', async () => {
    const m = await modul()
    const induk = kasusDto()
    api.kasusAktif.mockResolvedValue({ kasus: induk, investigasi: [anakDto(induk.id, ['teks'])] })
    const k = m.useCashflowKasus()
    lepas = k.pasangHalaman()
    await k.pulihkan(SUBJEK)
    await k.aturLingkup(SUBJEK, [W1])
    api.kasusInvestigasi.mockImplementation(async () => anakDto(induk.id, ['foto']))
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    expect(api.kasusInvestigasi).toHaveBeenCalledTimes(1)
    expect(api.kasusInvestigasi.mock.calls[0]![3]).toBe('foto')
  })

  it('anak foto ditolak server (kasus-kedaluwarsa) → satu anak baru, ulangi SEKALI', async () => {
    const { k } = await siapkan()
    api.lampiran
      .mockRejectedValueOnce(petakanGalatLampiran(403, { galat: 'tanpa-hak', hint: 'kasus-kedaluwarsa' }))
      .mockResolvedValueOnce(DUA_BERKAS)
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    expect(api.kasusInvestigasi).toHaveBeenCalledTimes(2)
    const [a, b] = api.lampiran.mock.calls.map(c => c[0])
    expect(a).not.toBe(b)
    expect(k.foto.value?.berkas).toHaveLength(2)
  })

  it('tanpa izin investigasi → galat izin dilempar ke tombol, tanpa panggilan foto', async () => {
    const { k } = await siapkan()
    api.kasusInvestigasi.mockRejectedValue({ code: '42501', hint: 'izin-kurang', message: 'x' })
    await expect(k.lihatFoto({ jenis: 'transaksi', id: ID })).rejects.toMatchObject({ jenis: 'izin' })
    expect(api.lampiran).not.toHaveBeenCalled()
    expect(k.foto.value).toBeNull()
  })

  it('berkas: blob URL untuk yang ada, "belum" untuk url null, "gagal" bila Storage menolak', async () => {
    const { k } = await siapkan()
    api.lampiran.mockResolvedValue({
      berkas: [
        { jenis: 'struk', url: TAUTAN, kedaluwarsa_pada: null },
        { jenis: 'bukti', url: null, kedaluwarsa_pada: null },
        { jenis: 'bukti', url: `${TAUTAN}&2`, kedaluwarsa_pada: null },
      ],
      berlaku_detik: 300,
    })
    api.ambilBerkas.mockImplementation(async (u: string) => {
      if (u.endsWith('&2')) throw new Error('400')
      return new Blob(['foto-rekaan'])
    })
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    expect(k.foto.value?.berkas).toEqual([
      { jenis: 'struk', src: dibuat[0], keadaan: 'siap' },
      { jenis: 'bukti', src: null, keadaan: 'belum' },
      { jenis: 'bukti', src: null, keadaan: 'gagal' },
    ])
    expect(api.ambilBerkas).toHaveBeenCalledTimes(2)
  })

  it('tutup penampil → semua blob dicabut', async () => {
    const { k } = await siapkan()
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    expect(dibuat).toHaveLength(1)
    k.tutupFoto()
    expect(dicabut).toEqual(dibuat)
    expect(k.foto.value).toBeNull()
  })

  it('foto lain dibuka → blob foto sebelumnya dicabut', async () => {
    const { k } = await siapkan()
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    const pertama = [...dibuat]
    await k.lihatFoto({ jenis: 'struk', id: 'grup-rekaan' })
    expect(dicabut).toEqual(pertama)
    expect(k.foto.value?.sasaran).toEqual({ jenis: 'struk', id: 'grup-rekaan' })
  })

  it('kasus anak foto habis (10 menit) → foto dibuang dan blob dicabut', async () => {
    const { k } = await siapkan()
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    await vi.advanceTimersByTimeAsync(10 * MENIT + 1500)
    expect(k.foto.value).toBeNull()
    expect(dicabut).toEqual(dibuat)
  })

  it('logout (lupakanKasus) → blob dicabut', async () => {
    const { k, m } = await siapkan()
    await k.lihatFoto({ jenis: 'transaksi', id: ID })
    m.lupakanKasus()
    expect(k.foto.value).toBeNull()
    expect(dicabut).toEqual(dibuat)
  })

  it('penampil ditutup selagi berkas diambil → jawaban basi tidak dipasang, blob-nya langsung dicabut', async () => {
    const { k } = await siapkan()
    let lepaskan!: (b: Blob) => void
    api.ambilBerkas.mockImplementation(() => new Promise<Blob>((r) => { lepaskan = r }))
    const janji = k.lihatFoto({ jenis: 'transaksi', id: ID })
    await vi.advanceTimersByTimeAsync(0)
    k.tutupFoto()
    lepaskan(new Blob(['foto-rekaan']))
    await janji
    expect(k.foto.value).toBeNull()
    expect(dibuat).toHaveLength(1)
    expect(dicabut).toEqual(dibuat)
  })
})

describe('penjaga sumber', () => {
  const AKAR = join(__dirname, '../..')
  const baca = (f: string) => readFileSync(join(AKAR, f), 'utf8')
  it('lihatFoto hanya dipanggil dari CashflowLampiranTombol (tidak ada pemuatan lebih dulu)', () => {
    for (const f of ['components/cashflow/CashflowLampiranPenampil.vue', 'components/cashflow/CashflowTabTransaksi.vue',
      'components/cashflow/CashflowLaciTransaksi.vue', 'components/cashflow/CashflowTabStruk.vue', 'components/cashflow/CashflowRiwayatPatungan.vue',
      'pages/console/cashflow/pengguna/[id].vue', 'pages/console/cashflow/ruang/[id].vue']) {
      expect(baca(f), f).not.toMatch(/\.lihatFoto\(|\.lampiran\(/)
    }
    expect(baca('components/cashflow/CashflowLampiranTombol.vue')).toMatch(/aksi\(\(\) => kasus\.lihatFoto\(s\)\)/)
  })
  it('penampil mencabut blob saat ditutup, saat rute berganti, dan saat dilepas; tanpa tombol unduh', () => {
    const f = baca('components/cashflow/CashflowLampiranPenampil.vue')
    expect(f).toMatch(/const tutup = \(\) => kasus\.tutupFoto\(\)/)
    expect(f).toMatch(/watch\(\(\) => route\.fullPath, \(\) => \{ if \(foto\.value\) tutup\(\) \}\)/)
    expect(f).toMatch(/onBeforeUnmount\(\(\) => \{[\s\S]*?tutup\(\)/)
    expect(f).not.toMatch(/\bdownload\b/)
    expect(f).toMatch(/aria-modal="true"/)
  })
  it('penampil terpasang di induk Pengguna 360 dan Ruang 360', () => {
    expect(baca('pages/console/cashflow/pengguna/[id].vue')).toMatch(/<CashflowLampiranPenampil \/>/)
    expect(baca('pages/console/cashflow/ruang/[id].vue')).toMatch(/<CashflowLampiranPenampil \/>/)
  })
})

/* toko/uji-console-rpc.sql di repo CashFlow memanggil admin_kasus_investigasi
   dengan alasan foto yang sama (c_alasan_foto) — dibandingkan tanpa cap waktu. */
const UJI_RPC = join(DIR_TOKO, 'uji-console-rpc.sql')
const teksUji = existsSync(UJI_RPC) ? readFileSync(UJI_RPC, 'utf8') : ''
describe.skipIf(!/c_alasan_foto/.test(teksUji))('uji SQL console memakai alasan foto yang sama', () => {
  it('c_alasan_foto = alasanFotoOtomatis tanpa cap waktu', () => {
    const nilai = /c_alasan_foto\s+constant\s+text\s*:=\s*'([^']*)'/.exec(teksUji)?.[1] ?? ''
    const tanpaCap = (a: string) => a.slice(0, a.lastIndexOf(' · '))
    expect(tanpaCap(nilai)).toBe(tanpaCap(alasanFotoOtomatis(new Date())))
  })
})
