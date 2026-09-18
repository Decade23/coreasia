/**
 * Form "Tambah email" di /sakelar: pesan galatnya harus dari kamus console,
 * bukan dari peramban.
 *
 * Validasi bawaan peramban (type="email", required, pattern, …) berjalan
 * SEBELUM event submit. Input yang ditolaknya tidak pernah sampai ke
 * periksaEmailPengecualian — admin melihat balon berbahasa peramban, dan bentuk
 * chip tersamar yang ditampilkan halaman ini sendiri ('ded*** · gmail.com')
 * tidak pernah mendapat pesan 'tersamar'.
 *
 * Uji ini membaca AST templat hasil kompilator Vue (bentuk yang dirender ke
 * peramban), lalu menjalankan rantai yang dijalankan tambahPengecualian:
 * penilai → kunci kamus → teks ID/EN. Lingkungan uji sengaja `node` tanpa DOM
 * (lihat vitest.config.ts), jadi submit sungguhan tidak disimulasikan di sini.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { periksaEmailPengecualian, type GalatEmailPengecualian } from '~/adapters/cashflow'
import { KAMUS_CASHFLOW } from '~/composables/cashflow/useCashflowI18n'

const BERKAS = fileURLToPath(new URL('../../pages/console/cashflow/sakelar.vue', import.meta.url))
const SRC = readFileSync(BERKAS, 'utf8')

type Simpul = { type: number; tag?: string; props?: Prop[]; children?: Simpul[] }
type Prop = { type: number; name: string; value?: { content: string }; arg?: { content: string }; exp?: { content: string } }
const ATRIBUT = 6
const DIREKTIF = 7

const semua = (n: Simpul, hasil: Simpul[] = []): Simpul[] => {
  hasil.push(n)
  for (const c of n.children ?? []) semua(c, hasil)
  return hasil
}
/** Nilai atribut statis, atau nama atribut terikat (`:type`) sebagai penanda. */
const atribut = (n: Simpul, nama: string): string | true | undefined => {
  for (const p of n.props ?? []) {
    if (p.type === ATRIBUT && p.name === nama) return p.value?.content ?? true
    if (p.type === DIREKTIF && p.name === 'bind' && p.arg?.content === nama) return true
  }
  return undefined
}

const { descriptor } = parse(SRC, { filename: BERKAS })
const pohon = semua(descriptor.template!.ast as unknown as Simpul)
const formTambah = pohon.filter(n => n.tag === 'form' && (n.props ?? []).some(p =>
  p.type === DIREKTIF && p.name === 'on' && p.arg?.content === 'submit' && p.exp?.content === 'tambahPengecualian'))

/* Jenis input yang punya pemeriksaan bentuk bawaan (typeMismatch/rangeOverflow). */
const JENIS_BERVALIDASI = new Set(['email', 'url', 'number', 'date', 'datetime-local', 'time', 'month', 'week', 'range'])
const ATRIBUT_KENDALA = ['required', 'pattern', 'min', 'max', 'minlength', 'step']

describe('/sakelar form tambah email: penilainya periksaEmailPengecualian saja', () => {
  it('tepat satu form dengan @submit tambahPengecualian', () => {
    expect(formTambah).toHaveLength(1)
  })

  it('form memakai novalidate', () => {
    expect(atribut(formTambah[0]!, 'novalidate')).toBe(true)
  })

  it('kontrol di dalamnya tanpa kendala bawaan peramban (lapis kedua bila novalidate hilang)', () => {
    const kontrol = semua(formTambah[0]!).filter(n => n.tag === 'input' || n.tag === 'textarea' || n.tag === 'select')
    expect(kontrol.length).toBeGreaterThan(0)
    for (const k of kontrol) {
      const jenis = atribut(k, 'type')
      expect(jenis, 'type terikat tidak bisa diperiksa — tulis statis').not.toBe(true)
      expect(JENIS_BERVALIDASI.has(String(jenis ?? 'text'))).toBe(false)
      for (const a of ATRIBUT_KENDALA) expect(atribut(k, a), `atribut ${a}`).toBeUndefined()
    }
    // Papan ketik email di ponsel tetap didapat tanpa type="email".
    expect(atribut(kontrol[0]!, 'inputmode')).toBe('email')
  })

  it('handler memetakan galat ke sakelar.emailGalat.<galat>', () => {
    expect(SRC).toMatch(/const galat = periksaEmailPengecualian\(emailBaru\.value, draf\.value\)/)
    expect(SRC).toMatch(/galatEmail\.value = tcf\(`sakelar\.emailGalat\.\$\{galat\}`\)/)
  })
})

describe('masukan yang dulu ditahan peramban kini mendapat pesan console', () => {
  /* Dicatat di Browser pane (en-US) dengan type="email": dua yang pertama
     checkValidity()=false — submit tidak pernah terjadi. */
  const KASUS: [string, GalatEmailPengecualian][] = [
    ['ded*** · gmail.com', 'tersamar'],   // bentuk chip tersamar dari server
    ['abc', 'bukan-email'],
    ['a@b', 'bukan-email'],               // lolos type="email", ditolak di sini
    ['ded***@gmail.com', 'tersamar'],
  ]
  for (const [masukan, galat] of KASUS) {
    it(`'${masukan}' → ${galat}, teksnya ada di ID dan EN`, () => {
      expect(periksaEmailPengecualian(masukan, [])).toBe(galat)
      for (const b of ['id', 'en'] as const) {
        const teks = KAMUS_CASHFLOW[b].sakelar.emailGalat[galat]
        expect(typeof teks).toBe('string')
        expect(teks.length).toBeGreaterThan(0)
      }
    })
  }
  it('ID dan EN berbeda (bukan salinan satu bahasa)', () => {
    expect(KAMUS_CASHFLOW.en.sakelar.emailGalat.tersamar).not.toBe(KAMUS_CASHFLOW.id.sakelar.emailGalat.tersamar)
  })
})
