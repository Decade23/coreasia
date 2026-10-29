/**
 * Adapter versi aplikasi (0110, adapters/cashflowVersi.ts).
 *
 * Aturan bentuk nilai versi_android* WAJIB sama dengan aplikasi
 * (cashflow src/lib/pembaruan.ts). Dua lapis:
 * - vektor uji aplikasi (uji/pembaruan.mjs PB-1 dan PB-3) disalin ke sini
 *   dan dijalankan terhadap adapter;
 * - bila repo CashFlow ada (CASHFLOW_MIGRASI), modul aplikasinya diimpor dan
 *   kedua pembaca dibandingkan atas sekumpulan nilai acak, plus KODE_MAKS,
 *   CATATAN_MAKS, nama kunci, dan kosakata telemetri (telemetri.ts).
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { transform } from 'esbuild'
import { describe, expect, it } from 'vitest'
import { DIR_MIGRASI, DIR_TOKO } from './migrasi'
import {
  KODE_MAKS, CATATAN_MAKS, KUNCI_VERSI, KUNCI_VERSI_UAT, KUNCI_VERSI_IAS, RILIS_PLAY_TERAKHIR, RILIS_PLAY, VERSI_KOSONG,
  CATATAN_KUNCI_VERSI, LANGKAH_PEMBARUAN, JALUR_PERBARUI, LANGKAH_USAHA, ISI_USAHA, JENIS_ISI,
  kodeSah, bacaVersiAndroid, bacaNilaiVersi, isianDariNilai, periksaIsianVersi, nilaiVersiUntukSimpan,
  samaDenganTersimpan, peringatanLembut, rilisAcuan, minimumBerubah, keSebaranVersi, jumlahDiBawah, tertinggiUntuk, namaKode,
  keAjakanPembaruan, keLangkahUsaha, buildDari,
  type VersiAplikasiDTO, type AjakanPembaruanDTO, type LangkahUsahaDTO, type IsianVersi,
} from '../../adapters/cashflowVersi'

const SRC_APP = resolve(DIR_MIGRASI, '../../src/lib')
const PEMBARUAN = resolve(SRC_APP, 'pembaruan.ts')
const TELEMETRI = resolve(SRC_APP, 'telemetri.ts')
const adaApp = existsSync(PEMBARUAN) && existsSync(TELEMETRI)
/* pembaruan.ts murni (tanpa impor), tapi tsconfig repo CashFlow memperluas
   expo/tsconfig.base yang tidak ada selama node_modules belum dipasang. Jadi
   berkasnya dialihbahasakan esbuild ke .mjs sementara, lalu diimpor. */
type ModulApp = { KODE_MAKS: number; CATATAN_MAKS: number; KUNCI_VERSI: string; KUNCI_VERSI_UAT: string; KUNCI_VERSI_IAS: string; bacaVersiAndroid: (v: unknown) => unknown }
let modulApp: Promise<ModulApp> | null = null
const muatApp = (): Promise<ModulApp> => (modulApp ??= (async () => {
  const { code } = await transform(readFileSync(PEMBARUAN, 'utf8'), { loader: 'ts', format: 'esm' })
  const berkas = join(mkdtempSync(join(tmpdir(), 'cf-pembaruan-')), 'pembaruan.mjs')
  writeFileSync(berkas, code)
  return (await import(/* @vite-ignore */ pathToFileURL(berkas).href)) as ModulApp
})())

describe('PB-1 kodeSah (vektor aplikasi)', () => {
  it('angka bulat 1..2.100.000.000 saja', () => {
    for (const n of [1, 26101102, 2_100_000_000]) expect(kodeSah(n)).toBe(n)
    for (const n of [0, -1, 1.5, Number.NaN, Infinity, -Infinity, '26101102', true, null, undefined, 2_100_000_001, { n: 1 }, [5]]) {
      expect(kodeSah(n), String(n)).toBeNull()
    }
    expect(KODE_MAKS).toBe(2_100_000_000)
  })
})

describe('PB-3 bacaVersiAndroid (vektor aplikasi)', () => {
  const F = bacaVersiAndroid
  const K = VERSI_KOSONG
  it('bentuk nilai bagian 3.2', () => {
    expect(K).toEqual({ terbaru: null, minimum: null, catatan: null, catatanEn: null })
    expect(F({ terbaru: 26101301, minimum: 26101102, catatan: '  Perbaikan saldo.  ', catatan_en: 'Fixes.' }))
      .toEqual({ terbaru: 26101301, minimum: 26101102, catatan: 'Perbaikan saldo.', catatanEn: 'Fixes.' })
    expect(F({ terbaru: 26101301 })).toEqual({ terbaru: 26101301, minimum: null, catatan: null, catatanEn: null })
    expect(F({ terbaru: 7, minimum: 7 }).minimum).toBe(7)
    expect(F({ terbaru: 26101301, minimum: 26101302 })).toEqual({ terbaru: 26101301, minimum: null, catatan: null, catatanEn: null })
    expect(F({ minimum: 26101102 })).toEqual(K)
    expect(F({ minimum: 26101102, catatan: 'x' })).toEqual(K)
    expect(F({ terbaru: '26101301', minimum: 26101102, catatan: 'x' })).toEqual(K)
    expect(F({ terbaru: 26101301.5 })).toEqual(K)
    expect(F({ terbaru: 26101301, minimum: '26101102' }).minimum).toBeNull()
    expect(F({ terbaru: 26101301, minimum: 0 }).minimum).toBeNull()
    for (const v of [[{ terbaru: 5 }], true, 'x', 26101301, null, undefined]) expect(F(v)).toEqual(K)
    expect(F({ terbaru: 5, catatan: '' }).catatan).toBeNull()
    expect(F({ terbaru: 5, catatan: '   \n ' }).catatan).toBeNull()
    expect(F({ terbaru: 5, catatan: 'a'.repeat(120) }).catatan).toBe('a'.repeat(120))
    expect(F({ terbaru: 5, catatan: 'a'.repeat(121) }).catatan).toBeNull()
    expect(F({ terbaru: 5, catatan: ` ${'b'.repeat(120)} ` }).catatan).toBe('b'.repeat(120))
    expect(F({ terbaru: 5, catatan: 42, catatan_en: { a: 1 } })).toEqual({ terbaru: 5, minimum: null, catatan: null, catatanEn: null })
    expect(F({ terbaru: 5, catatan_en: 'e'.repeat(121) }).catatanEn).toBeNull()
    expect(F({ terbaru: 5, wajib: true, versi: '9.9' })).toEqual({ terbaru: 5, minimum: null, catatan: null, catatanEn: null })
    expect(CATATAN_MAKS).toBe(120)
  })
})

describe.skipIf(!adaApp)(`paritas dengan aplikasi (${PEMBARUAN})`, () => {
  it('konstanta dan nama kunci sama', async () => {
    const app = await muatApp()
    expect([app.KODE_MAKS, app.CATATAN_MAKS]).toEqual([KODE_MAKS, CATATAN_MAKS])
    expect([app.KUNCI_VERSI, app.KUNCI_VERSI_UAT, app.KUNCI_VERSI_IAS]).toEqual([KUNCI_VERSI, KUNCI_VERSI_UAT, KUNCI_VERSI_IAS])
  })
  it('bacaVersiAndroid console = aplikasi atas nilai acak', async () => {
    const app = await muatApp()
    let benih = 20261014
    const acak = () => { benih = (benih * 1103515245 + 12345) % 2147483648; return benih / 2147483648 }
    const pilih = <T,>(xs: readonly T[]): T => xs[Math.floor(acak() * xs.length)]!
    const angka = () => pilih<unknown>([1, 0, -3, 7.5, 26101412, 26101003, KODE_MAKS, KODE_MAKS + 1, '26101412', null, undefined, true])
    const catatan = () => pilih<unknown>([undefined, '', '  ', 'Perbaikan.', 'x'.repeat(120), ` ${'y'.repeat(120)} `, 'z'.repeat(121), 5])
    for (let i = 0; i < 2000; i++) {
      const v = pilih<unknown>([
        null, 'x', [], 26101412,
        { terbaru: angka(), minimum: angka(), catatan: catatan(), catatan_en: catatan() },
        { terbaru: angka() }, { minimum: angka() }, { terbaru: angka(), lain: 1 },
      ])
      expect(bacaVersiAndroid(v), JSON.stringify(v)).toEqual(app.bacaVersiAndroid(v))
    }
  })
  it('kosakata telemetri sama dengan telemetri.ts dan pembaruan.ts', () => {
    const tel = readFileSync(TELEMETRI, 'utf8')
    const pem = readFileSync(PEMBARUAN, 'utf8')
    const tipe = (teks: string, nama: string) =>
      [...(new RegExp(`type ${nama} =([^;]+);`).exec(teks)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(m => m[1]!)
    expect([...LANGKAH_PEMBARUAN].sort()).toEqual(tipe(tel, 'LangkahPembaruan').sort())
    expect([...JALUR_PERBARUI].sort()).toEqual(tipe(pem, 'JalurToko').sort())
    expect([...LANGKAH_USAHA].sort()).toEqual(tipe(tel, 'LangkahOnboarding').filter(l => !l.startsWith('pembaruan.')).sort())
    expect([...new Set([...tipe(tel, 'AsalPanelRuang'), ...tipe(tel, 'AsalTonggakUsaha')])].sort()).toEqual([...ISI_USAHA.asal].sort())
    expect([...ISI_USAHA.keadaan].sort()).toEqual(tipe(tel, 'KeadaanMeja').sort())
    expect([...ISI_USAHA.tahap].sort()).toEqual(tipe(tel, 'TahapMeja').sort())
    expect([...ISI_USAHA.ke].sort()).toEqual(tipe(tel, 'PintasanMeja').sort())
  })
})

describe.skipIf(!existsSync(resolve(DIR_TOKO, `catatan-rilis-${RILIS_PLAY_TERAKHIR.versi}.md`)))('RILIS_PLAY_TERAKHIR', () => {
  it('versionCode-nya ada di catatan rilis versi itu', () => {
    const catatan = readFileSync(resolve(DIR_TOKO, `catatan-rilis-${RILIS_PLAY_TERAKHIR.versi}.md`), 'utf8')
    expect(catatan).toContain(String(RILIS_PLAY_TERAKHIR.kode))
    expect(RILIS_PLAY[RILIS_PLAY_TERAKHIR.kode]).toBe(RILIS_PLAY_TERAKHIR.versi)
  })
})

describe('periksaIsianVersi (KK-2, KK-3)', () => {
  const isi = (o: Partial<IsianVersi>): IsianVersi => ({ terbaru: '', minimum: '', catatan: '', catatanEn: '', ...o })
  it('hanya digit, 1..2.100.000.000', () => {
    expect(periksaIsianVersi(isi({ terbaru: '26101412' })).nilai).toEqual({ terbaru: 26101412, minimum: null, catatan: null, catatanEn: null })
    expect(periksaIsianVersi(isi({ terbaru: '2100000000' })).galat).toEqual({})
    for (const t of ['26.101.412', '26,101,412', ' 26101412', '26101412 ', '0', '2100000001', '12345678901', '-5', '1e5', 'abc']) {
      const p = periksaIsianVersi(isi({ terbaru: t }))
      expect(p.galat.terbaru, t).toBe('angka')
      expect(p.nilai, t).toBeNull()
    }
  })
  it('terbaru kosong: tanpa galat, tapi tidak bisa disimpan', () => {
    const p = periksaIsianVersi(isi({}))
    expect(p.galat).toEqual({})
    expect(p.nilai).toBeNull()
  })
  it('minimum opsional, tidak boleh lebih besar dari terbaru', () => {
    expect(periksaIsianVersi(isi({ terbaru: '26101412', minimum: '26101003' })).nilai?.minimum).toBe(26101003)
    expect(periksaIsianVersi(isi({ terbaru: '26101412', minimum: '26101412' })).galat).toEqual({})
    expect(periksaIsianVersi(isi({ terbaru: '26101412', minimum: '26101413' })).galat).toEqual({ minimum: 'minimum' })
    expect(periksaIsianVersi(isi({ terbaru: '26101412', minimum: '26.1' })).galat).toEqual({ minimum: 'angka' })
  })
  it('catatan: di-trim, paling panjang 120 aksara (titik kode), tanpa @', () => {
    expect(periksaIsianVersi(isi({ terbaru: '5', catatan: `  ${'a'.repeat(120)}  ` })).nilai?.catatan).toBe('a'.repeat(120))
    expect(periksaIsianVersi(isi({ terbaru: '5', catatan: 'a'.repeat(121) })).galat).toEqual({ catatan: 'catatanPanjang' })
    expect(periksaIsianVersi(isi({ terbaru: '5', catatan: '🙂'.repeat(120) })).galat).toEqual({})
    expect(periksaIsianVersi(isi({ terbaru: '5', catatanEn: 'tanya kami@example.com' })).galat).toEqual({ catatanEn: 'catatanEmail' })
    expect(periksaIsianVersi(isi({ terbaru: '5', catatan: '   ' })).nilai?.catatan).toBeNull()
  })
})

describe('nilaiVersiUntukSimpan (KK-4)', () => {
  it('angka JSON, bidang kosong tidak dikirim', () => {
    expect(JSON.stringify(nilaiVersiUntukSimpan({ terbaru: 26101412, minimum: null, catatan: null, catatanEn: null }))).toBe('{"terbaru":26101412}')
    expect(nilaiVersiUntukSimpan({ terbaru: 26101412, minimum: 26101003, catatan: 'Perbaikan.', catatanEn: 'Fixes.' }))
      .toEqual({ terbaru: 26101412, minimum: 26101003, catatan: 'Perbaikan.', catatan_en: 'Fixes.' })
  })
  it('pulang-pergi: yang disimpan console dibaca aplikasi sama persis', () => {
    for (const t of ['1', '26101412', '2100000000']) {
      for (const m of ['', '1', t]) {
        for (const c of ['', 'Catatan.', 'c'.repeat(120)]) {
          const p = periksaIsianVersi({ terbaru: t, minimum: m, catatan: c, catatanEn: c })
          const v = bacaVersiAndroid(nilaiVersiUntukSimpan(p.nilai!))
          expect(v).toEqual({ terbaru: Number(t), minimum: m ? Number(m) : null, catatan: c || null, catatanEn: c || null })
        }
      }
    }
  })
})

describe('bacaNilaiVersi (KK-1, KK-9)', () => {
  it('tiada, asing, sah', () => {
    expect(bacaNilaiVersi(false, undefined)).toEqual({ jenis: 'tiada' })
    for (const v of [{ terbaru: '26101412' }, [1], 26101412, 'x', { minimum: 5 }, { terbaru: 0 }, { terbaru: 1.5 }, null]) {
      expect(bacaNilaiVersi(true, v as never), JSON.stringify(v)).toEqual({ jenis: 'asing' })
    }
    expect(bacaNilaiVersi(true, { terbaru: 26101412 })).toEqual({ jenis: 'sah', versi: { terbaru: 26101412, minimum: null, catatan: null, catatanEn: null }, diabaikan: [] })
  })
  it('sah dengan bagian yang diabaikan aplikasi', () => {
    const b = (v: unknown) => { const r = bacaNilaiVersi(true, v as never); return r.jenis === 'sah' ? r.diabaikan : r.jenis }
    expect(b({ terbaru: 26101412, minimum: 26101413 })).toEqual(['minimum'])
    expect(b({ terbaru: 26101412, minimum: '26101003' })).toEqual(['minimum'])
    expect(b({ terbaru: 26101412, catatan: 'x'.repeat(121), catatan_en: 5 })).toEqual(['catatan', 'catatan_en'])
    expect(b({ terbaru: 26101412, wajib: true })).toEqual(['bidang'])
    expect(b({ terbaru: 26101412, minimum: 26101003, catatan: 'Perbaikan.', catatan_en: 'Fixes.' })).toEqual([])
  })
  it('isianDariNilai mengisi sebisanya, termasuk angka berbentuk teks', () => {
    expect(isianDariNilai({ terbaru: 26101412, minimum: 26101003, catatan: ' Perbaikan. ' }))
      .toEqual({ terbaru: '26101412', minimum: '26101003', catatan: 'Perbaikan.', catatanEn: '' })
    expect(isianDariNilai({ terbaru: '26101412' })).toEqual({ terbaru: '26101412', minimum: '', catatan: '', catatanEn: '' })
    expect(isianDariNilai(['x'])).toEqual({ terbaru: '', minimum: '', catatan: '', catatanEn: '' })
    expect(isianDariNilai(undefined)).toEqual({ terbaru: '', minimum: '', catatan: '', catatanEn: '' })
  })
  it('samaDenganTersimpan membandingkan isi, bukan urutan', () => {
    expect(samaDenganTersimpan({ terbaru: 5, minimum: 3 }, { minimum: 3, terbaru: 5 })).toBe(true)
    expect(samaDenganTersimpan({ terbaru: 5 }, { terbaru: 5, minimum: 3 })).toBe(false)
    expect(samaDenganTersimpan({ terbaru: 5 }, { terbaru: '5' })).toBe(false)
    expect(samaDenganTersimpan({ terbaru: 5 }, undefined)).toBe(false)
  })
})

describe('peringatan (KK-5, KK-7)', () => {
  const v = (terbaru: number, minimum: number | null = null) => ({ terbaru, minimum, catatan: null, catatanEn: null })
  const R = RILIS_PLAY_TERAKHIR.kode
  /* Angka "di atas rilis" dihitung dari R, jadi uji ini tetap bermakna
     sesudah RILIS_PLAY_TERAKHIR dinaikkan di setiap rilis Play. */
  const ATAS = R + 88
  it('lembut: turun, di atas rilis, belum terlihat', () => {
    expect(peringatanLembut(v(26101003), v(26101412), null, R)).toEqual([{ jenis: 'turun', lama: 26101412 }])
    expect(peringatanLembut(v(ATAS), VERSI_KOSONG, null, R)).toEqual([{ jenis: 'diAtasRilis' }])
    expect(peringatanLembut(v(R + 1), VERSI_KOSONG, null, R)).toEqual([{ jenis: 'diAtasRilis' }])
    expect(peringatanLembut(v(26101412, 26101412), VERSI_KOSONG, 26101003, R)).toEqual([{ jenis: 'belumTerlihat' }])
    expect(peringatanLembut(v(26101412, 26101003), v(26101412), 26101003, R)).toEqual([])
    expect(peringatanLembut(v(R), VERSI_KOSONG, null, R)).toEqual([])
  })
  it('di atas rilis Play hanya untuk kunci Play, bukan UAT atau IAS', () => {
    expect(([KUNCI_VERSI, KUNCI_VERSI_UAT, KUNCI_VERSI_IAS] as const).map(k => rilisAcuan(k))).toEqual([R, null, null])
    expect(peringatanLembut(v(ATAS, R + 38), VERSI_KOSONG, ATAS, rilisAcuan(KUNCI_VERSI_UAT))).toEqual([])
    expect(peringatanLembut(v(ATAS), VERSI_KOSONG, null, rilisAcuan(KUNCI_VERSI_IAS))).toEqual([])
    expect(peringatanLembut(v(ATAS), VERSI_KOSONG, null, rilisAcuan(KUNCI_VERSI))).toEqual([{ jenis: 'diAtasRilis' }])
  })
  it('panel minimum hanya untuk minimum baru atau berubah', () => {
    expect(minimumBerubah(26101003, VERSI_KOSONG)).toBe(true)
    expect(minimumBerubah(26101003, v(26101412, 26101003))).toBe(false)
    expect(minimumBerubah(26101100, v(26101412, 26101003))).toBe(true)
    expect(minimumBerubah(null, v(26101412, 26101003))).toBe(false)
  })
  it('catatan kunci tanpa @ (kunci publik)', () => {
    for (const c of Object.values(CATATAN_KUNCI_VERSI)) expect(c).not.toContain('@')
  })
})

/* Angka karangan, bukan data produksi. */
const VERSI_DTO: VersiAplikasiDTO = {
  hari: 30, aktif: 120, aktif_luar: 108, diketahui: 52, diketahui_luar: 45,
  baris: [
    { platform: 'android', varian: 'uat', kode: 26101411, versi: '1.3.2', pengguna: 2, pengguna_luar: 0, terakhir: '2026-10-14T03:59:00+00:00' },
    { platform: 'android', varian: 'prod', kode: 26092703, versi: '1.2.0', pengguna: 20, pengguna_luar: 18, terakhir: '2026-10-13T03:59:00+00:00' },
    { platform: 'android', varian: 'prod', kode: 26101003, versi: '1.3.1', pengguna: 25, pengguna_luar: 22, terakhir: '2026-10-14T03:59:00+00:00' },
    { platform: 'android', varian: 'prod', kode: null, versi: null, pengguna: 3, pengguna_luar: 3, terakhir: '2026-10-10T03:59:00+00:00' },
    { platform: 'android', varian: 'prod', kode: 26100902, versi: null, pengguna: 5, pengguna_luar: 5, terakhir: '2026-10-09T03:59:00+00:00' },
  ],
  tertinggi: [
    { platform: 'android', varian: 'prod', kode: 26101003, versi: '1.3.1' },
    { platform: 'android', varian: 'uat', kode: 26101411, versi: '1.3.2' },
  ],
  konfig: { versi_android: { terbaru: 26101412 }, versi_android_uat: null, versi_android_ias: null },
}

describe('keSebaranVersi (KK-11)', () => {
  const s = keSebaranVersi(VERSI_DTO)
  it('baris berkode, urut build lalu kode terbesar; nama dari rilis bila server tanpa nama', () => {
    expect(s.baris.map(b => `${b.build}/${b.kode}/${b.versi}`)).toEqual(['prod/26101003/1.3.1', 'prod/26100902/1.3.0', 'prod/26092703/1.2.0', 'uat/26101411/1.3.2'])
  })
  it('tidak diketahui = aktif dikurangi diketahui (orang), baris tanpa kode tidak tampil sendiri', () => {
    expect(s.takTahu).toEqual({ pengguna: 68, penggunaLuar: 63 })
    expect(s.persen).toBe(43)
  })
  it('di bawah versi terbaru Play hanya bila versi_android tersetel', () => {
    expect(s.terbaruPlay).toBe(26101412)
    expect(s.diBawahTerbaru).toBe(50)
    expect(keSebaranVersi({ ...VERSI_DTO, konfig: { ...VERSI_DTO.konfig, versi_android: { terbaru: '26101412' } } }).diBawahTerbaru).toBeNull()
  })
  it('jumlah tertahan, tertinggi, nama kode', () => {
    expect(jumlahDiBawah(s.baris, 'prod', 26101003)).toBe(25)
    expect(jumlahDiBawah(s.baris, 'uat', 26101412)).toBe(2)
    expect(tertinggiUntuk(s, 'prod')).toEqual({ kode: 26101003, versi: '1.3.1' })
    expect(tertinggiUntuk(s, 'ias')).toBeNull()
    expect(namaKode(26101411, s)).toBe('1.3.2')
    expect(namaKode(26101412)).toBe('1.3.2')
    expect(namaKode(99)).toBeNull()
  })
  it('build per platform', () => {
    expect(['android/prod', 'android/uat', 'android/ias', 'android/x', 'ios/prod', 'web/prod', 'lain/prod'].map(x => buildDari(...(x.split('/') as [string, string]))))
      .toEqual(['prod', 'uat', 'ias', 'lain', 'ios', 'web', 'lain'])
  })
  it('angka bertipe teks (bigint PostgREST) tetap terbaca', () => {
    const t = keSebaranVersi({ ...VERSI_DTO, aktif: '3', diketahui: '0', aktif_luar: '3', diketahui_luar: '0' })
    expect([t.aktif, t.persen, t.takTahu.pengguna]).toEqual([3, 0, 3])
  })
})

describe('keAjakanPembaruan (KK-12)', () => {
  const d: AjakanPembaruanDTO = {
    hari: 30,
    baris: [
      { langkah: 'pembaruan.ajakan_ketuk', ke: 26101450, jalur: 'pasar', tertahan: null, kejadian: 1, orang: 1, orang_luar: 1 },
      { langkah: 'pembaruan.ajakan_ketuk', ke: 26101450, jalur: 'gagal', tertahan: null, kejadian: 2, orang: 1, orang_luar: 1 },
      { langkah: 'pembaruan.wajib_ketuk', ke: 26101450, jalur: 'dalam', tertahan: false, kejadian: 1, orang: 1, orang_luar: 1 },
      { langkah: 'pembaruan.wajib_ketuk', ke: 26101450, jalur: 'lain', tertahan: false, kejadian: 4, orang: 1, orang_luar: 1 },
    ],
    ringkas: [
      { langkah: 'pembaruan.ajakan_lihat', ke: 26101450, kejadian: 3, orang: 1, orang_luar: 1 },
      { langkah: 'pembaruan.ajakan_ketuk', ke: 26101450, kejadian: 3, orang: 1, orang_luar: 1 },
      { langkah: 'pembaruan.wajib_lihat', ke: 26101450, kejadian: 11, orang: 1, orang_luar: 1 },
      { langkah: 'pembaruan.ajakan_lihat', ke: 26101412, kejadian: 2, orang: 2, orang_luar: 2 },
      { langkah: 'pembaruan.asing', ke: 26101412, kejadian: 9, orang: 9, orang_luar: 9 },
    ],
    sampai: [{ ke: 26101450, orang: 0, orang_luar: 0 }, { ke: 26101412, orang: 1, orang_luar: 1 }],
  }
  const a = keAjakanPembaruan(d)
  it('per versi tujuan terbesar dulu, orang dari ringkas (sekali lintas jalur)', () => {
    expect(a.baris.map(b => b.ke)).toEqual([26101450, 26101412])
    expect(a.baris[0]!.sel['pembaruan.ajakan_ketuk']).toEqual({ orang: 1, kejadian: 3 })
    expect(a.baris[0]!.sel['pembaruan.ajakan_tutup']).toEqual({ orang: 0, kejadian: 0 })
    expect(a.baris[1]!.nama).toBe('1.3.2')
    expect([a.baris[0]!.sampai, a.baris[1]!.sampai]).toEqual([0, 1])
  })
  it('jalur Perbarui = kejadian ketuk ajakan + layar wajib; jalur asing tidak masuk kalimat', () => {
    expect(a.jalur).toEqual({ dalam: 1, pasar: 1, web: 0, gagal: 2 })
  })
  it('kosong', () => {
    expect(keAjakanPembaruan({ hari: 7, baris: [], ringkas: [], sampai: [] })).toEqual({ hari: 7, baris: [], jalur: { dalam: 0, pasar: 0, web: 0, gagal: 0 } })
  })
})

describe('keLangkahUsaha (KK-13)', () => {
  const d: LangkahUsahaDTO = {
    hari: 30,
    baris: [
      { langkah: 'usaha.pintasan', isi: 'jual', kejadian: 12, orang: 6, orang_luar: 5 },
      { langkah: 'ruang.panel_baru', isi: 'baris_baru', kejadian: 15, orang: 9, orang_luar: 8 },
      { langkah: 'ruang.pilih_usaha', isi: '', kejadian: 8, orang: 7, orang_luar: 7 },
      { langkah: 'ajakan_usaha.lihat', isi: '', kejadian: 40, orang: 25, orang_luar: 22 },
      { langkah: 'usaha.produk_pertama', isi: 'ajakan_beranda', kejadian: 6, orang: 4, orang_luar: 4 },
      { langkah: 'usaha.beranda_lihat', isi: 'langkah', kejadian: 90, orang: 11, orang_luar: 10 },
      { langkah: 'usaha.kasir_buka', isi: '', kejadian: 1, orang: 1, orang_luar: 1 },
      { langkah: 'usaha.langkah_ketuk', isi: 'lain', kejadian: 1, orang: 1, orang_luar: 1 },
    ],
    ruang_usaha_baru: [{ minggu: '2026-10-12', jumlah: 9, jumlah_luar: 8 }, { minggu: '2026-10-05', jumlah: 5, jumlah_luar: 3 }],
  }
  const l = keLangkahUsaha(d)
  it('empat kelompok, urut langkah dikenal, kode baru di akhir kelompoknya', () => {
    expect(l.kelompok.map(g => g.kelompok)).toEqual(['ruang', 'kartu', 'tonggak', 'meja'])
    expect(l.kelompok.find(g => g.kelompok === 'meja')!.baris.map(b => b.langkah))
      .toEqual(['usaha.beranda_lihat', 'usaha.langkah_ketuk', 'usaha.pintasan', 'usaha.kasir_buka'])
  })
  it('kode atau isi yang belum dikenal ditandai', () => {
    const baru = l.kelompok.flatMap(g => g.baris).filter(b => !b.kunciLangkah || !b.kenalIsi).map(b => `${b.langkah}/${b.isi}`)
    expect(baru).toEqual(['usaha.langkah_ketuk/lain', 'usaha.kasir_buka/'])
  })
  it('jenis isi per langkah dan mingguan urut', () => {
    expect(l.kelompok[0]!.baris[0]).toMatchObject({ kunciLangkah: 'ruang_panel_baru', jenisIsi: 'asal', kenalIsi: true })
    expect(l.mingguan.map(m => m.minggu)).toEqual(['2026-10-05', '2026-10-12'])
    expect(keLangkahUsaha({ hari: 7, baris: [], ruang_usaha_baru: [] }).kosong).toBe(true)
  })
  it('setiap langkah berisi punya jenis isi yang dikenal', () => {
    for (const [langkah, jenis] of Object.entries(JENIS_ISI)) {
      expect(LANGKAH_USAHA, langkah).toContain(langkah)
      expect(ISI_USAHA[jenis].length, langkah).toBeGreaterThan(0)
    }
  })
})
