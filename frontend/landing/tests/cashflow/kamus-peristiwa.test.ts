import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import {
  KAMUS_JENIS_PERJALANAN, KAMUS_LANGKAH_PERJALANAN, KAMUS_LAYAR_PERJALANAN,
  KAMUS_TONGGAK_PERJALANAN, KATEGORI_PERJALANAN, namaKategoriPerjalanan, terjemahPeristiwa,
} from '../../adapters/cashflowKamusPeristiwa'
import { DIR_MIGRASI, adaMigrasiBernama, adaMigrasiNomor, fungsiTerakhir } from './migrasi'

const BERKAS_TELEMETRI = process.env.CASHFLOW_TELEMETRI ?? resolve(DIR_MIGRASI, '../../src/lib/telemetri.ts')
const SUMBER_WAJIB = !!(process.env.CASHFLOW_MIGRASI || process.env.CASHFLOW_TELEMETRI)
const ADA_SUMBER = existsSync(BERKAS_TELEMETRI)
const BAHASA = ['id', 'en'] as const
/**
 * Langkah yang dicatat SERVER, bukan aplikasi, jadi tidak pernah ada di
 * telemetri.ts: S1 domi.pasar ditulis fungsi ai-chat (spek analitik pasar
 * dan promo 23 Nov 2026).
 */
const LANGKAH_SERVER = ['domi.pasar']
/**
 * Langkah analitik Kilas Pasar dari aplikasi 1.6.0 (spek yang sama, E1 sampai
 * E10). Kamus console dibangun bersamaan dengan cabang aplikasi dan katalog
 * 148. Sumber telemetri yang belum memuat SATU pun dari langkah ini dianggap
 * belum tergabung. Separuh berarti kontraknya bergeser, dan itu galat.
 */
const LANGKAH_PASAR_KLIEN = [
  'pasar.kartu_lihat', 'pasar.detail_buka', 'pasar.tab', 'pasar.promo_ketuk', 'pasar.lihat_semua',
  'pasar.tautan_ketuk', 'pasar.tanya_domi', 'halaman.buka', 'halaman.tutup', 'halaman.browser',
]
const ADA_KATALOG_148 = adaMigrasiBernama('perjalanan_katalog_148')
/**
 * Langkah yang sudah dikirim aplikasi tetapi belum masuk daftar putih RPC
 * Perjalanan (katalog perjalanan_klien_inti, 20261113194000). RPC
 * memulangkannya sebagai belum_dikenal tanpa rincian. Kamus console sudah
 * siap menerjemahkannya. Hapus dari daftar ini begitu katalog SQL memuatnya.
 * Langkah Kilas Pasar menunggu katalog 148 (perjalanan_katalog_148): begitu
 * migrasinya ada di folder, semuanya wajib ada di katalog.
 */
const BELUM_DI_KATALOG_RPC: string[] = ADA_KATALOG_148 ? [] : [...LANGKAH_PASAR_KLIEN, ...LANGKAH_SERVER]

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
    const pasar = LANGKAH_PASAR_KLIEN.filter(l => langkah.includes(l))
    expect([0, LANGKAH_PASAR_KLIEN.length], `langkah Kilas Pasar di telemetri: ${pasar.join(', ')}`).toContain(pasar.length)
    const menunggu = pasar.length ? [] : LANGKAH_PASAR_KLIEN
    expect(Object.keys(KAMUS_LANGKAH_PERJALANAN).sort()).toEqual([...new Set([...langkah, ...menunggu, ...LANGKAH_SERVER])].sort())
  })

  it.skipIf(!adaMigrasiNomor('20261113194000'))('menerjemahkan kategori, rincian, dan layar dalam daftar putih RPC', () => {
    const { badan } = fungsiTerakhir('perjalanan_klien_inti')
    const katalog = [...badan.matchAll(/\('([a-z._]+)', '([a-z_]+)', '(\{[^']*\})'\)/g)]
    const kamus: Record<string, (typeof KAMUS_LANGKAH_PERJALANAN)[keyof typeof KAMUS_LANGKAH_PERJALANAN]> = {
      ...KAMUS_JENIS_PERJALANAN, ...KAMUS_LANGKAH_PERJALANAN,
    }
    for (const nama of BELUM_DI_KATALOG_RPC) {
      expect(Object.hasOwn(kamus, nama), nama).toBe(true)
      expect(katalog.map(m => m[1]), `${nama} sudah di katalog RPC: hapus dari BELUM_DI_KATALOG_RPC`).not.toContain(nama)
    }
    // onboarding.langkah membawa nama langkah terpisah.
    expect(katalog).toHaveLength(Object.keys(kamus).length - 1 - BELUM_DI_KATALOG_RPC.length)
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

  it('menerjemahkan ketukan Dukung CashFlow dan pengumuman dari aplikasi 1.4.4', () => {
    const dukung = terjemahPeristiwa({
      jenis: 'onboarding.langkah', langkah: 'dukung.ketuk', layar: '/settings', rincian_aman: { asal: 'pengumuman' },
    }, 'id')
    expect(dukung.judul).toBe('Mengetuk Dukung CashFlow')
    expect(dukung.rincian).toContainEqual({ kunci: 'asal', label: 'Asal', nilai: 'Tombol pengumuman', belumDikenal: false })
    for (const langkah of ['pengumuman.ketuk', 'pengumuman.tutup']) {
      const hasil = terjemahPeristiwa({ jenis: 'onboarding.langkah', langkah, layar: '/', rincian_aman: { gaya: 'kartu' } }, 'en')
      expect(hasil.rincian[0], langkah).toMatchObject({ kunci: 'gaya', nilai: 'Home card', belumDikenal: false })
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

  it('menerjemahkan langkah Kilas Pasar dan halaman resmi dengan setiap nilai kontrak ke dua bahasa', () => {
    const contoh: Record<string, Record<string, Array<string | boolean>>> = {
      'pasar.kartu_lihat': { isi: ['lengkap', 'pasar', 'promo'] },
      'pasar.detail_buka': { tab: ['pasar', 'promo'], dari: ['kepala', 'ubin', 'promo'] },
      'pasar.tab': { tab: ['pasar', 'promo'] },
      'pasar.promo_ketuk': { sumber: ['gopay', 'logammulia', 'lain'], jenis: ['dompet', 'belanja', 'emas'], dari: ['cocok', 'semua'] },
      'pasar.lihat_semua': {},
      'pasar.tautan_ketuk': { sumber: ['logammulia', 'pegadaian', 'idx', 'lain'] },
      'pasar.tanya_domi': { topik: ['kurs', 'emas', 'promo'] },
      'halaman.buka': { asal: ['kartu', 'domi', 'lain'], sumber: ['logammulia.com', 'bca.co.id', 'coreasia.id', 'lain'] },
      'halaman.tutup': {
        asal: ['kartu', 'domi', 'lain'], sumber: ['pegadaian.co.id', 'lain'],
        lama: ['kurang_10', 'sampai_60', 'sampai_180', 'lebih_180'], pindah: [true, false],
      },
      'halaman.browser': { asal: ['kartu', 'domi', 'lain'], sumber: ['idx.co.id', 'lain'] },
      'domi.pasar': { topik: ['kurs', 'emas', 'saham', 'promo', 'umum'] },
    }
    expect(Object.keys(contoh).sort()).toEqual([...LANGKAH_PASAR_KLIEN, ...LANGKAH_SERVER].sort())
    for (const [langkah, bidang] of Object.entries(contoh)) {
      const entri = KAMUS_LANGKAH_PERJALANAN[langkah as keyof typeof KAMUS_LANGKAH_PERJALANAN]
      expect(entri, langkah).toBeDefined()
      expect(Object.keys(entri.bidang).sort(), langkah).toEqual(Object.keys(bidang).sort())
      expect(entri.kategori, langkah).toBe(langkah === 'domi.pasar' ? 'domi' : 'aplikasi')
      for (const [kunci, nilai] of Object.entries(bidang)) {
        for (const v of nilai) {
          for (const bahasa of BAHASA) {
            const hasil = terjemahPeristiwa({ jenis: 'onboarding.langkah', langkah, layar: null, rincian_aman: { [kunci]: v } }, bahasa)
            expect(hasil.judul, langkah).not.toBe(bahasa === 'id' ? 'Peristiwa belum dikenal' : 'Unrecognized event')
            expect(hasil.rincian[0], `${langkah}.${kunci}=${v} (${bahasa})`).toMatchObject({ kunci, belumDikenal: false })
          }
        }
      }
    }
    const buka = terjemahPeristiwa({
      jenis: 'onboarding.langkah', langkah: 'halaman.buka', layar: '/halaman', rincian_aman: { asal: 'domi', sumber: 'logammulia.com' },
    }, 'id')
    expect(buka.judul).toBe('Membuka halaman resmi')
    expect(buka.rincian).toEqual([
      { kunci: 'asal', label: 'Asal', nilai: 'Jawaban Domi', belumDikenal: false },
      { kunci: 'sumber', label: 'Situs', nilai: 'Logam Mulia (Antam)', belumDikenal: false },
    ])
    const tutup = terjemahPeristiwa({
      jenis: 'onboarding.langkah', langkah: 'halaman.tutup', layar: '/halaman', rincian_aman: { lama: 'sampai_180', pindah: true },
    }, 'en')
    expect(tutup.rincian).toEqual([
      { kunci: 'lama', label: 'Time spent', nilai: '1 to 3 minutes', belumDikenal: false },
      { kunci: 'pindah', label: 'Moved to another site', nilai: 'Yes', belumDikenal: false },
    ])
  })

  it('topik domi.pasar berupa larik: semua anggota dikenal tampil berurutan, selain itu belum dikenal', () => {
    const domi = (topik: unknown, bahasa: 'id' | 'en' = 'id') => terjemahPeristiwa({
      jenis: 'onboarding.langkah', langkah: 'domi.pasar', layar: '/ai', rincian_aman: { topik },
    }, bahasa)
    expect(domi(['emas', 'kurs']).judul).toBe('Bertanya ke Domi soal pasar')
    expect(domi(['emas', 'kurs']).layar).toBe('Domi')
    expect(domi(['emas', 'kurs']).rincian).toEqual([{ kunci: 'topik', label: 'Topik', nilai: 'Emas, Kurs dan valas', belumDikenal: false }])
    expect(domi(['saham', 'umum'], 'en').rincian[0]).toMatchObject({ label: 'Topics', nilai: 'Stocks, General', belumDikenal: false })
    expect(domi('promo').rincian[0]).toMatchObject({ nilai: 'Promo', belumDikenal: false })
    for (const buruk of [[], ['emas', 'kripto'], ['emas', 7], 'belum_dikenal', [['emas']], { emas: true }]) {
      expect(domi(buruk).rincian[0], JSON.stringify(buruk)).toMatchObject({ kunci: 'topik', belumDikenal: true })
    }
    expect(domi(['emas', 'kripto']).rincian[0]?.nilai).toBe('Belum dikenal')
  })

  it('sumber promo: id katalog baru tampil apa adanya, domain dan teks lain tidak pernah tampil', () => {
    const promo = (sumber: unknown, bahasa: 'id' | 'en' = 'id') => terjemahPeristiwa({
      jenis: 'onboarding.langkah', langkah: 'pasar.promo_ketuk', layar: '/', rincian_aman: { sumber },
    }, bahasa).rincian[0]
    expect(promo('gopay')).toEqual({ kunci: 'sumber', label: 'Sumber', nilai: 'GoPay', belumDikenal: false })
    expect(promo('lain', 'en')).toMatchObject({ nilai: 'Other source', belumDikenal: false })
    expect(promo('dompet_baru')).toMatchObject({ nilai: 'dompet_baru', belumDikenal: false })
    expect(promo('belum_dikenal')).toMatchObject({ nilai: 'Belum dikenal', belumDikenal: true })
    for (const buruk of ['https://contoh.invalid/promo', 'GoPay Promo', 'a'.repeat(31), 'kode_123456', 12]) {
      expect(promo(buruk), String(buruk)).toMatchObject({ belumDikenal: true })
      expect(promo(buruk)?.nilai, String(buruk)).not.toContain('contoh')
    }
    const halaman = (sumber: unknown) => terjemahPeristiwa({
      jenis: 'onboarding.langkah', langkah: 'halaman.browser', layar: '/halaman', rincian_aman: { sumber },
    }, 'id').rincian[0]
    expect(halaman('jago.com')).toMatchObject({ nilai: 'Bank Jago', belumDikenal: false })
    expect(halaman('contoh.invalid')).toMatchObject({ nilai: 'Belum dikenal', belumDikenal: true })
    const tautan = terjemahPeristiwa({
      jenis: 'onboarding.langkah', langkah: 'pasar.tautan_ketuk', layar: '/', rincian_aman: { sumber: 'gopay' },
    }, 'id').rincian[0]
    expect(tautan).toMatchObject({ belumDikenal: true })
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
