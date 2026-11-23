/**
 * Bagian "Minat Kilas Pasar" di halaman Laporan (spek analitik pasar dan
 * promo 23 Nov 2026, AP-7): adapters/cashflowLaporanPasar.ts,
 * CashflowLaporanPasar.vue (memuat dan galat), CashflowLaporanPasarIsi.vue
 * (tampilan).
 *
 * - Adapter murni: bentuk JSON bagian 4 spek, data kosong, nilai `lain`,
 *   angka dari string atau rusak, sumber asing, urutan, corong.
 * - Galat fungsi tidak ada (PGRST202, atau 42883 yang menyebut RPC ini)
 *   menjadi "belum aktif": kalimat tenang di bagian ini saja.
 * - Tampilan dirender ke teks (vue/server-renderer), Indonesia dan Inggris,
 *   lengkap dan kosong, tanpa kode mentah.
 * - Kontrak dibanding migrasi CashFlow (folder CASHFLOW_MIGRASI). Selama
 *   admin_laporan_pasar belum ada di folder itu, uji kontraknya "skipped".
 * - Nama sumber dibanding katalog promo_hemat di migrasi dan SUMBER_DIKENAL
 *   aplikasi bila berkasnya ada.
 * - Data sintetis uji tampilan berbentuk sama dengan DTO contoh di sini.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, createSSRApp, h, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { DIR_MIGRASI, adaMigrasi, fungsiTerakhir, parameterFungsi, pohonContoh, pohonDengan, urutPohon, type PohonKunci } from './migrasi'
import {
  ASAL_HALAMAN, DARI_PROMO, DETAIL_DARI, JENIS_SUMBER_PASAR, LAMA_BACA, LANGKAH_CORONG_PASAR, MAKS_SUMBER_PASAR, METRIK_PASAR,
  NAMA_SITUS_PASAR, NAMA_SUMBER_PASAR, TAB_PASAR, TOPIK_DOMI, TOPIK_KARTU, idSumberAman, keMinatPasar, namaSumberPasar,
  persenCorong, seriPasar, type MinatPasarDTO,
} from '../../adapters/cashflowLaporanPasar'
import { BAGIAN_LAPORAN, RENTANG_LAPORAN } from '../../adapters/cashflowLaporan'
import { GalatAdmin, HINT_22023, HINT_42501, petakanGalat } from '../../composables/cashflow/useCashflowAdmin'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { buatServer } from '../../scripts/data-sintetis-console.mjs'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (jalur: string): string => readFileSync(join(AKAR, jalur), 'utf8')
const adaFungsi = (nama: string): boolean => { try { fungsiTerakhir(nama); return true } catch { return false } }
const ADA_PASAR = adaMigrasi && adaFungsi('admin_laporan_pasar')

// ── Contoh jawaban server (karangan, bentuk bagian 4 spek) ────────────────
const hari = (tanggal: string, x: number) => ({ tanggal, lihat: x * 4, detail: x * 2, ketuk: x, halaman: x, domi: Math.floor(x / 2) })
const PASAR: MinatPasarDTO = {
  hari: 7, dari: '2026-11-16', sampai: '2026-11-22',
  ringkas: { lihat: 120, detail: 48, ketuk: 30, halaman: 36, domi: 12 },
  harian: [
    hari('2026-11-22', 6), hari('2026-11-16', 0), hari('2026-11-17', 0), hari('2026-11-18', 2),
    hari('2026-11-19', 3), hari('2026-11-20', 4), hari('2026-11-21', 5),
  ],
  tab: { pasar: 40, promo: 25 },
  detail_dari: { kepala: 20, ubin: 18, promo: 9, lain: 1 },
  sumber: [
    { sumber: 'gopay', jenis: 'dompet', ketuk: 14, orang: 11 },
    { sumber: 'logammulia', jenis: 'emas_saham', ketuk: '9', orang: '8' },
    { sumber: 'lain', jenis: 'dompet', ketuk: 2, orang: 2 },
  ],
  dari_promo: { cocok: 12, semua: 5, lihat_semua: 7 },
  halaman: {
    asal: { kartu: 30, domi: 10, lain: 1 },
    lama: { kurang_10: 9, sampai_60: 15, sampai_180: 8, lebih_180: 2 },
    browser: 4, pindah: 3,
  },
  tanya_kartu: { kurs: 6, emas: 4, promo: 2 },
  domi: {
    kurs: { tanya: 10, orang: 6 }, emas: { tanya: 7, orang: 5 }, saham: { tanya: 2, orang: 2 },
    promo: { tanya: 3, orang: 3 }, umum: { tanya: 1, orang: 1 },
  },
}
/** Jawaban server tanpa satu peristiwa pun: setiap tanggal tetap dikirim, angkanya nol. */
const nolDomi = { tanya: 0, orang: 0 }
const KOSONG: MinatPasarDTO = {
  hari: 7, dari: PASAR.dari, sampai: PASAR.sampai,
  ringkas: { lihat: 0, detail: 0, ketuk: 0, halaman: 0, domi: 0 },
  harian: PASAR.harian.map(h => hari(h.tanggal, 0)),
  tab: { pasar: 0, promo: 0 },
  detail_dari: { kepala: 0, ubin: 0, promo: 0, lain: 0 },
  sumber: [],
  dari_promo: { cocok: 0, semua: 0, lihat_semua: 0 },
  halaman: { asal: { kartu: 0, domi: 0, lain: 0 }, lama: { kurang_10: 0, sampai_60: 0, sampai_180: 0, lebih_180: 0 }, browser: 0, pindah: 0 },
  tanya_kartu: { kurs: 0, emas: 0, promo: 0 },
  domi: { kurs: nolDomi, emas: nolDomi, saham: nolDomi, promo: nolDomi, umum: nolDomi },
}

/** Pasangan errcode:hint di badan fungsi, urut, tanpa ganda. */
const galatDi = (badan: string): string[] =>
  [...new Set([...badan.matchAll(/errcode\s*=\s*'(\w+)'(?:,\s*hint\s*=\s*'([\w-]+)')?/g)].map(m => `${m[1]}:${m[2] ?? ''}`))].sort()
/** Semua nama kunci di pohon contoh, bersarang. */
const semuaKunci = (p: PohonKunci | null): string[] =>
  (p ? Object.entries(p).flatMap(([k, v]) => [k, ...semuaKunci(v)]) : [])

describe.skipIf(!ADA_PASAR)('kontrak admin_laporan_pasar = migrasi CashFlow', () => {
  it('parameter p_hari saja, punya bawaan, stable security definer dengan search_path public', () => {
    expect(parameterFungsi('admin_laporan_pasar')).toEqual([{ nama: 'p_hari', bawaan: true }])
    const { kepala } = fungsiTerakhir('admin_laporan_pasar')
    expect(kepala).toMatch(/returns\s+jsonb/i)
    expect(kepala).toMatch(/\bstable\b/i)
    expect(kepala).toMatch(/security\s+definer/i)
    expect(kepala).toMatch(/set\s+search_path\s*=\s*public/i)
  })

  it('kunci tingkat atas = DTO contoh, dan setiap kunci bersarang contoh tertulis di badan', () => {
    const { badan } = fungsiTerakhir('admin_laporan_pasar')
    expect(Object.keys(pohonDengan(badan, 'ringkas', 'harian', 'sumber')).sort()).toEqual(Object.keys(PASAR).sort())
    const hilang = [...new Set(semuaKunci(pohonContoh(PASAR)))].filter(k => !badan.includes(`'${k}'`))
    expect(hilang).toEqual([])
  })

  it('izin view tanpa audit, akun dalam tidak dihitung, WIB, rentang halaman diterima server', () => {
    const { badan } = fungsiTerakhir('admin_laporan_pasar')
    expect(badan).toMatch(/konsol_boleh\('cashflow:view'\)/)
    expect(badan).toMatch(/is_platform_admin/)
    expect(badan).not.toMatch(/cashflow:pii|admin_catat_baca|admin_audit/)
    expect(badan).toMatch(/laporan_akun_dalam_inti\(\)/)
    expect(badan).toMatch(/Asia\/Jakarta/)
    expect(badan).toMatch(/<\s*7\b/)
    expect(badan).toMatch(/>\s*90\b/)
    expect(RENTANG_LAPORAN.map(Number).every(h => h >= 7 && h <= 90)).toBe(true)
  })

  it('setiap galat memakai hint yang dikenal console', () => {
    const galat = galatDi(fungsiTerakhir('admin_laporan_pasar').badan)
    expect(galat.length).toBeGreaterThan(0)
    for (const g of galat) {
      const [kode, hint] = g.split(':')
      if (kode === '22023') expect(HINT_22023 as readonly string[], g).toContain(hint)
      else if (kode === '42501') expect(hint === '' || hint! in HINT_42501, g).toBe(true)
      else throw new Error(`errcode tak terduga: ${g}`)
    }
  })
})

describe('adapter Minat Kilas Pasar', () => {
  it('jawaban lengkap terbaca, angka string jadi angka, harian urut tanggal naik', () => {
    const m = keMinatPasar(PASAR)
    expect([m.hari, m.dari, m.sampai]).toEqual([7, '2026-11-16', '2026-11-22'])
    expect(m.ringkas).toEqual({ lihat: 120, detail: 48, ketuk: 30, halaman: 36, domi: 12 })
    expect(m.harian.map(h => h.tanggal)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'])
    expect(seriPasar(m, 'lihat')).toEqual([0, 0, 8, 12, 16, 20, 24])
    expect(METRIK_PASAR.every(k => seriPasar(m, k).length === 7)).toBe(true)
    expect(m.tab).toEqual({ pasar: 40, promo: 25 })
    expect(m.detailDari).toEqual({ kepala: 20, ubin: 18, promo: 9, lain: 1 })
    expect(m.dariPromo).toEqual({ cocok: 12, semua: 5, lihat_semua: 7 })
    expect(m.halaman).toEqual({
      asal: { kartu: 30, domi: 10, lain: 1 }, lama: { kurang_10: 9, sampai_60: 15, sampai_180: 8, lebih_180: 2 }, tutup: 34, browser: 4, pindah: 3,
    })
    expect(m.tanyaKartu).toEqual({ kurs: 6, emas: 4, promo: 2 })
    expect(m.domi.map(t => t.topik)).toEqual([...TOPIK_DOMI])
    expect(m.domi[0]).toEqual({ topik: 'kurs', tanya: 10, orang: 6 })
    expect(m.kosong).toBe(false)
  })

  it('corong: empat langkah berurutan, persen dari langkah sebelumnya, lebih dari 100 tidak ditulis', () => {
    const m = keMinatPasar(PASAR)
    expect(m.corong).toEqual([
      { kunci: 'lihat', orang: 120, persen: null },
      { kunci: 'detail', orang: 48, persen: 40 },
      { kunci: 'ketuk', orang: 30, persen: 63 },
      { kunci: 'halaman', orang: 36, persen: null },
    ])
    expect(m.corong.map(c => c.kunci)).toEqual([...LANGKAH_CORONG_PASAR])
    expect(persenCorong(5, 0)).toBeNull()
    expect(persenCorong(0, 4)).toBe(0)
    expect(persenCorong(4, 4)).toBe(100)
    expect(persenCorong(1, 3)).toBe(33)
  })

  it('sumber: nama dari id, nilai lain tetap lain, jenis tautan emas_saham dikenali', () => {
    const m = keMinatPasar(PASAR)
    expect(m.sumber).toEqual([
      { sumber: 'gopay', nama: 'GoPay', jenis: 'dompet', ketuk: 14, orang: 11 },
      { sumber: 'logammulia', nama: 'Logam Mulia (Antam)', jenis: 'emas_saham', ketuk: 9, orang: 8 },
      { sumber: 'lain', nama: null, jenis: 'dompet', ketuk: 2, orang: 2 },
    ])
    expect(namaSumberPasar('idx')).toBe('Bursa Efek Indonesia')
    expect(namaSumberPasar('lain')).toBeNull()
    expect(namaSumberPasar('constructor')).toBeNull()
  })

  it('sumber rusak: teks mentah dibaca lain dan digabung, jenis asing null, id baru tampil apa adanya, urut dan dibatasi 20', () => {
    const m = keMinatPasar({
      ...PASAR,
      sumber: [
        { sumber: 'https://contoh.invalid/promo', jenis: 'dompet', ketuk: 3, orang: 3 },
        { sumber: 'Promo GoPay', jenis: 'dompet', ketuk: 2, orang: 2 },
        { sumber: 'lain', jenis: 'dompet', ketuk: 1, orang: 4 },
        { sumber: 'dompet_baru', jenis: 'kripto', ketuk: '5', orang: 5 },
        { sumber: 'bca', jenis: 'dompet', ketuk: 0, orang: 0 },
        null as unknown as MinatPasarDTO['sumber'][number],
        ...Array.from({ length: 25 }, (_, i) => ({ sumber: `uji_${String.fromCharCode(97 + i)}`, jenis: 'belanja', ketuk: 1, orang: 1 })),
      ],
    })
    expect(m.sumber).toHaveLength(MAKS_SUMBER_PASAR)
    expect(m.sumber[0]).toEqual({ sumber: 'lain', nama: null, jenis: 'dompet', ketuk: 6, orang: 4 })
    expect(m.sumber[1]).toEqual({ sumber: 'dompet_baru', nama: null, jenis: null, ketuk: 5, orang: 5 })
    expect(m.sumber.some(s => s.sumber === 'bca')).toBe(false)
    expect(m.sumber.slice(2).map(s => s.sumber)).toEqual(Array.from({ length: 18 }, (_, i) => `uji_${String.fromCharCode(97 + i)}`))
    expect(JSON.stringify(m)).not.toMatch(/contoh\.invalid|Promo GoPay/)
    for (const buruk of ['', 'A', 'a'.repeat(31), 'a-b', 'a.b', 7, null]) expect(idSumberAman(buruk), String(buruk)).toBe('lain')
    expect(JENIS_SUMBER_PASAR).toEqual(['dompet', 'belanja', 'emas', 'emas_saham'])
  })

  it('data kosong: setiap tanggal nol, tidak ada sumber, kosong true tanpa galat', () => {
    const m = keMinatPasar(KOSONG)
    expect(m.kosong).toBe(true)
    expect(m.harian).toHaveLength(7)
    expect(m.sumber).toEqual([])
    expect(m.corong.map(c => [c.orang, c.persen])).toEqual([[0, null], [0, null], [0, null], [0, null]])
    for (const v of [null, undefined, {} as MinatPasarDTO, { sumber: 'x', harian: 'y', domi: [] } as unknown as MinatPasarDTO]) {
      const k = keMinatPasar(v)
      expect(k.kosong, JSON.stringify(v)).toBe(true)
      expect(k.harian).toEqual([])
      expect(k.domi.map(t => t.topik)).toEqual([...TOPIK_DOMI])
      expect([k.dari, k.sampai, k.hari]).toEqual(['', '', 0])
    }
  })

  it('angka rusak jadi nol, kunci asing diabaikan, tanggal rusak dibuang', () => {
    const m = keMinatPasar({
      ...KOSONG,
      ringkas: { lihat: 'banyak', detail: -3, ketuk: Number.NaN, halaman: '2.6', domi: null } as unknown as MinatPasarDTO['ringkas'],
      harian: [{ tanggal: 'kemarin', lihat: 3 }, { tanggal: 7 }, { tanggal: '2026-11-20T17:00:00Z', lihat: '4' }] as unknown as MinatPasarDTO['harian'],
      tab: { pasar: 2, promo: 1, rahasia: 99 } as unknown as MinatPasarDTO['tab'],
      domi: { kurs: { tanya: '3', orang: 'x' }, kripto: { tanya: 9, orang: 9 } } as unknown as MinatPasarDTO['domi'],
    })
    expect(m.ringkas).toEqual({ lihat: 0, detail: 0, ketuk: 0, halaman: 3, domi: 0 })
    expect(m.harian).toEqual([{ tanggal: '2026-11-20', lihat: 4, detail: 0, ketuk: 0, halaman: 0, domi: 0 }])
    expect(m.tab).toEqual({ pasar: 2, promo: 1 })
    expect(m.domi).toEqual([
      { topik: 'kurs', tanya: 3, orang: 0 }, { topik: 'emas', tanya: 0, orang: 0 }, { topik: 'saham', tanya: 0, orang: 0 },
      { topik: 'promo', tanya: 0, orang: 0 }, { topik: 'umum', tanya: 0, orang: 0 },
    ])
    expect(m.kosong).toBe(false)
  })

  it('galat fungsi tidak ditemukan menjadi belum aktif, galat lain tidak', () => {
    const pgrst = petakanGalat({ code: 'PGRST202', message: 'Could not find the function public.admin_laporan_pasar(p_hari) in the schema cache' }, 'admin_laporan_pasar')
    expect(pgrst.jenis).toBe('belum-aktif')
    const pg = petakanGalat({ code: '42883', message: 'function public.admin_laporan_pasar(p_hari => integer) does not exist' }, 'admin_laporan_pasar')
    expect(pg.jenis).toBe('belum-aktif')
    const dalam = petakanGalat({ code: '42883', message: 'function public.laporan_akun_dalam_inti() does not exist' }, 'admin_laporan_pasar')
    expect(dalam.jenis).toBe('lain')
    expect(petakanGalat({ code: '22023', hint: 'hari', message: 'Rentang hari 7 sampai 90.' }, 'admin_laporan_pasar').jenis).toBe('argumen')
  })
})

describe('kamus Minat Kilas Pasar', () => {
  const ambil = (b: 'id' | 'en', jalur: string): unknown =>
    jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])

  it('setiap kunci dinamis ada di ID dan EN', () => {
    const jalur = [
      'laporan.bagian.pasar',
      ...LANGKAH_CORONG_PASAR.map(k => `laporan.pasar.corong.${k}`),
      ...METRIK_PASAR.map(k => `laporan.pasar.metrik.${k}`),
      ...[...JENIS_SUMBER_PASAR, 'lain'].map(k => `laporan.pasar.jenis.${k}`),
      ...TAB_PASAR.map(k => `laporan.pasar.tab.${k}`),
      ...DETAIL_DARI.map(k => `laporan.pasar.detailDari.${k}`),
      ...DARI_PROMO.map(k => `laporan.pasar.dariPromo.${k}`),
      ...ASAL_HALAMAN.map(k => `laporan.pasar.asal.${k}`),
      ...LAMA_BACA.map(k => `laporan.pasar.lama.${k}`),
      ...TOPIK_KARTU.map(k => `laporan.pasar.topikKartu.${k}`),
      ...TOPIK_DOMI.map(k => `laporan.pasar.topikDomi.${k}`),
    ]
    const hilang = jalur.flatMap(k => (['id', 'en'] as const).filter(b => ambil(b, k) === undefined).map(b => `${b}:${k}`))
    expect(hilang).toEqual([])
    expect(BAGIAN_LAPORAN).toContain('pasar')
    expect(BAGIAN_LAPORAN.indexOf('pasar')).toBe(BAGIAN_LAPORAN.indexOf('kebiasaan') + 1)
    expect(BAGIAN_LAPORAN.at(-1)).toBe('saldo')
  })

  it('kosong ditulis "Belum ada data", label ID dan EN berbeda', () => {
    expect(ambil('id', 'laporan.pasar.kosong')).toBe('Belum ada data.')
    expect(ambil('id', 'laporan.pasar.kosongSemua')).toMatch(/^Belum ada data di rentang ini\./)
    expect(ambil('id', 'laporan.bagian.pasar')).toBe('Minat Kilas Pasar')
    const id = ambil('id', 'laporan.pasar.corong') as Record<string, string>
    const en = ambil('en', 'laporan.pasar.corong') as Record<string, string>
    for (const k of LANGKAH_CORONG_PASAR) expect(en[k], k).not.toBe(id[k])
  })
})

// ── Tampilan (vue/server-renderer) ───────────────────────────────────────
let bahasa: 'id' | 'en' = 'id'
const cari = (b: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])
/** Keadaan muat palsu untuk wadah: diisi uji sebelum render. */
const muatPalsu = { galat: ref<GalatAdmin | null>(null), memuat: ref(false) }
vi.stubGlobal('ref', ref)
vi.stubGlobal('shallowRef', shallowRef)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => cari(bahasa, k) ?? k, bahasa: computed(() => bahasa) }))
vi.stubGlobal('useCashflowAdmin', () => ({ laporanPasar: () => new Promise(() => {}) }))
vi.stubGlobal('useCashflowMuat', () => ({
  memuat: muatPalsu.memuat, galat: muatPalsu.galat,
  pesanGalat: computed(() => (muatPalsu.galat.value && muatPalsu.galat.value.jenis !== 'belum-aktif' ? 'Server sedang bermasalah.' : '')),
  muat: () => Promise.resolve(true), batal: () => {},
}))
const { default: Isi } = await import('../../components/cashflow/CashflowLaporanPasarIsi.vue')
const { default: Wadah } = await import('../../components/cashflow/CashflowLaporanPasar.vue')
const { default: BarRows } = await import('../../components/cashflow/CashflowBarRows.vue')
const { default: Sparkline } = await import('../../components/cashflow/CashflowSparkline.vue')
const { default: KeadaanKosong } = await import('../../components/cashflow/CashflowKeadaanKosong.vue')
const { default: Tabel } = await import('../../components/cashflow/CashflowTabel.vue')

const Ikon = { props: ['name'], render(this: { name: string }) { return h('i', { 'data-ikon': this.name }) } }
const Keadaan = { props: ['jenis', 'pesan'], render(this: { jenis: string; pesan: string }) { return h('div', { 'data-keadaan': this.jenis, role: this.jenis === 'galat' ? 'alert' : undefined }, this.pesan) } }
const IzinKurang = { render: () => h('div', { 'data-izin-kurang': '' }) }
const render = (komponen: Component, props: Record<string, unknown>) => {
  const app = createSSRApp({ render: () => h(komponen, props) })
  app.component('Icon', Ikon)
  app.component('CashflowBarRows', BarRows)
  app.component('CashflowSparkline', Sparkline)
  app.component('CashflowKeadaanKosong', KeadaanKosong)
  app.component('CashflowTabel', Tabel)
  app.component('CashflowKeadaan', Keadaan)
  app.component('CashflowIzinKurang', IzinKurang)
  app.component('CashflowLaporanPasarIsi', Isi)
  return renderToString(app)
}
const teksSaja = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const MENTAH = /laporan\.\w|galat\.\w|undefined|\bnull\b|NaN|\[object |emas_saham|lihat_semua|kurang_10|sampai_60|sampai_180|lebih_180|detail_dari|tanya_kartu/
const TERLARANG = /[—–;]|\p{Extended_Pictographic}/u

describe('CashflowLaporanPasarIsi', () => {
  it('lengkap (ID): corong, harian, sumber bernama, tab, asal Detail, promo, halaman, Tanya Domi, dan tabel Domi', async () => {
    bahasa = 'id'
    const html = await render(Isi, { minat: keMinatPasar(PASAR) })
    const teks = teksSaja(html)
    for (const uji of ['pasar-corong', 'pasar-harian', 'pasar-sumber', 'pasar-tab', 'pasar-detail-dari', 'pasar-promo', 'pasar-halaman', 'pasar-tanya-kartu', 'pasar-domi-tabel']) {
      expect(html, uji).toContain(`data-uji="${uji}"`)
    }
    expect(html).not.toContain('data-uji="pasar-kosong"')
    expect(teks).toContain('Minat Kilas Pasar')
    expect(teks).toContain('Kartu ini baru ada di aplikasi 1.6.0.')
    expect(teks).toMatch(/Melihat kartu 120 Membuka Detail 48 \(40%\) Mengetuk sumber 30 \(63%\) Membuka halaman resmi 36 Halaman resmi/)
    expect(teks).toContain('Bertanya ke Domi soal pasar')
    expect(teks).toContain('GoPay 14 11 orang, Dompet dan bank')
    expect(teks).toContain('Logam Mulia (Antam) 9 8 orang, Tautan emas dan saham')
    expect(teks).toContain('Sumber lain 2 2 orang, Dompet dan bank')
    expect(teks).toContain('Pasar 40 Promo 25')
    expect(teks).toContain('Judul atau tombol Detail 20 Ubin Emas, USD, atau SAR 18 Baris Promo resmi 9 Lainnya 1')
    expect(teks).toContain('Dari yang cocok dengan dompetnya 12 Dari daftar Lihat semua 5 Tombol Lihat semua diketuk 7')
    expect(teks).toContain('Kartu Kilas Pasar 30 Jawaban Domi 10 Pintu lain 1')
    expect(teks).toContain('Dari 34 halaman yang tercatat ditutup.')
    expect(teks).toContain('Kurang dari 10 detik 9 10 sampai 60 detik 15 1 sampai 3 menit 8 Lebih dari 3 menit 2')
    expect(teks).toContain('Dibuka di browser 4 kali')
    expect(teks).toContain('Pindah ke situs lain 3 kali')
    expect(teks).toContain('Soal kurs 6 Soal emas 4 Soal promo 2')
    expect(teks).toContain('Kurs dan valas 10 6 Emas 7 5 Saham 2 2 Promo 3 3 Umum, misalnya investasi atau daya beli 1 1')
    // Harian: lima seri. Lihat punya lima hari berisi, jadi garis tampil.
    expect((html.match(/data-metrik="/g) ?? []).length).toBe(5)
    expect(html).toMatch(/data-metrik="lihat"[\s\S]*?<svg/)
    expect(teks).toContain('120 orang di rentang ini')
    expect(teks).not.toMatch(MENTAH)
    expect(teks).not.toMatch(TERLARANG)
  })

  it('lengkap (EN): label Inggris, angka dan nama merek sama', async () => {
    bahasa = 'en'
    const teks = teksSaja(await render(Isi, { minat: keMinatPasar(PASAR) }))
    expect(teks).toContain('Market card interest')
    expect(teks).toMatch(/Saw the card 120 Opened Details 48 \(40%\) Tapped a source 30 \(63%\) Opened an official page 36/)
    expect(teks).toContain('GoPay 14 11 people, Wallets and banks')
    expect(teks).toContain('Exchange rates 10 6')
    expect(teks).not.toMatch(MENTAH)
    expect(teks).not.toMatch(TERLARANG)
    bahasa = 'id'
  })

  it.each(['id', 'en'] as const)('kosong (%s): satu kalimat Belum ada data, tanpa kotak, tanpa galat', async (b) => {
    bahasa = b
    const html = await render(Isi, { minat: keMinatPasar(KOSONG) })
    const teks = teksSaja(html)
    expect(html).toContain('data-uji="pasar-kosong"')
    expect(teks).toContain(b === 'id' ? 'Belum ada data di rentang ini.' : 'No data in this range yet.')
    expect(html).not.toContain('data-uji="pasar-corong"')
    expect(html).not.toMatch(/role="alert"|ca-tone-danger/)
    expect(teks).not.toMatch(MENTAH)
    bahasa = 'id'
  })

  it('sebagian kosong: kotak tanpa angka menulis Belum ada data, kotak lain tetap tampil', async () => {
    bahasa = 'id'
    const html = await render(Isi, { minat: keMinatPasar({ ...KOSONG, ringkas: { ...KOSONG.ringkas, lihat: 3 }, tab: { pasar: 2, promo: 0 } }) })
    const teks = teksSaja(html)
    expect(html).toContain('data-uji="pasar-corong"')
    expect(teks).toContain('Pasar 2 Promo 0')
    // Sumber, asal Detail, promo, asal halaman, lama, Tanya Domi, dan Domi: tujuh kotak kosong.
    expect((teks.match(/Belum ada data\./g) ?? []).length).toBe(7)
    expect(html).not.toContain('data-uji="pasar-domi-tabel"')
    expect(teks).toContain('Baru 0 hari yang berisi.')
  })
})

describe('CashflowLaporanPasar (memuat dan galat)', () => {
  it('fungsi belum ada di server: kalimat tenang di bagian ini, bukan galat merah', async () => {
    muatPalsu.galat.value = petakanGalat({ code: 'PGRST202', message: 'Could not find the function public.admin_laporan_pasar(p_hari) in the schema cache' }, 'admin_laporan_pasar')
    const html = await render(Wadah, { hari: 30 })
    expect(html).toContain('data-uji="laporan-belum-aktif"')
    expect(html).toContain('role="status"')
    expect(teksSaja(html)).toBe('Minat Kilas Pasar belum aktif di server. Angkanya muncul sendiri begitu pembaruan server terpasang.')
    expect(html).not.toMatch(/role="alert"|data-keadaan="galat"/)
    muatPalsu.galat.value = null
  })

  it('galat lain: kotak galat dengan coba lagi, izin kurang: ajakan verifikasi, belum ada jawaban: memuat', async () => {
    muatPalsu.galat.value = new GalatAdmin('lain', 'x')
    expect(await render(Wadah, { hari: 30 })).toContain('data-keadaan="galat"')
    muatPalsu.galat.value = new GalatAdmin('izin', 'x', 'izin-kurang')
    expect(await render(Wadah, { hari: 30 })).toContain('data-izin-kurang')
    muatPalsu.galat.value = null
    expect(await render(Wadah, { hari: 30 })).toContain('data-keadaan="memuat"')
  })
})

describe('komponen, halaman, dan pemanggil', () => {
  const wadah = baca('components/cashflow/CashflowLaporanPasar.vue')
  const isi = baca('components/cashflow/CashflowLaporanPasarIsi.vue')
  const admin = baca('composables/cashflow/useCashflowAdmin.ts')
  const halaman = baca('pages/console/cashflow/laporan.vue')

  it('pemanggil memakai RPC dan nama argumen kontrak, wadah memakai rentang halaman dan adapter', () => {
    expect(admin).toMatch(/laporanPasar: \(hari: number\) => rpc<MinatPasarDTO>\('admin_laporan_pasar', \{ p_hari: hari \}\)/)
    expect(wadah).toMatch(/api\.laporanPasar\(hari\)/)
    expect(wadah).toMatch(/minat\.value = keMinatPasar\(d\)/)
    expect(wadah).toMatch(/watch\(\(\) => props\.hari, /)
    expect(isi).not.toMatch(/useCashflowAdmin|laporanPasar|rpc</)
  })

  it('halaman memasang bagian dengan rentang yang sama, galatnya tidak menutup bagian lain', () => {
    expect(halaman).toMatch(/<CashflowLaporanPasar v-else-if="q\.bagian === 'pasar'" :hari="hari" \/>/)
    expect(halaman).toMatch(/if \(v\.bagian === 'kebiasaan' \|\| v\.bagian === 'pasar'\) \{/)
    expect(halaman).toMatch(/case 'pasar': return true/)
  })

  it('warna hanya dari token tema', () => {
    for (const [nama, kode] of [['wadah', wadah], ['isi', isi]] as const) {
      expect(kode, nama).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|(?:bg|text|border)-(?:emerald|green|red|slate|gray|blue|amber|white|black)\b/)
      expect(kode, nama).toMatch(/var\(--ca-/)
    }
  })
})

describe('nama sumber = katalog CashFlow', () => {
  const BERKAS_PROMO = join(DIR_MIGRASI, '20261123000500_promo_hemat_resmi.sql')
  const BERKAS_SITUS = process.env.CASHFLOW_HALAMAN_RESMI ?? resolve(DIR_MIGRASI, '../../src/lib/halamanResmi.ts')

  it.skipIf(!existsSync(BERKAS_PROMO))('tujuh belas id promo_hemat dan namanya sama dengan migrasi', () => {
    const sql = readFileSync(BERKAS_PROMO, 'utf8')
    const katalog = [...sql.matchAll(/'id', '([a-z0-9_]+)', 'nama', '([^']+)', 'jenis', '([a-z]+)'/g)].map(m => [m[1]!, m[2]!, m[3]!] as const)
    expect(katalog).toHaveLength(17)
    for (const [id, nama, jenis] of katalog) {
      expect(NAMA_SUMBER_PASAR[id], id).toBe(nama)
      expect(JENIS_SUMBER_PASAR as readonly string[], id).toContain(jenis)
    }
    expect(Object.keys(NAMA_SUMBER_PASAR).filter(id => !katalog.some(k => k[0] === id))).toEqual(['idx'])
  })

  it.skipIf(!existsSync(BERKAS_SITUS))('domain dan nama situs sama dengan SUMBER_DIKENAL aplikasi', () => {
    const ts = readFileSync(BERKAS_SITUS, 'utf8')
    const blok = /export const SUMBER_DIKENAL[^=]*=\s*\[([\s\S]*?)\];/.exec(ts)?.[1] ?? ''
    const situs = Object.fromEntries([...blok.matchAll(/domain: '([^']+)', nama: '([^']+)'/g)].map(m => [m[1]!, m[2]!]))
    expect(Object.keys(situs).length).toBeGreaterThan(10)
    expect(NAMA_SITUS_PASAR).toEqual(situs)
  })
})

describe('data sintetis uji tampilan = DTO contoh', () => {
  const server = buatServer()

  it('bentuk sama dengan contoh, terbaca adapter, setiap tanggal rentang dikirim', () => {
    const d = server.jawab('admin_laporan_pasar', { p_hari: 30 }, { izin: true }).json as MinatPasarDTO
    expect(urutPohon(pohonContoh(d))).toEqual(urutPohon(pohonContoh(PASAR)))
    const m = keMinatPasar(d)
    expect(m.harian).toHaveLength(30)
    expect(m.kosong).toBe(false)
    expect(m.sumber.length).toBeGreaterThan(5)
    expect(m.sumber.every(s => s.nama !== null)).toBe(true)
  })

  it('mode kosong: kosong true, mode lain: baris lain dan id baru, server lama: PGRST202', () => {
    expect(keMinatPasar(server.jawab('admin_laporan_pasar', { p_hari: 7 }, { izin: true, kosong: true }).json as MinatPasarDTO).kosong).toBe(true)
    const lain = keMinatPasar(server.jawab('admin_laporan_pasar', { p_hari: 30 }, { izin: true, pasarLain: true }).json as MinatPasarDTO)
    expect(lain.sumber.map(s => s.sumber)).toEqual(expect.arrayContaining(['lain', 'dompet_baru']))
    expect(server.jawab('admin_laporan_pasar', { p_hari: 30 }, { izin: true, belumAda: ['admin_laporan_pasar'] }).json).toMatchObject({ code: 'PGRST202' })
  })
})
