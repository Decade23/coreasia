import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import {
  KAMUS_JENIS_PERJALANAN, KAMUS_LANGKAH_PERJALANAN, KAMUS_LAYAR_PERJALANAN,
  KAMUS_TONGGAK_PERJALANAN, KATEGORI_PERJALANAN, namaKategoriPerjalanan, terjemahPeristiwa,
} from '../../adapters/cashflowKamusPeristiwa'
import { DIR_MIGRASI, adaMigrasiNomor, fungsiTerakhir } from './migrasi'

const BERKAS_TELEMETRI = process.env.CASHFLOW_TELEMETRI ?? resolve(DIR_MIGRASI, '../../src/lib/telemetri.ts')
const SUMBER_WAJIB = !!(process.env.CASHFLOW_MIGRASI || process.env.CASHFLOW_TELEMETRI)
const ADA_SUMBER = existsSync(BERKAS_TELEMETRI)
const BAHASA = ['id', 'en'] as const

function bacaPeristiwa(sumber: string) {
  const pohon = ts.createSourceFile('telemetri.ts', sumber, ts.ScriptTarget.Latest, true)
  const jenis = new Set<string>()
  const langkah = new Set<string>()
  function kumpulkanLiteral(simpul: ts.Node, hasil: Set<string>) {
    if (ts.isStringLiteral(simpul)) hasil.add(simpul.text)
    ts.forEachChild(simpul, anak => kumpulkanLiteral(anak, hasil))
  }
  function kunjungi(simpul: ts.Node) {
    if (ts.isTypeAliasDeclaration(simpul)) {
      if (simpul.name.text === 'JenisPeristiwa') kumpulkanLiteral(simpul.type, jenis)
      if (simpul.name.text.startsWith('Langkah')) kumpulkanLiteral(simpul.type, langkah)
    }
    if (ts.isPropertyAssignment(simpul)
      && (ts.isIdentifier(simpul.name) || ts.isStringLiteral(simpul.name))
      && simpul.name.text === 'langkah'
      && ts.isStringLiteral(simpul.initializer)) {
      langkah.add(simpul.initializer.text)
    }
    ts.forEachChild(simpul, kunjungi)
  }
  kunjungi(pohon)
  return { jenis: [...jenis].sort(), langkah: [...langkah].sort() }
}

describe('kamus Perjalanan', () => {
  it.skipIf(!ADA_SUMBER && !SUMBER_WAJIB)('mencakup semua jenis dan langkah sumber telemetri CashFlow', () => {
    expect(ADA_SUMBER, 'Sumber telemetri CashFlow wajib ada bila jalurnya disetel.').toBe(true)
    const { jenis, langkah } = bacaPeristiwa(readFileSync(BERKAS_TELEMETRI, 'utf8'))
    expect(jenis.length).toBeGreaterThanOrEqual(5)
    expect(langkah.length).toBeGreaterThanOrEqual(40)
    expect(Object.keys(KAMUS_JENIS_PERJALANAN).sort()).toEqual(jenis)
    expect(Object.keys(KAMUS_LANGKAH_PERJALANAN).sort()).toEqual(langkah)
  })

  it.skipIf(!adaMigrasiNomor('20261113194000'))('menerjemahkan kategori, rincian, dan layar dalam daftar putih RPC', () => {
    const { badan } = fungsiTerakhir('perjalanan_klien_inti')
    const katalog = [...badan.matchAll(/\('([a-z._]+)', '([a-z_]+)', '(\{[^']*\})'\)/g)]
    const kamus: Record<string, (typeof KAMUS_LANGKAH_PERJALANAN)[keyof typeof KAMUS_LANGKAH_PERJALANAN]> = {
      ...KAMUS_JENIS_PERJALANAN, ...KAMUS_LANGKAH_PERJALANAN,
    }
    expect(katalog).toHaveLength(Object.keys(kamus).length - 1) // onboarding.langkah membawa nama langkah terpisah.
    for (const [, nama, kategori, rincian] of katalog) {
      const entri = kamus[nama!]!
      expect(entri.kategori, nama).toBe(kategori)
      const aturan = JSON.parse(rincian!) as Record<string, boolean | number | string | Array<string | number>>
      if (kategori === 'nomor_wa') aturan.asal = ['gerbang', 'setelan']
      expect(Object.keys(entri.bidang).sort(), nama).toEqual(Object.keys(aturan).sort())
      for (const [kunci, aturanNilai] of Object.entries(aturan)) {
        let contoh = Array.isArray(aturanNilai) ? aturanNilai : [aturanNilai]
        if (aturanNilai === true) contoh = [true, false]
        if (aturanNilai === 'versi') contoh = ['2.0.1-rc.2']
        if (aturanNilai === 'kode_build') contoh = [27123101]
        const jenis = Object.hasOwn(KAMUS_JENIS_PERJALANAN, nama!) ? nama! : 'onboarding.langkah'
        for (const nilai of contoh) {
          for (const bahasa of BAHASA) {
            const hasil = terjemahPeristiwa({
              jenis, langkah: jenis === nama ? null : nama!, layar: null, rincian_aman: { [kunci]: nilai },
            }, bahasa)
            expect(hasil.rincian[0]?.belumDikenal, `${nama}.${kunci}=${nilai} (${bahasa})`).toBe(false)
          }
        }
      }
    }
    const layarSql = fungsiTerakhir('perjalanan_layar_inti').badan
    const rute = /p_layar in \(([^)]+)\)/.exec(layarSql)?.[1] ?? ''
    const dinamis = /when p_layar like '[^']+' then '([^']+)'/.exec(layarSql)?.[1]
    const layar = [...rute.matchAll(/'([^']+)'/g)].map(m => m[1]!)
    if (dinamis) layar.push(dinamis)
    expect(Object.keys(KAMUS_LAYAR_PERJALANAN).sort()).toEqual(layar.sort())
  })

  it('pemindai menemukan peristiwa baru di union dan langkah literal', () => {
    const sumber = `
      type JenisPeristiwa = 'layar.buka' | 'uji.baru'
      type LangkahOnboarding = 'uji.union'
      catat('onboarding.langkah', null, { langkah: 'uji.literal' })
    `
    expect(bacaPeristiwa(sumber)).toEqual({
      jenis: ['layar.buka', 'uji.baru'], langkah: ['uji.literal', 'uji.union'],
    })
    expect(Object.keys(KAMUS_JENIS_PERJALANAN)).not.toContain('uji.baru')
    expect(Object.keys(KAMUS_LANGKAH_PERJALANAN)).not.toContain('uji.literal')
  })

  it('menerjemahkan kategori, arti, layar dan tiap nilai yang dikenal ke dua bahasa', () => {
    for (const entri of Object.values({
      ...KAMUS_JENIS_PERJALANAN, ...KAMUS_LANGKAH_PERJALANAN, ...KAMUS_TONGGAK_PERJALANAN,
    })) {
      expect(KATEGORI_PERJALANAN).toContain(entri.kategori)
      for (const bahasa of BAHASA) {
        expect(namaKategoriPerjalanan(entri.kategori, bahasa)).not.toBe('')
        expect(entri.judul[bahasa].trim()).not.toBe('')
        expect(entri.arti[bahasa].trim()).not.toBe('')
        for (const bidang of Object.values(entri.bidang)) {
          expect(bidang.label[bahasa].trim()).not.toBe('')
          for (const nilai of Object.values(bidang.nilai ?? {})) expect(nilai[bahasa].trim()).not.toBe('')
        }
      }
    }
    for (const layar of Object.values(KAMUS_LAYAR_PERJALANAN)) {
      for (const bahasa of BAHASA) expect(layar[bahasa].trim()).not.toBe('')
    }
  })

  it('menampilkan hasil spesifik dan cara WhatsApp yang tercatat resmi', () => {
    const kirim = { jenis: 'onboarding.langkah', langkah: 'nomor_wa.kirim', layar: '/nomor-wa' }
    const terkirim = terjemahPeristiwa({ ...kirim, rincian_aman: { asal: 'gerbang', hasil: 'terkirim' } }, 'id')
    const gagal = terjemahPeristiwa({ ...kirim, rincian_aman: { hasil: 'tanpa_wa' } }, 'en')
    const tersimpan = terjemahPeristiwa({
      jenis: 'nomor_wa.tersimpan', langkah: null, layar: null, rincian_aman: { cara: 'wa_masuk' },
    }, 'id')
    expect(terkirim.judul).toBe('Kode dikirim ke WhatsApp')
    expect(terkirim.layar).toBe('Nomor WhatsApp')
    expect(terkirim.rincian).toContainEqual({ kunci: 'asal', label: 'Asal', nilai: 'Layar wajib', belumDikenal: false })
    expect(gagal.judul).toBe('That number is not on WhatsApp')
    expect(tersimpan.judul).toBe('Nomor WhatsApp tersimpan lewat cara kirim pesan')
  })

  it('menandai enum asing dan merahasiakan nilai di luar bentuk yang boleh tampil', () => {
    const peristiwa = {
      jenis: 'onboarding.langkah', langkah: 'nomor_wa.kirim', layar: '/g/contoh-kode-undangan',
      rincian_aman: {
        asal: 'belum_dikenal', hasil: 'status_baru', nomor: 'angka yang tidak boleh tampil',
        kode: 'kode yang tidak boleh tampil', pesan: 'pesan yang tidak boleh tampil',
      },
    }
    const terjemah = terjemahPeristiwa(peristiwa, 'id')
    expect(terjemah.judul).toBe('Meminta kode WhatsApp')
    expect(terjemah.layar).toBe('Layar belum dikenal')
    expect(terjemah.rincian).toEqual([
      { kunci: 'asal', label: 'Asal', nilai: 'Belum dikenal', belumDikenal: true },
      { kunci: 'hasil', label: 'Hasil', nilai: 'status_baru', belumDikenal: true },
    ])
    for (const hasil of ['contoh@contoh.invalid', 'a000000', 'teks bebas', 'constructor', 'https://contoh.invalid']) {
      const rincian_aman = { hasil }
      if (hasil === 'constructor') {
        expect(terjemahPeristiwa({ ...peristiwa, rincian_aman }, 'en').rincian[0]?.belumDikenal).toBe(true)
      } else {
        expect(terjemahPeristiwa({ ...peristiwa, rincian_aman }, 'en').rincian[0]?.nilai).toBe('Unrecognized')
      }
    }
    expect(terjemahPeristiwa({ ...peristiwa, langkah: 'belum_dikenal' }, 'en').judul).toBe('Unrecognized event')
    const pembelian = terjemahPeristiwa({
      jenis: 'domi.pembelian', langkah: null, layar: null, rincian_aman: { paket: 'belum_dikenal' },
    }, 'id')
    expect(pembelian.rincian[0]).toMatchObject({ nilai: 'Belum dikenal', belumDikenal: true })
  })
})
