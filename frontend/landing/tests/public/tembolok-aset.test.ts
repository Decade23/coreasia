/**
 * Tembolok berkas build: lama hanya untuk berkas yang ada, tidak pernah untuk
 * jawaban "tidak ditemukan" (server/lib/aset/rute-vercel.ts,
 * server/middleware/aset-hilang.ts, kait 'nitro:init' di nuxt.config.ts).
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { TEMBOLOK_ASET_HILANG, TEMBOLOK_ASET_LAMA, amankanTembolokAset, jalurAsetBuild, type RuteVercel } from '../../server/lib/aset/rute-vercel'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')

const SETAHUN = 'public, max-age=31536000, immutable'
/** Susunan yang ditulis preset Vercel milik Nitro untuk proyek ini (dipangkas). */
const dariPreset = (): { version: number, routes: RuteVercel[] } => ({
  version: 3,
  routes: [
    { headers: { 'cache-control': SETAHUN }, src: '/_nuxt/builds/meta/(.*)' },
    { status: 301, headers: { Location: '/products/leadku' }, src: '/solutions/leadku' },
    { headers: { 'cache-control': 'public, max-age=1, immutable' }, src: '/_nuxt/builds/(.*)' },
    { headers: { 'Cache-Control': 'public, max-age=300, must-revalidate' }, src: '/preview/(.*)' },
    { headers: { 'X-Robots-Tag': 'noindex' }, src: '/_nuxt' },
    { headers: { 'cache-control': SETAHUN }, src: '/_fonts/(.*)' },
    { headers: { 'X-Frame-Options': 'SAMEORIGIN' }, src: '/(.*)' },
    { src: '/_nuxt/builds/meta(.*)', headers: { 'cache-control': 'public,max-age=31536000,immutable' }, continue: true },
    { src: '/_nuxt/builds(.*)', headers: { 'cache-control': 'public,max-age=31536000,immutable' }, continue: true },
    { src: '/_fonts(.*)', headers: { 'cache-control': 'public,max-age=31536000,immutable' }, continue: true },
    { src: '/_nuxt(.*)', headers: { 'cache-control': 'public,max-age=31536000,immutable' }, continue: true },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/__fallback' },
  ],
})

const adaTembolok = (r: RuteVercel) => Object.keys(r.headers ?? {}).some(k => k.toLowerCase() === 'cache-control')
const fase = (rute: RuteVercel[], nama: string | null): RuteVercel[] => {
  const hasil: RuteVercel[] = []
  let kini: string | null = null
  for (const r of rute) {
    if (r.handle) kini = r.handle
    else if (kini === nama) hasil.push(r)
  }
  return hasil
}
/** Tiru pencocokan Vercel: src dijangkar penuh. */
const cocok = (rute: RuteVercel[], jalur: string) => rute.filter(r => new RegExp(`^${r.src}$`).test(jalur))

describe('amankanTembolokAset', () => {
  const hasil = amankanTembolokAset(dariPreset()).routes

  it('fase awal: tidak ada lagi cache-control untuk /_nuxt, apa pun statusnya', () => {
    const awal = fase(hasil, null)
    for (const jalur of ['/_nuxt/AbC123.js', '/_nuxt/tidak-ada.js', '/_nuxt/builds/latest.json', '/_nuxt/builds/meta/x.json', '/_nuxt']) {
      const pemberi = cocok(awal, jalur).filter(r => r.src !== '/(.*)' && adaTembolok(r))
      expect(pemberi, jalur).toEqual([])
    }
  })

  it('fase awal: rute lain utuh dan urutannya tetap; rute /_nuxt tetap ada sebagai penghenti', () => {
    const awal = fase(hasil, null)
    expect(awal.map(r => r.src)).toEqual([
      '/_nuxt/builds/meta/(.*)', '/solutions/leadku', '/_nuxt/builds/(.*)', '/preview/(.*)', '/_nuxt', '/_fonts/(.*)', '/(.*)', '/_fonts(.*)',
    ])
    expect(awal[0]!.headers).toEqual({ 'X-Content-Type-Options': 'nosniff' })
    expect(awal[1]).toEqual({ status: 301, headers: { Location: '/products/leadku' }, src: '/solutions/leadku' })
    expect(awal[3]!.headers).toEqual({ 'Cache-Control': 'public, max-age=300, must-revalidate' })
    expect(awal[4]!.headers).toEqual({ 'X-Robots-Tag': 'noindex' })
    expect(awal[5]!.headers).toEqual({ 'cache-control': SETAHUN })
    expect(fase(hasil, 'filesystem')).toEqual([{ src: '/(.*)', dest: '/__fallback' }])
  })

  it('miss: berkas build yang tidak ada mendapat no-store', () => {
    const miss = fase(hasil, 'miss')
    expect(miss).toEqual([{ src: '/_nuxt/(.*)', headers: { 'cache-control': 'no-store' }, continue: true }])
    expect(TEMBOLOK_ASET_HILANG).toBe('no-store')
    expect(cocok(miss, '/_nuxt/tidak-ada.js')).toHaveLength(1)
    expect(cocok(miss, '/artikel/x')).toHaveLength(0)
  })

  it('hit: tepat SATU aturan per berkas, nilainya sama dengan sebelum perubahan', () => {
    const hit = fase(hasil, 'hit')
    const nilai = (jalur: string) => {
      const c = cocok(hit, jalur)
      expect(c, jalur).toHaveLength(1)
      return c[0]!.headers!['cache-control']
    }
    expect(nilai('/_nuxt/AbC123.js')).toBe(TEMBOLOK_ASET_LAMA)
    expect(nilai('/_nuxt/entry.DeF456.css')).toBe(SETAHUN)
    expect(nilai('/_nuxt/builds/latest.json')).toBe('public, max-age=1, immutable')
    expect(nilai('/_nuxt/builds/meta/0a1b.json')).toBe(SETAHUN)
    expect(cocok(hit, '/_fonts/a.woff2')).toHaveLength(0)
  })

  it('bentuk rute hit/miss memenuhi aturan Vercel: continue, tanpa dest dan status', () => {
    for (const r of [...fase(hasil, 'hit'), ...fase(hasil, 'miss')]) {
      expect(r.continue).toBe(true)
      expect(r.dest).toBeUndefined()
      expect(r.status).toBeUndefined()
    }
    expect(hasil.filter(r => r.handle).map(r => r.handle)).toEqual(['filesystem', 'miss', 'hit'])
  })

  it('tanpa manifest build: satu aturan hit untuk seluruh folder', () => {
    const k = dariPreset()
    k.routes = k.routes.filter(r => !r.src?.includes('builds'))
    expect(fase(amankanTembolokAset(k).routes, 'hit')).toEqual([{ src: '/_nuxt/(.*)', headers: { 'cache-control': SETAHUN }, continue: true }])
  })

  it('folder build lain (baseURL atau buildAssetsDir diubah) ikut', () => {
    const k = { routes: [{ src: '/app/_aset(.*)', headers: { 'cache-control': SETAHUN }, continue: true }, { handle: 'filesystem' }] }
    const r = amankanTembolokAset(k, '/app/_aset/').routes
    expect(fase(r, null)).toEqual([])
    expect(fase(r, 'hit')[0]!.src).toBe('/app/_aset/(.*)')
  })

  it('susunan tak dikenal menggagalkan build, bukan diam-diam lolos', () => {
    expect(() => amankanTembolokAset({})).toThrow(/routes/)
    expect(() => amankanTembolokAset({ routes: [{ src: '/(.*)', dest: '/x' }] })).toThrow(/filesystem/)
    const k = dariPreset()
    k.routes.push({ handle: 'hit' })
    expect(() => amankanTembolokAset(k)).toThrow(/hit\/miss/)
  })

  it('masukan tidak diubah di tempat', () => {
    const k = dariPreset()
    const salinan = JSON.stringify(k)
    amankanTembolokAset(k)
    expect(JSON.stringify(k)).toBe(salinan)
  })
})

describe('jalurAsetBuild', () => {
  it('hanya isi folder build', () => {
    expect(jalurAsetBuild('/_nuxt/a.js')).toBe(true)
    expect(jalurAsetBuild('/_nuxt/builds/meta/x.json?v=1')).toBe(true)
    expect(jalurAsetBuild('/_nuxt')).toBe(false)
    expect(jalurAsetBuild('/_nuxtx/a.js')).toBe(false)
    expect(jalurAsetBuild('/artikel/_nuxt/a.js')).toBe(false)
    expect(jalurAsetBuild('/api/x?u=/_nuxt/a.js')).toBe(false)
    expect(jalurAsetBuild('/app/_aset/a.js', '/app/_aset/')).toBe(true)
  })
})

describe('middleware aset-hilang', () => {
  const kepala: Record<string, string> = {}
  let status = 200
  beforeAll(() => {
    vi.stubGlobal('defineEventHandler', (f: unknown) => f)
    vi.stubGlobal('useRuntimeConfig', () => ({ app: { baseURL: '/', buildAssetsDir: '/_nuxt/' } }))
    vi.stubGlobal('setResponseStatus', (_e: unknown, s: number) => { status = s })
    vi.stubGlobal('setResponseHeaders', (_e: unknown, h: Record<string, string>) => { Object.assign(kepala, h) })
  })
  afterAll(() => vi.unstubAllGlobals())
  beforeEach(() => {
    status = 200
    for (const k of Object.keys(kepala)) delete kepala[k]
  })
  const panggil = async (path: string) => {
    const m = await import('../../server/middleware/aset-hilang')
    return (m.default as unknown as (e: { path: string }) => unknown)({ path })
  }

  it('berkas build yang sampai ke server = tidak ada: 404 polos, no-store', async () => {
    expect(await panggil('/_nuxt/tidak-ada.js')).toBe('Not Found')
    expect(status).toBe(404)
    expect(kepala['cache-control']).toBe('no-store')
    expect(kepala['content-type']).toMatch(/^text\/plain/)
  })

  it('jalur lain tidak disentuh', async () => {
    expect(await panggil('/console/cashflow')).toBeUndefined()
    expect(await panggil('/_fonts/a.woff2')).toBeUndefined()
    expect(status).toBe(200)
    expect(kepala).toEqual({})
  })
})

describe('penjaga konfigurasi', () => {
  const konfig = baca('nuxt.config.ts')

  it('routeRules tidak lagi memberi Cache-Control ke /_nuxt', () => {
    expect(konfig).not.toMatch(/['"]\/_nuxt\/\*\*['"]\s*:/)
  })

  it('kait nitro:init menulis ulang config.json Vercel', () => {
    expect(konfig).toMatch(/'nitro:init'\(nitro\)/)
    expect(konfig).toMatch(/amankanTembolokAset\(konfig, dirAset\)/)
  })
})
