/**
 * Halaman Paket kredit: adapter (bentuk baris, status promo, harga tampil,
 * aturan isian, urutan, galat), lapisan RPC dengan Supabase tiruan, kamus,
 * penjaga halaman, dan kontrak terhadap migrasi CashFlow.
 *
 * Kontrak dibandingkan dengan definisi TERAKHIR di folder migrasi CashFlow
 * (tests/cashflow/migrasi.ts). Sebelum migrasi paket kredit ada di folder
 * itu, bagian kontrak DILEWATI dan terlihat "skipped". Kolom produk Google
 * Play (play_produk_id) datang di migrasi sesudahnya: sebelum kolom itu ada
 * di tabel, kontrak memeriksa bentuk lama dan uji "belum ada" terlihat.
 *
 * Semua kode paket, harga, dan tanggal di sini karangan.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  HARGA_MAKS, HEMAT_MAKS, HEMAT_MIN, KOLOM_PAKET, KREDIT_MAKS, LABEL_MAKS, PLAY_PRODUK_MAKS, POLA_KODE_PAKET, POLA_PLAY_PRODUK,
  STATUS_PROMO, promoSah,
  barisPaket, bolehJadiBawaan, daftarPaket, galatKolomServer, geserUrutan, hargaSaatPromo, hargaTampil, hematPersen, isianBaru,
  isianDariPaket, kePaket, kiniServer, kolomDariGalat, muatanAktif, paketDariIsian, paketSudahDibeli, paketTidakAda, periksaIsian,
  playPaketLain, playTerpakaiDariGalat, ringkasPaket, statusPromo, urutkanPaket,
  type IsianPaket, type KodeGalatPaket, type MuatanPaket, type PaketAdminDTO, type PaketKredit,
} from '../../adapters/cashflowPaket'
import { adaMigrasi, DIR_MIGRASI, fungsiTerakhir, kolomTabel, parameterFungsi, semuaPohonJsonb, type PohonKunci } from './migrasi'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

// ── Global tiruan (tanpa Nuxt, lihat vitest.config.ts) ───────────────────
type Jawab = { data: unknown; error: unknown }
const panggilan: Array<{ nama: string; a: Record<string, unknown> }> = []
let jawaban: Jawab = { data: null, error: null }
const sb = {
  auth: { getSession: async () => ({ data: { session: { access_token: 'x' } } }), signOut: async () => ({}) },
  rpc: async (nama: string, a: Record<string, unknown>) => { panggilan.push({ nama, a }); return jawaban },
}
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useAdminAuth', () => ({ user: ref({ id: 'a', email: 'staf@contoh.id' }) }))
vi.stubGlobal('useCashflowSesi', () => ({ ambil: async () => sb, sambung: async () => ({ ok: true }), perluSambung: () => false, pelaku: ref('staf@contoh.id') }))
vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => k }))
vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/paket' }))
vi.stubGlobal('useToast', () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))
vi.stubGlobal('navigateTo', vi.fn())
const { useCashflowAdmin, petakanGalat } = await import('~/composables/cashflow/useCashflowAdmin')
const { useCashflowMuat } = await import('~/composables/cashflow/useCashflowMuat')

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')

const W = '2026-11-01T03:00:00.000Z'
/* Satu baris dengan setiap kolom tabel, seperti yang dipulangkan server. */
const BARIS: PaketAdminDTO = {
  kode: 'hemat', kredit: 50, harga: 40000, harga_promo: 34000, promo_mulai: '2026-11-01T00:00:00+00:00',
  promo_sampai: '2026-12-01T00:00:00+00:00', label: 'Paling laris', bawaan: true, aktif: true, khusus_uji: false,
  urutan: 20, diubah: W, diubah_oleh: '00000000-0000-4000-8000-000000000001', play_produk_id: 'kredit_50',
  efektif: { kode: 'hemat', kredit: 50, harga: 34000, harga_normal: 40000, hemat_persen: 15, label: 'Paling laris', promo_sampai: '2026-12-01T00:00:00+00:00', bawaan: true },
  promo: 'berlaku', terjual: 7, pernah_dibeli: true,
  play_terjual: 3, play_harga_terakhir: { harga_mikro: 34000000000, mata_uang: 'IDR', pada: W },
}
const paket = (ubah: Partial<PaketKredit> = {}): PaketKredit => ({ ...kePaket(BARIS), ...ubah })
const isian = (ubah: Partial<IsianPaket> = {}): IsianPaket => ({
  kode: 'baru_1', kredit: '25', harga: '25.000', hargaPromo: '', promoMulai: '', promoSampai: '', label: '',
  urutan: '30', bawaan: false, aktif: true, khususUji: false, playProdukId: '', ...ubah,
})
/** Kolom form tanpa produk Play: p_paket yang dikirim bila produk Play tidak berubah. */
const KOLOM_TANPA_PLAY = KOLOM_PAKET.filter(k => k !== 'play_produk_id')

describe('adapter: baris daftar', () => {
  it('memetakan setiap kolom, angka teks ikut terbaca', () => {
    expect(kePaket(BARIS)).toEqual({
      kode: 'hemat', kredit: 50, harga: 40000, hargaPromo: 34000, promoMulai: BARIS.promo_mulai, promoSampai: BARIS.promo_sampai,
      label: 'Paling laris', bawaan: true, aktif: true, khususUji: false, urutan: 20, diubah: W, terjual: 7, pernahDibeli: true,
      playProdukId: 'kredit_50',
    })
    const teks = kePaket({ ...BARIS, kredit: '50', harga: '40000', harga_promo: null, urutan: '-5', terjual: '12' })
    expect([teks.kredit, teks.harga, teks.hargaPromo, teks.urutan, teks.terjual]).toEqual([50, 40000, null, -5, 12])
  })

  it('nilai kosong atau rusak jatuh ke nilai aman, tidak dipaksa', () => {
    const p = kePaket({ ...BARIS, kredit: 'banyak', harga_promo: '1,5', label: '  ', aktif: null, bawaan: null, khusus_uji: null, terjual: undefined, pernah_dibeli: undefined })
    expect(p.kredit).toBe(0)
    expect(p.hargaPromo).toBeNull()
    expect(p.label).toBeNull()
    expect(p.aktif).toBe(true) // NOT NULL default true
    expect(p.bawaan).toBe(false)
    expect(p.khususUji).toBe(false)
    expect(p.terjual).toBeNull()
    expect(p.pernahDibeli).toBe(false)
  })

  it('produk Play: kosong, spasi, atau belum dikirim server (sebelum migrasinya) = belum di Play', () => {
    expect(kePaket({ ...BARIS, play_produk_id: null }).playProdukId).toBeNull()
    expect(kePaket({ ...BARIS, play_produk_id: '  ' }).playProdukId).toBeNull()
    const { play_produk_id: _, ...lama } = BARIS
    expect(kePaket(lama).playProdukId).toBeNull()
  })

  it('pernah dibeli: dari pernah_dibeli, atau bila terjual > 0', () => {
    expect(kePaket({ ...BARIS, terjual: 0, pernah_dibeli: true }).pernahDibeli).toBe(true) // pembelian belum lunas
    expect(kePaket({ ...BARIS, terjual: 0, pernah_dibeli: false }).pernahDibeli).toBe(false)
    expect(kePaket({ ...BARIS, terjual: 2, pernah_dibeli: undefined }).pernahDibeli).toBe(true)
  })

  it('jam server dari kunci kini', () => {
    expect(kiniServer({ paket: [], kini: '2026-11-12T09:30:00.5+00:00' })).toBe(Date.parse('2026-11-12T09:30:00.5Z'))
    expect(kiniServer({ paket: [] })).toBeNull()
    expect(kiniServer([BARIS])).toBeNull()
    expect(kiniServer({ paket: [], kini: 'kemarin' })).toBeNull()
  })

  it('bentuk luar {paket: [...]}, larik, atau rusak', () => {
    expect(barisPaket({ paket: [BARIS] })).toHaveLength(1)
    expect(barisPaket([BARIS, { bukan: 'paket' }, null])).toHaveLength(1)
    expect(barisPaket({ paket: null })).toEqual([])
    expect(barisPaket(null)).toEqual([])
    expect(barisPaket('teks')).toEqual([])
  })

  it('urut seperti server: urutan lalu kode', () => {
    const d = daftarPaket([{ ...BARIS, kode: 'b', urutan: 10 }, { ...BARIS, kode: 'a', urutan: 10 }, { ...BARIS, kode: 'c', urutan: 0 }])
    expect(d.map(p => p.kode)).toEqual(['c', 'a', 'b'])
  })

  it('ringkasan: total, aktif, sedang promo (aktif saja)', () => {
    const kini = Date.parse('2026-11-15T00:00:00Z')
    const d = [paket(), paket({ kode: 'x', aktif: false }), paket({ kode: 'y', hargaPromo: null })]
    expect(ringkasPaket(d, kini)).toEqual({ total: 3, aktif: 2, promo: 1 })
  })
})

describe('adapter: status promo dan harga tampil', () => {
  const p = paket()
  const mulai = Date.parse(p.promoMulai!)
  const sampai = Date.parse(p.promoSampai!)

  it('batas jendela: mulai termasuk, sampai tidak', () => {
    expect(statusPromo(p, mulai - 1)).toBe('terjadwal')
    expect(statusPromo(p, mulai)).toBe('berlaku')
    expect(statusPromo(p, sampai - 1)).toBe('berlaku')
    expect(statusPromo(p, sampai)).toBe('berakhir')
  })

  it('batas kosong = terbuka; tanpa harga promo = tanpa promo', () => {
    expect(statusPromo(paket({ promoMulai: null, promoSampai: null }), 0)).toBe('berlaku')
    expect(statusPromo(paket({ promoMulai: null }), sampai)).toBe('berakhir')
    expect(statusPromo(paket({ promoSampai: null }), mulai + 9e12)).toBe('berlaku')
    expect(statusPromo(paket({ hargaPromo: null }), mulai)).toBe('tanpa')
    // Harga promo yang tidak lebih murah tidak pernah ditampilkan sebagai promo.
    expect(statusPromo(paket({ hargaPromo: 40000 }), mulai)).toBe('tanpa')
    expect(STATUS_PROMO).toEqual(['berlaku', 'terjadwal', 'berakhir', 'tanpa'])
  })

  it('hemat = round((1 - promo / normal) * 100), setengah dibulatkan ke atas seperti round() Postgres', () => {
    expect(hematPersen(40000, 34000)).toBe(15)
    expect(hematPersen(75000, 63750)).toBe(15)
    expect(hematPersen(200, 199)).toBe(1) // tepat 0,5
    expect(hematPersen(3, 2)).toBe(33)
    expect(hematPersen(3, 1)).toBe(67)
    expect(hematPersen(100, 100)).toBe(0)
    // Pembanding bilangan bulat besar untuk sebaran harga.
    const acuan = (n: number, p: number) => Number((BigInt(200 * (n - p)) + BigInt(n)) / BigInt(2 * n))
    for (let n = 1; n <= 400; n += 7) for (let q = 1; q < n; q += 3) expect(hematPersen(n, q), `${n}/${q}`).toBe(acuan(n, q))
    for (const [n, q] of [[10_000_000, 1], [10_000_000, 9_999_999], [9_999_999, 4_999_999], [120000, 114000]] as const) {
      expect(hematPersen(n, q), `${n}/${q}`).toBe(acuan(n, q))
    }
  })

  it('status dan harga di jam server sama dengan kolom promo dan efektif dari server', () => {
    const kini = Date.parse('2026-11-12T09:00:00Z')
    const t = hargaTampil(kePaket(BARIS), kini)
    expect(statusPromo(kePaket(BARIS), kini)).toBe(BARIS.promo)
    expect({ harga: t.harga, harga_normal: t.hargaNormal, hemat_persen: t.hematPersen, promo_sampai: t.promoSampai })
      .toEqual({ harga: BARIS.efektif!.harga, harga_normal: BARIS.efektif!.harga_normal, hemat_persen: BARIS.efektif!.hemat_persen, promo_sampai: BARIS.efektif!.promo_sampai })
  })

  it('harga tampil mengikuti bentuk paket efektif server', () => {
    expect(hargaTampil(p, mulai)).toEqual({ harga: 34000, hargaNormal: 40000, hematPersen: 15, promoSampai: p.promoSampai, status: 'berlaku' })
    expect(hargaTampil(p, mulai - 1)).toEqual({ harga: 40000, hargaNormal: null, hematPersen: null, promoSampai: null, status: 'terjadwal' })
    expect(hargaTampil(p, sampai)).toMatchObject({ harga: 40000, hargaNormal: null, status: 'berakhir' })
    expect(hargaSaatPromo(p)).toMatchObject({ harga: 34000, hargaNormal: 40000, hematPersen: 15 })
    expect(hargaSaatPromo(paket({ hargaPromo: null }))).toBeNull()
  })
})

describe('adapter: aturan isian sama dengan server', () => {
  const galat = (i: Partial<IsianPaket>, opsi?: Parameters<typeof periksaIsian>[1]) => periksaIsian(isian(i), opsi).galat

  it('isian sah menghasilkan p_paket lengkap dengan kunci kolom tabel', () => {
    const h = periksaIsian(isian({ label: '  Hemat  ' }))
    expect(h.galat).toEqual({})
    // Produk Play kosong di paket baru tidak dikirim: server mengisi null.
    expect(Object.keys(h.muatan!).sort()).toEqual([...KOLOM_TANPA_PLAY].sort())
    expect(h.muatan).toEqual({
      kode: 'baru_1', kredit: 25, harga: 25000, harga_promo: null, promo_mulai: null, promo_sampai: null,
      label: 'Hemat', urutan: 30, bawaan: false, aktif: true, khusus_uji: false,
    })
    const play = periksaIsian(isian({ playProdukId: ' kredit_25 ' }))
    expect(Object.keys(play.muatan!).sort()).toEqual([...KOLOM_PAKET].sort())
    expect(play.muatan?.play_produk_id).toBe('kredit_25')
  })

  it('kode: pola ^[a-z0-9_-]{1,24}$ dan tidak boleh menimpa paket lain', () => {
    expect(POLA_KODE_PAKET.source).toBe('^[a-z0-9_-]{1,24}$')
    for (const k of ['', 'Besar', 'dua kata', 'a'.repeat(25), 'titik.koma', 'ü']) expect(galat({ kode: k }).kode, k).toBe('kodePola')
    for (const k of ['a', 'a'.repeat(24), 'uji_1', 'paket-70', '123']) expect(galat({ kode: k }).kode, k).toBeUndefined()
    expect(galat({ kode: 'lama' }, { kodeTerpakai: ['lama'] }).kode).toBe('kodeTerpakai')
  })

  it('kredit 1..10000 dan harga 1..10.000.000, bilangan bulat', () => {
    expect(KREDIT_MAKS).toBe(10_000)
    expect(HARGA_MAKS).toBe(10_000_000)
    for (const v of ['0', '10001', '1,5', '-1', '', 'abc']) expect(galat({ kredit: v }).kredit, v).toBe('kreditRentang')
    for (const v of ['1', '10000', '10.000']) expect(galat({ kredit: v }).kredit, v).toBeUndefined()
    for (const v of ['0', '10000001', '10.000.001', '1,5']) expect(galat({ harga: v }).harga, v).toBe('hargaRentang')
    for (const v of ['1', '10000000', '10.000.000', ' 75 000 ']) expect(galat({ harga: v }).harga, v).toBeUndefined()
  })

  it('harga promo >= 1 dan lebih murah dari harga normal', () => {
    expect(galat({ harga: '25000', hargaPromo: '0' }).harga_promo).toBe('promoRentang')
    expect(galat({ harga: '25000', hargaPromo: 'murah' }).harga_promo).toBe('promoRentang')
    expect(galat({ harga: '25000', hargaPromo: '25000' }).harga_promo).toBe('promoTidakLebihMurah')
    expect(galat({ harga: '25000', hargaPromo: '27500' }).harga_promo).toBe('promoTidakLebihMurah')
    expect(galat({ harga: '25000', hargaPromo: '24750' }).harga_promo).toBeUndefined() // hemat 1%
    expect(galat({ harga: '25000', hargaPromo: '250' }).harga_promo).toBeUndefined() // hemat 99%
  })

  it('hemat promo (dibulatkan) harus 1 sampai 99 persen', () => {
    expect(HEMAT_MIN).toBe(1)
    expect(HEMAT_MAKS).toBe(99)
    expect(galat({ harga: '25000', hargaPromo: '24999' }).harga_promo).toBe('promoHemat') // 0,004% jadi 0
    expect(galat({ harga: '25000', hargaPromo: '24876' }).harga_promo).toBe('promoHemat') // 0,496% jadi 0
    expect(galat({ harga: '25000', hargaPromo: '24875' }).harga_promo).toBeUndefined() // tepat 0,5% jadi 1
    expect(galat({ harga: '25000', hargaPromo: '125' }).harga_promo).toBe('promoHemat') // tepat 99,5% jadi 100
    expect(galat({ harga: '25000', hargaPromo: '126' }).harga_promo).toBeUndefined()
    expect(galat({ harga: '1', hargaPromo: '' }).harga_promo).toBeUndefined()
    expect(promoSah(2, 1)).toBe(true) // 50%
    expect(promoSah(100, 100)).toBe(false)
    expect(paketDariIsian(isian({ harga: '25000', hargaPromo: '24999' })).hargaPromo).toBeNull()
  })

  it('jendela promo WIB: sampai harus sesudah mulai, tanggal rusak ditolak', () => {
    const dasar = { harga: '25000', hargaPromo: '20000' }
    const h = periksaIsian(isian({ ...dasar, promoMulai: '2026-12-01T08:00', promoSampai: '2026-12-31T23:59' }))
    expect(h.muatan).toMatchObject({ harga_promo: 20000, promo_mulai: '2026-12-01T01:00:00.000Z', promo_sampai: '2026-12-31T16:59:00.000Z' })
    expect(galat({ ...dasar, promoMulai: '2026-12-01T08:00', promoSampai: '2026-12-01T08:00' }).promo_sampai).toBe('sampaiSebelumMulai')
    expect(galat({ ...dasar, promoMulai: '2026-12-02T08:00', promoSampai: '2026-12-01T08:00' }).promo_sampai).toBe('sampaiSebelumMulai')
    expect(galat({ ...dasar, promoMulai: '2026-02-30T08:00' }).promo_mulai).toBe('tanggalRusak')
    // Salah satu batas kosong itu sah.
    expect(periksaIsian(isian({ ...dasar, promoSampai: '2026-12-31T23:59' })).muatan?.promo_mulai).toBeNull()
  })

  it('tanpa harga promo, jendela promo dikirim kosong walau terisi', () => {
    const h = periksaIsian(isian({ promoMulai: '2026-02-30T08:00', promoSampai: '2026-12-01T08:00' }))
    expect(h.galat).toEqual({})
    expect(h.muatan).toMatchObject({ harga_promo: null, promo_mulai: null, promo_sampai: null })
  })

  it('label paling panjang 24 huruf (dihitung per huruf, bukan per unit UTF-16), tanpa karakter kendali; kosong = null', () => {
    expect(LABEL_MAKS).toBe(24)
    expect(galat({ label: 'x'.repeat(25) }).label).toBe('labelPanjang')
    expect(galat({ label: 'x'.repeat(24) }).label).toBeUndefined()
    expect(galat({ label: 'é'.repeat(24) }).label).toBeUndefined()
    expect(galat({ label: '\u{1F525}'.repeat(24) }).label).toBeUndefined()
    expect(galat({ label: 'Paling\tlaris' }).label).toBe('labelKarakter')
    expect(galat({ label: 'dua\nbaris' }).label).toBe('labelKarakter')
    expect(periksaIsian(isian({ label: '   ' })).muatan?.label).toBeNull()
  })

  it('bawaan hanya untuk paket aktif yang bukan khusus uji (CHECK server)', () => {
    expect(galat({ bawaan: true }).bawaan).toBeUndefined()
    expect(galat({ bawaan: true, aktif: false }).bawaan).toBe('bawaanSyarat')
    expect(galat({ bawaan: true, khususUji: true }).bawaan).toBe('bawaanSyarat')
    expect(galat({ bawaan: false, aktif: false, khususUji: true }).bawaan).toBeUndefined()
  })

  it('urutan bilangan bulat (boleh negatif), dalam jangkauan int', () => {
    for (const v of ['', '1.5', 'awal', '2147483648']) expect(galat({ urutan: v }).urutan, v).toBe('urutanAngka')
    for (const v of ['0', '-10', '2147483647']) expect(galat({ urutan: v }).urutan, v).toBeUndefined()
  })

  it('sunting: tanggal yang tidak diubah dikirim persis (detik tetap), isian bolak-balik sama', () => {
    const asal = paket({ promoMulai: '2026-11-01T00:00:30+00:00', promoSampai: '2026-12-01T00:00:45+00:00' })
    const i = isianDariPaket(asal)
    expect(i).toEqual({
      kode: 'hemat', kredit: '50', harga: '40000', hargaPromo: '34000', promoMulai: '2026-11-01T07:00', promoSampai: '2026-12-01T07:00',
      label: 'Paling laris', urutan: '20', bawaan: true, aktif: true, khususUji: false, playProdukId: 'kredit_50',
    })
    const h = periksaIsian(i, { asal })
    expect(h.muatan).toEqual({
      kode: 'hemat', kredit: 50, harga: 40000, harga_promo: 34000, promo_mulai: '2026-11-01T00:00:30+00:00',
      promo_sampai: '2026-12-01T00:00:45+00:00', label: 'Paling laris', urutan: 20, bawaan: true, aktif: true, khusus_uji: false,
    } satisfies MuatanPaket)
    // Diubah: dikirim sebagai ISO UTC dari jam WIB yang diketik.
    expect(periksaIsian({ ...i, promoSampai: '2026-12-01T08:00' }, { asal }).muatan?.promo_sampai).toBe('2026-12-01T01:00:00.000Z')
  })

  it('isian baru: aktif, urutan sesudah yang terakhir, belum di Play', () => {
    expect(isianBaru([])).toMatchObject({ aktif: true, bawaan: false, khususUji: false, urutan: '10', playProdukId: '' })
    expect(isianBaru([paket({ urutan: 20 }), paket({ kode: 'b', urutan: 5 })]).urutan).toBe('30')
  })

  it('pratinjau dari isian tidak pernah menampilkan harga promo yang tidak sah', () => {
    expect(paketDariIsian(isian({ harga: '25000', hargaPromo: '27500' })).hargaPromo).toBeNull()
    expect(paketDariIsian(isian({ harga: '25000', hargaPromo: '20000', label: ' Baru ' }))).toMatchObject({ hargaPromo: 20000, label: 'Baru', kredit: 25 })
    expect(paketDariIsian(isian({ kredit: 'x', harga: '' }))).toMatchObject({ kredit: 0, harga: 0 })
  })

  it('produk Play: pola ^[a-z0-9_.]{1,40}$, boleh kosong', () => {
    expect(POLA_PLAY_PRODUK.source).toBe('^[a-z0-9_.]{1,40}$')
    expect(PLAY_PRODUK_MAKS).toBe(40)
    for (const v of ['Kredit_30', 'kredit-30', 'dua kata', 'a'.repeat(41), 'ü', 'kredit/30']) {
      expect(galat({ playProdukId: v }).play_produk_id, v).toBe('playPola')
    }
    for (const v of ['', '   ', 'kredit_30', 'id.contoh.kredit_70', 'a'.repeat(40), '123', ' kredit_30 ']) {
      expect(galat({ playProdukId: v }).play_produk_id, v).toBeUndefined()
    }
  })

  it('produk Play tidak boleh dipakai paket lain; paket yang disunting boleh memakai miliknya sendiri', () => {
    const d = [paket({ kode: 'a', playProdukId: 'kredit_10' }), paket({ kode: 'b', playProdukId: null }), paket({ kode: 'c', playProdukId: 'kredit_30' })]
    expect(playPaketLain(d, null)).toEqual(['kredit_10', 'kredit_30'])
    expect(playPaketLain(d, 'c')).toEqual(['kredit_10'])
    expect(galat({ playProdukId: 'kredit_30' }, { playTerpakai: playPaketLain(d, null) }).play_produk_id).toBe('playTerpakai')
    expect(galat({ playProdukId: ' kredit_30 ' }, { playTerpakai: playPaketLain(d, null) }).play_produk_id).toBe('playTerpakai')
    const asal = d[2]!
    expect(periksaIsian(isianDariPaket(asal), { playTerpakai: playPaketLain(d, 'c'), asal }).galat).toEqual({})
  })

  it('produk Play hanya dikirim bila berubah: diisi, diganti, atau dikosongkan (null)', () => {
    const asal = paket({ playProdukId: 'kredit_50' })
    const i = isianDariPaket(asal)
    expect(periksaIsian(i, { asal }).muatan).not.toHaveProperty('play_produk_id')
    expect(periksaIsian({ ...i, playProdukId: ' kredit_50 ' }, { asal }).muatan).not.toHaveProperty('play_produk_id')
    expect(periksaIsian({ ...i, playProdukId: 'kredit_55' }, { asal }).muatan?.play_produk_id).toBe('kredit_55')
    expect(periksaIsian({ ...i, playProdukId: '  ' }, { asal }).muatan?.play_produk_id).toBeNull()
    // Paket lama yang belum di Play: tetap tidak dikirim, sampai diisi.
    const tanpa = paket({ playProdukId: null })
    expect(periksaIsian(isianDariPaket(tanpa), { asal: tanpa }).muatan).not.toHaveProperty('play_produk_id')
    expect(periksaIsian({ ...isianDariPaket(tanpa), playProdukId: 'kredit_50' }, { asal: tanpa }).muatan?.play_produk_id).toBe('kredit_50')
  })

  it('aksi baris hanya mengirim kode + kolom yang berubah; menonaktifkan bawaan ikut melepasnya', () => {
    expect(muatanAktif(paket({ bawaan: false }), false)).toEqual({ kode: 'hemat', aktif: false })
    expect(muatanAktif(paket({ bawaan: true }), false)).toEqual({ kode: 'hemat', aktif: false, bawaan: false })
    expect(muatanAktif(paket({ bawaan: true }), true)).toEqual({ kode: 'hemat', aktif: true })
  })

  it('jadikan bawaan hanya untuk paket aktif yang bukan khusus uji dan belum bawaan', () => {
    expect(bolehJadiBawaan(paket({ bawaan: false }))).toBe(true)
    expect(bolehJadiBawaan(paket({ bawaan: true }))).toBe(false)
    expect(bolehJadiBawaan(paket({ bawaan: false, aktif: false }))).toBe(false)
    expect(bolehJadiBawaan(paket({ bawaan: false, khususUji: true }))).toBe(false)
  })
})

describe('adapter: urutan', () => {
  const d = [paket({ kode: 'a', urutan: 10 }), paket({ kode: 'b', urutan: 20 }), paket({ kode: 'c', urutan: 30 })]

  it('urutan berbeda: cukup ditukar', () => {
    expect(geserUrutan(d, 'b', -1)).toEqual([{ kode: 'b', urutan: 10 }, { kode: 'a', urutan: 20 }])
    expect(geserUrutan(d, 'b', 1)).toEqual([{ kode: 'b', urutan: 30 }, { kode: 'c', urutan: 20 }])
  })

  it('ujung daftar atau kode tak dikenal: tidak ada yang dikirim', () => {
    expect(geserUrutan(d, 'a', -1)).toEqual([])
    expect(geserUrutan(d, 'c', 1)).toEqual([])
    expect(geserUrutan(d, 'zz', 1)).toEqual([])
  })

  it('urutan sama: dinomori ulang, hanya yang berubah dikirim, hasil urut sesuai keinginan', () => {
    const sama = [paket({ kode: 'a', urutan: 0 }), paket({ kode: 'b', urutan: 0 }), paket({ kode: 'c', urutan: 0 })]
    const ubah = geserUrutan(sama, 'c', -1)
    expect(ubah).toEqual([{ kode: 'a', urutan: 10 }, { kode: 'c', urutan: 20 }, { kode: 'b', urutan: 30 }])
    const sesudah = sama.map(p => ({ ...p, urutan: ubah.find(u => u.kode === p.kode)?.urutan ?? p.urutan }))
    expect(urutkanPaket(sesudah).map(p => p.kode)).toEqual(['a', 'c', 'b'])
  })
})

describe('galat server', () => {
  it('22023 paket_tidak_sah: hint = kolom form; hint tak dikenal = galat umum', () => {
    const g = petakanGalat({ code: '22023', message: 'paket_tidak_sah', hint: 'harga_promo' })
    expect(g.jenis).toBe('argumen')
    expect(kolomDariGalat(g)).toBe('harga_promo')
    for (const k of KOLOM_PAKET) expect(kolomDariGalat(petakanGalat({ code: '22023', message: 'paket_tidak_sah', hint: k }))).toBe(k)
    expect(kolomDariGalat(petakanGalat({ code: '22023', message: 'paket_tidak_sah', hint: 'p_paket' }))).toBeNull()
    expect(kolomDariGalat(petakanGalat({ code: '22023', message: 'lain', hint: 'harga' }))).toBeNull()
    expect(kolomDariGalat(null)).toBeNull()
  })

  it('produk Play dipakai paket lain: pelanggaran unik 23505 menempel di kolom produk Play', () => {
    const unik = petakanGalat({ code: '23505', message: 'duplicate key value violates unique constraint "ai_paket_kredit_play_produk_id_key"' })
    expect(playTerpakaiDariGalat(unik)).toBe(true)
    expect(galatKolomServer(unik)).toEqual({ kolom: 'play_produk_id', kode: 'playTerpakai' })
    // Indeks unik lain di tabel yang sama bukan galat produk Play.
    expect(galatKolomServer(petakanGalat({ code: '23505', message: 'duplicate key value violates unique constraint "ai_paket_kredit_pkey"' }))).toBeNull()
    expect(galatKolomServer(petakanGalat({ code: '23505', message: 'duplicate key value violates unique constraint "ai_paket_kredit_satu_bawaan"' }))).toBeNull()
    // 22023 dengan hint produk Play: galat server umum di kolom itu.
    expect(galatKolomServer(petakanGalat({ code: '22023', message: 'paket_tidak_sah', hint: 'play_produk_id' }))).toEqual({ kolom: 'play_produk_id', kode: 'server' })
    expect(galatKolomServer(petakanGalat({ code: '22023', message: 'paket_tidak_sah', hint: 'harga' }))).toEqual({ kolom: 'harga', kode: 'server' })
    expect(galatKolomServer(null)).toBeNull()
  })

  it('hapus ditolak: 23503 paket_sudah_dibeli; kode hilang: P0002 paket_tidak_ada', () => {
    const dibeli = petakanGalat({ code: '23503', message: 'paket_sudah_dibeli', hint: 'aktif' })
    expect(paketSudahDibeli(dibeli)).toBe(true)
    expect(kolomDariGalat(dibeli)).toBeNull() // hint 'aktif' di sini saran, bukan kolom yang salah
    const hilang = petakanGalat({ code: 'P0002', message: 'paket_tidak_ada', hint: 'kode' })
    expect(hilang.jenis).toBe('tidak-ada')
    expect(paketTidakAda(hilang)).toBe(true)
    expect(paketSudahDibeli(petakanGalat({ code: '22023', message: 'paket_tidak_sah', hint: 'kode' }))).toBe(false)
  })

  it('pesan ke pengguna dilokalkan, bukan kode mentah', () => {
    const { pesanUntuk } = useCashflowMuat()
    expect(pesanUntuk(petakanGalat({ code: '22023', message: 'paket_tidak_sah', hint: 'harga' }))).toBe('paket.galat.tidakSah')
    expect(pesanUntuk(petakanGalat({ code: '23503', message: 'paket_sudah_dibeli', hint: 'aktif' }))).toBe('paket.galat.sudahDibeli')
    expect(pesanUntuk(petakanGalat({ code: 'P0002', message: 'paket_tidak_ada', hint: 'kode' }))).toBe('paket.galat.hilang')
    expect(pesanUntuk(petakanGalat({ code: '23505', message: 'duplicate key value violates unique constraint "ai_paket_kredit_play_produk_id_key"' })))
      .toBe('paket.galat.playTerpakai')
    expect(pesanUntuk(petakanGalat({ code: 'PGRST202', message: 'Could not find the function' }))).toBe('galat.belumAktif')
  })
})

describe('lapisan RPC (Supabase tiruan)', () => {
  beforeEach(() => { panggilan.length = 0; jawaban = { data: null, error: null } })
  const api = useCashflowAdmin()

  it('daftar tanpa argumen', async () => {
    jawaban = { data: { paket: [BARIS] }, error: null }
    expect(daftarPaket(await api.aiPaketDaftar())[0]?.kode).toBe('hemat')
    expect(panggilan).toEqual([{ nama: 'admin_ai_paket_daftar', a: {} }])
  })

  it('simpan mengirim p_paket apa adanya (lengkap atau sebagian), hapus mengirim p_kode; keduanya memulangkan daftar', async () => {
    const m = periksaIsian(isian()).muatan!
    jawaban = { data: { paket: [BARIS], kini: W }, error: null }
    expect(daftarPaket(await api.aiPaketSimpan(m))).toHaveLength(1)
    await api.aiPaketSimpan(muatanAktif(paket(), false))
    expect(kiniServer(await api.aiPaketHapus('hemat'))).toBe(Date.parse(W))
    expect(panggilan).toEqual([
      { nama: 'admin_ai_paket_simpan', a: { p_paket: m } },
      { nama: 'admin_ai_paket_simpan', a: { p_paket: { kode: 'hemat', aktif: false, bawaan: false } } },
      { nama: 'admin_ai_paket_hapus', a: { p_kode: 'hemat' } },
    ])
  })

  it('simpan membawa play_produk_id hanya bila produk Play berubah', async () => {
    jawaban = { data: { paket: [BARIS] }, error: null }
    const asal = paket()
    const ganti = periksaIsian({ ...isianDariPaket(asal), playProdukId: 'kredit_55' }, { asal }).muatan!
    const tetap = periksaIsian(isianDariPaket(asal), { asal }).muatan!
    await api.aiPaketSimpan(ganti)
    await api.aiPaketSimpan(tetap)
    expect(panggilan.map(p => (p.a.p_paket as Record<string, unknown>).play_produk_id)).toEqual(['kredit_55', undefined])
    expect(daftarPaket(await api.aiPaketDaftar())[0]?.playProdukId).toBe('kredit_50')
  })

  it('galat server diteruskan dengan pesan dan hint', async () => {
    jawaban = { data: null, error: { code: '22023', message: 'paket_tidak_sah', hint: 'label' } }
    const g = await api.aiPaketSimpan({ kode: 'hemat', label: 'x' }).catch((e: unknown) => e)
    expect(kolomDariGalat(g as { message: string; hint: string })).toBe('label')
  })

  it('42501 tanpa hint di tulisan (izin pii kurang) jadi izin, bukan "bukan admin"', async () => {
    jawaban = { data: null, error: { code: '42501', message: 'Menyimpan paket kredit menuntut izin cashflow:pii.' } }
    const s = await api.aiPaketSimpan({ kode: 'hemat', aktif: true }).catch((e: unknown) => e)
    const h = await api.aiPaketHapus('hemat').catch((e: unknown) => e)
    for (const g of [s, h]) expect(g).toMatchObject({ jenis: 'izin', hint: 'izin-kurang' })
    // Pembacaan tetap jujur: 42501 tanpa hint di daftar = bukan admin.
    expect(await api.aiPaketDaftar().catch((e: unknown) => e)).toMatchObject({ jenis: 'bukan-admin' })
  })
})

// ── Kamus, penjaga halaman, dan kebersihan teks ──────────────────────────
const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[bahasa])
/** Semua teks di bawah satu simpul kamus; kalimat berfungsi dipanggil dengan contoh. */
function semuaTeks(v: unknown): string[] {
  if (typeof v === 'string') return [v]
  if (typeof v === 'function') return [String((v as (...a: unknown[]) => unknown)(3, 'x', 'y'))]
  if (v && typeof v === 'object') return Object.values(v).flatMap(semuaTeks)
  return []
}

describe('kamus dan halaman', () => {
  const KODE_GALAT: KodeGalatPaket[] = [
    'kodePola', 'kodeTerpakai', 'kreditRentang', 'hargaRentang', 'promoRentang', 'promoTidakLebihMurah', 'promoHemat',
    'tanggalRusak', 'sampaiSebelumMulai', 'labelPanjang', 'labelKarakter', 'urutanAngka', 'bawaanSyarat',
    'playPola', 'playTerpakai', 'server',
  ]

  it('kunci dinamis punya teks ID dan EN', () => {
    const jalur = [
      'nav.paket',
      ...STATUS_PROMO.map(s => `paket.status.${s}`),
      ...KODE_GALAT.map(k => `paket.galat.${k}`),
      ...['aktif', 'bawaan', 'khususUji', 'play'].flatMap(k => [`paket.form.${k}`, `paket.form.${k}Ket`]),
      'paket.form.playHargaUmum', 'paket.kolom.play', 'paket.belumPlay',
    ]
    const hilang = jalur.flatMap(j => (['id', 'en'] as const).filter(b => typeof ambil(b, j) !== 'string').map(b => `${b}:${j}`))
    expect(hilang).toEqual([])
  })

  it('teks paket tanpa em-dash, titik koma, atau emoji', () => {
    for (const b of ['id', 'en'] as const) {
      const teks = [...semuaTeks(ambil(b, 'paket')), String(ambil(b, 'nav.paket'))]
      expect(teks.length).toBeGreaterThan(60)
      const kotor = teks.filter(t => /[—–;]|\p{Extended_Pictographic}/u.test(t))
      expect(kotor, b).toEqual([])
    }
  })

  it('halaman memakai penjaga console + admin CashFlow, dan tertaut dari navigasi dan palet', () => {
    expect(baca('pages/console/cashflow/paket.vue')).toMatch(/definePageMeta\(\{ layout: 'console', middleware: \['console', 'cashflow-admin'\] \}\)/)
    expect(baca('components/cashflow/CashflowNav.vue')).toMatch(/\{ kunci: 'paket', to: '\/console\/cashflow\/paket' \}/)
    expect(baca('components/cashflow/CashflowPalet.vue')).toMatch(/\{ kunci: 'paket', ke: '\/console\/cashflow\/paket'/)
  })

  it('server hanya dipanggil halaman lewat useCashflowAdmin; komponen tidak mengambil data', () => {
    const halaman = baca('pages/console/cashflow/paket.vue')
    expect(halaman).toMatch(/useCashflowAdmin\(\)/)
    expect(halaman).not.toMatch(/\.rpc\(|\$fetch|useFetch|supabase/i)
    for (const k of ['CashflowPaketForm', 'CashflowPaketTabel', 'CashflowPaketPratinjau', 'CashflowPaketKonfirmasi']) {
      expect(baca(`components/cashflow/${k}.vue`), k).not.toMatch(/useCashflowAdmin|\.rpc\(|\$fetch|useFetch/)
    }
  })

  it('terang dan gelap: komponen console tanpa warna mentah; pratinjau mendefinisikan setiap token di dua tema', () => {
    for (const k of ['CashflowPaketForm', 'CashflowPaketTabel', 'CashflowPaketKonfirmasi']) {
      expect(baca(`components/cashflow/${k}.vue`), k).not.toMatch(/#[0-9a-fA-F]{3,8}\b|bg-white|text-black|bg-black|text-white/)
    }
    expect(baca('pages/console/cashflow/paket.vue')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|bg-white|text-black/)
    const sumber = baca('components/cashflow/CashflowPaketPratinjau.vue')
    // Token di blok TIDAK scoped: `:global(...) .x` di blok scoped hanya menyisakan `:global(...)`.
    const gaya = /<style>([\s\S]*?)<\/style>/.exec(sumber)?.[1] ?? ''
    expect(sumber).not.toMatch(/:global\(/)
    const terang = /(?:^|\})\s*\.cf-paket-pratinjau\s*\{([^}]*)\}/.exec(gaya.replace(/\/\*[\s\S]*?\*\//g, ''))?.[1] ?? ''
    const gelap = /html\[data-theme="dark"\] \.cf-paket-pratinjau\s*\{([^}]*)\}/.exec(gaya)?.[1] ?? ''
    const token = (s: string) => [...s.matchAll(/(--cf-[a-z0-9-]+):/g)].map(m => m[1]).sort()
    expect(token(terang).length).toBeGreaterThan(8)
    expect(token(gelap)).toEqual(token(terang))
  })
})

// ── Kontrak terhadap migrasi CashFlow ────────────────────────────────────
const RPC_PAKET = ['admin_ai_paket_daftar', 'admin_ai_paket_simpan', 'admin_ai_paket_hapus'] as const
const adaPaket = adaMigrasi && RPC_PAKET.every((n) => { try { fungsiTerakhir(n); return true } catch { return false } })
/** Teks semua migrasi (tanpa komentar), urut terap. */
const sqlSemua = () => (adaMigrasi ? readdirSync(DIR_MIGRASI).filter(n => n.endsWith('.sql')).sort()
  .map(n => readFileSync(join(DIR_MIGRASI, n), 'utf8').replace(/--[^\n]*/g, '')).join('\n') : '')
const kunciPohon = (p: PohonKunci): string[] => Object.entries(p).flatMap(([k, v]) => [k, ...(v ? kunciPohon(v) : [])])
/** Migrasi produk Play sudah ada di folder: kolomnya ada di tabel. */
const adaPlay = adaPaket && kolomTabel('ai_paket_kredit').kolom.includes('play_produk_id')
const KOLOM_DTO = [
  'kode', 'kredit', 'harga', 'harga_promo', 'promo_mulai', 'promo_sampai', 'label', 'bawaan', 'aktif', 'khusus_uji', 'urutan', 'diubah', 'diubah_oleh',
  ...(adaPlay ? ['play_produk_id'] : []),
]
/** Kunci p_paket yang diterima server: tanpa produk Play sebelum migrasinya. */
const KOLOM_TERIMA = adaPlay ? [...KOLOM_PAKET] : KOLOM_TANPA_PLAY
/** Badan fungsi yang benar-benar membangun jawaban admin: RPC-nya, atau pembantu yang ia pulangkan. */
const badanJawaban = (rpc: string): string => {
  const badan = fungsiTerakhir(rpc).badan
  const pembantu = /return\s+public\.(\w+)\s*\(\s*\)\s*;/.exec(badan)?.[1]
  return pembantu ? fungsiTerakhir(pembantu).badan : badan
}

describe.skipIf(!adaPaket)(`kontrak migrasi paket kredit (${DIR_MIGRASI})`, () => {
  it('parameter RPC = yang dikirim useCashflowAdmin', () => {
    expect(parameterFungsi('admin_ai_paket_daftar')).toEqual([])
    expect(parameterFungsi('admin_ai_paket_simpan').map(p => p.nama)).toEqual(['p_paket'])
    expect(parameterFungsi('admin_ai_paket_hapus').map(p => p.nama)).toEqual(['p_kode'])
  })

  it('kolom tabel ai_paket_kredit = kolom DTO, isian form = kolom yang bisa ditulis', () => {
    expect(kolomTabel('ai_paket_kredit').kolom).toEqual([...KOLOM_DTO].sort())
    for (const k of KOLOM_TERIMA) expect(KOLOM_DTO).toContain(k)
    const terima = /v_kunci\s+not\s+in\s*\(([^)]*)\)/.exec(fungsiTerakhir('admin_ai_paket_simpan').badan)?.[1] ?? ''
    expect([...terima.matchAll(/'([a-z_]+)'/g)].map(m => m[1]).sort()).toEqual([...KOLOM_TERIMA].sort())
  })

  it('CHECK server sama dengan aturan isian console', () => {
    const sql = sqlSemua()
    expect(sql).toContain("check (kode ~ '^[a-z0-9_-]{1,24}$')")
    expect(sql).toContain('check (kredit between 1 and 10000)')
    expect(sql).toContain('check (harga between 1 and 10000000)')
    expect(sql.replace(/\s+/g, ' ')).toContain('check (harga_promo is null or (harga_promo >= 1 and harga_promo < harga and round((1 - harga_promo::numeric / harga) * 100) between 1 and 99))')
    expect(sql).toContain('check (promo_mulai is null or promo_sampai is null or promo_sampai > promo_mulai)')
    expect(sql).toContain('check (label is null or char_length(label) between 1 and 24)')
    expect(sql).toContain('check (not bawaan or (aktif and not khusus_uji))')
    expect(fungsiTerakhir('admin_ai_paket_simpan').badan).toContain("v_teks ~ '[[:cntrl:]]'")
  })

  it.skipIf(!adaPlay)('produk Play: pola server = POLA_PLAY_PRODUK, unik dengan nama yang dikenali console', () => {
    const sql = sqlSemua()
    expect(sql).toContain(`'${POLA_PLAY_PRODUK.source}'`)
    // Pelanggaran unik harus bisa dipetakan ke kolomnya: nama indeks memuat "play"
    // (unique di kolom memberi nama <tabel>_play_produk_id_key), atau simpan
    // menolaknya sendiri dengan paket_tidak_sah hint play_produk_id.
    const pesan = (nama: string) => `duplicate key value violates unique constraint "${nama}"`
    const sebaris = /play_produk_id\s+text\b[^,;]*\bunique\b/i.test(sql) ? ['ai_paket_kredit_play_produk_id_key'] : []
    const bernama = [
      ...sql.matchAll(/create\s+unique\s+index\s+(?:if\s+not\s+exists\s+)?(\w+)\s+on\s+(?:public\.)?ai_paket_kredit\s*(?:using\s+\w+\s*)?\(\s*play_produk_id\b/gi),
      ...sql.matchAll(/constraint\s+(\w+)\s+unique\s*\(\s*play_produk_id\s*\)/gi),
    ].map(m => m[1]!)
    const nama = [...sebaris, ...bernama]
    const tolakSendiri = /'paket_tidak_sah' using errcode = '22023', hint = 'play_produk_id'/.test(fungsiTerakhir('admin_ai_paket_simpan').badan)
    expect(nama.length > 0 || tolakSendiri, 'unique play_produk_id tidak ditemukan').toBe(true)
    for (const n of nama) expect(playTerpakaiDariGalat({ message: pesan(n) }), n).toBe(true)
  })

  it('waktu yang dikirim console lolos pola waktu server', () => {
    const pola = /c_pola_waktu\s+constant\s+text\s*:=\s*'([^']+)'/.exec(fungsiTerakhir('admin_ai_paket_simpan').badan)?.[1]
    expect(pola).toBeTruthy()
    const re = new RegExp(pola!)
    const h = periksaIsian(isian({ harga: '25000', hargaPromo: '20000', promoMulai: '2026-12-01T08:00', promoSampai: '2026-12-31T23:59' }))
    expect(re.test(h.muatan!.promo_mulai!)).toBe(true)
    expect(re.test(h.muatan!.promo_sampai!)).toBe(true)
    // Nilai asal yang dikirim ulang apa adanya (bentuk to_jsonb timestamptz).
    expect(re.test('2026-11-01T00:00:30+00:00')).toBe(true)
    expect(re.test('2026-11-01T00:00:30.123456+00:00')).toBe(true)
  })

  it('aturan promo server = statusPromo: mulai ikut, sampai tidak; hemat dari numeric', () => {
    const efektif = fungsiTerakhir('ai_paket_kredit_efektif_inti').badan.replace(/\s+/g, ' ')
    expect(efektif).toContain('p.promo_mulai is null or p.promo_mulai <= p_kini')
    expect(efektif).toContain('p.promo_sampai is null or p_kini < p.promo_sampai')
    expect(efektif).toContain('round((1 - p.harga_promo::numeric / p.harga) * 100)')
    const promo = badanJawaban('admin_ai_paket_daftar').replace(/\s+/g, ' ')
    expect(promo).toContain("when k.promo_mulai is not null and now() < k.promo_mulai then 'terjadwal'")
    expect(promo).toContain("when k.promo_sampai is not null and now() >= k.promo_sampai then 'berakhir'")
    expect(promo).toMatch(/order by k\.urutan, k\.kode collate "C"/)
  })

  it('simpan menolak dengan paket_tidak_sah, hint = kolom form (atau paket / kunci asing)', () => {
    const simpan = fungsiTerakhir('admin_ai_paket_simpan').badan
    const hint = [...simpan.matchAll(/'paket_tidak_sah' using errcode = '22023', hint = '([a-z_]+)'/g)].map(m => m[1]!)
    expect(hint.length).toBeGreaterThan(5)
    for (const h of hint) expect([...KOLOM_PAKET, 'paket'], h).toContain(h)
    expect(simpan).toMatch(/hint = v_kunci/)
  })

  it('hapus: 23503 paket_sudah_dibeli, P0002 paket_tidak_ada', () => {
    const hapus = fungsiTerakhir('admin_ai_paket_hapus').badan
    expect(hapus).toContain("'paket_sudah_dibeli' using errcode = '23503'")
    expect(hapus).toContain("'paket_tidak_ada' using errcode = 'P0002'")
  })

  it('daftar, simpan, dan hapus memulangkan bentuk yang sama, dengan kunci yang dikenal adapter', () => {
    for (const rpc of RPC_PAKET) expect(fungsiTerakhir(rpc).badan, rpc).toMatch(/return public\.ai_paket_admin_bangun\(\);/)
    const kunci = semuaPohonJsonb(badanJawaban('admin_ai_paket_daftar')).flatMap(kunciPohon)
    const play: Array<keyof PaketAdminDTO> = adaPlay ? ['play_terjual', 'play_harga_terakhir'] : []
    const dto: Array<keyof PaketAdminDTO> = [...KOLOM_DTO as Array<keyof PaketAdminDTO>, 'efektif', 'promo', 'terjual', 'pernah_dibeli', ...play]
    // play_harga_terakhir membawa {harga_mikro, mata_uang, pada} (migrasi Play Billing 20261112130000).
    expect(new Set(kunci)).toEqual(new Set(['paket', 'kini', ...dto, ...(adaPlay ? ['harga_mikro', 'mata_uang', 'pada'] : [])]))
    expect(Object.keys(BARIS).filter(k => adaPlay || !k.startsWith('play_')).sort()).toEqual([...dto].sort())
    // Bentuk efektif boleh membawa play_produk_id (untuk aplikasi); console tidak memakainya.
    const efektif = semuaPohonJsonb(fungsiTerakhir('ai_paket_kredit_efektif_inti').badan).flatMap(kunciPohon)
    expect(efektif.filter(k => k !== 'play_produk_id').sort()).toEqual(Object.keys(BARIS.efektif!).sort())
  })

  it('ketiga RPC bisa dipanggil sesi console (grant execute ke authenticated)', () => {
    const sql = sqlSemua()
    for (const nama of RPC_PAKET) {
      const pola = new RegExp(`(grant|revoke)\\s+[a-z ,]+\\s+on\\s+function\\s+public\\.${nama}\\s*\\([^)]*\\)\\s+(to|from)\\s+([^;]+);`, 'gi')
      let terakhir: string | null = null
      for (const m of sql.matchAll(pola)) if (/\bauthenticated\b/.test(m[3]!)) terakhir = m[1]!.toLowerCase()
      expect(terakhir, nama).toBe('grant')
    }
  })
})

it.skipIf(adaPaket || !adaMigrasi)('migrasi paket kredit belum ada di folder CashFlow: kontrak dilewati', () => {
  expect(existsSync(DIR_MIGRASI)).toBe(true)
})

it.skipIf(!adaPaket || adaPlay)('migrasi produk Play belum ada di folder CashFlow: kontrak memeriksa bentuk tanpa play_produk_id', () => {
  expect(kolomTabel('ai_paket_kredit').kolom).not.toContain('play_produk_id')
})
