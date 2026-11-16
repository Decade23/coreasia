/**
 * Pengaman klien saat berkas build gagal dimuat (utils/pulih-chunk.ts):
 * memuat ulang SEKALI dengan melewati tembolok, dan tidak pernah berputar.
 *
 * Skripnya dijalankan apa adanya (teks yang sama dengan yang masuk ke <head>)
 * terhadap jendela tiruan.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { hashSkrip, skripSebaris } from '../../server/lib/konsol/csp'
import { JEDA_PULIH_CHUNK_MS, KUNCI_PULIH_CHUNK, PARAM_PULIH_CHUNK, TUNGGU_PULIH_CHUNK_MS, skripPulihChunk, type PulihChunk } from '../../utils/pulih-chunk'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const ASAL = 'https://contoh.test'
const CHUNK = `${ASAL}/_nuxt/AbC123.js`

interface Tab {
  simpanan: Map<string, string>
  simpananDiblokir?: boolean
}
interface Dokumen {
  w: { __caPulihChunk?: PulihChunk }
  alamat: () => string
  replace: ReturnType<typeof vi.fn>
  fetch: ReturnType<typeof vi.fn>
  pancar: (jenis: string, peristiwa: unknown) => void
  waktuHabis: () => void
  entri: Array<{ name: string, responseStatus?: number }>
}

/** Satu dokumen di sebuah tab. sessionStorage milik tab, bertahan antar dokumen. */
function muat(tab: Tab, href: string, opsi: { fetch?: (u: string) => Promise<unknown> } = {}): Dokumen {
  let kini = href
  const pendengar = new Map<string, Array<(e: unknown) => void>>()
  const pewaktu: Array<() => void> = []
  const entri: Dokumen['entri'] = []
  const replace = vi.fn()
  const fetch = vi.fn(opsi.fetch ?? (() => Promise.resolve({ ok: true })))
  const w: Record<string, unknown> = {
    location: { get href() { return kini }, get origin() { return new URL(kini).origin }, replace },
    history: { state: { ada: 1 }, replaceState: (_s: unknown, _j: string, u: string) => { kini = new URL(u, kini).href } },
    get sessionStorage() {
      if (tab.simpananDiblokir) throw new Error('SecurityError')
      return { getItem: (k: string) => tab.simpanan.get(k) ?? null, setItem: (k: string, v: string) => { tab.simpanan.set(k, v) } }
    },
    performance: { getEntriesByType: () => entri },
    fetch,
    setTimeout: (f: () => void, ms: number) => { expect(ms).toBe(TUNGGU_PULIH_CHUNK_MS); pewaktu.push(f) },
    addEventListener: (jenis: string, f: (e: unknown) => void) => { pendengar.set(jenis, [...(pendengar.get(jenis) ?? []), f]) },
  }
  new Function('window', skripPulihChunk())(w)
  return {
    w, replace, fetch, entri,
    alamat: () => kini,
    pancar: (jenis, peristiwa) => { for (const f of pendengar.get(jenis) ?? []) f(peristiwa) },
    waktuHabis: () => { for (const f of pewaktu) f() },
  }
}
const tabBaru = (): Tab => ({ simpanan: new Map() })
const galatVite = (url = CHUNK) => ({ payload: new Error(`Failed to fetch dynamically imported module: ${url}`) })
const galatSkrip = (src = CHUNK) => ({ target: { tagName: 'SCRIPT', src } })
const tunda = () => new Promise(r => setTimeout(r, 0))
const tujuan = (d: Dokumen): URL => new URL(d.replace.mock.calls[0]![0] as string, ASAL)

describe('pulih chunk: satu kali', () => {
  it('impor dinamis gagal → berkasnya diminta ulang melewati tembolok, lalu dokumen dimuat ulang dengan parameter pembeda', async () => {
    const d = muat(tabBaru(), `${ASAL}/console/cashflow?tab=a#x`)
    d.pancar('vite:preloadError', galatVite())
    expect(d.fetch).toHaveBeenCalledWith(CHUNK, { cache: 'reload', credentials: 'same-origin' })
    expect(d.replace).not.toHaveBeenCalled()
    await tunda()
    expect(d.replace).toHaveBeenCalledTimes(1)
    const t = tujuan(d)
    expect(t.pathname).toBe('/console/cashflow')
    expect(t.searchParams.get('tab')).toBe('a')
    expect(t.searchParams.get(PARAM_PULIH_CHUNK)).toMatch(/^[0-9a-z]+$/)
    expect(t.hash).toBe('#x')
  })

  it('berkas utama gagal (peristiwa error pada <script>) ditangani tanpa Nuxt', async () => {
    const d = muat(tabBaru(), `${ASAL}/console`)
    d.pancar('error', galatSkrip())
    await tunda()
    expect(d.fetch).toHaveBeenCalledTimes(1)
    expect(d.replace).toHaveBeenCalledTimes(1)
  })

  it('lembar gaya build gagal ikut ditangani; berkas lain dan asal lain tidak', async () => {
    const d = muat(tabBaru(), `${ASAL}/`)
    d.pancar('error', { target: { tagName: 'IMG', src: `${ASAL}/_nuxt/a.png` } })
    d.pancar('error', galatSkrip('https://www.googletagmanager.com/gtm.js'))
    d.pancar('error', galatSkrip(`${ASAL}/lib/lain.js`))
    d.pancar('error', galatSkrip('https://jahat.test/_nuxt/a.js'))
    d.pancar('error', { target: d.w })
    d.pancar('error', {})
    await tunda()
    expect(d.replace).not.toHaveBeenCalled()
    d.pancar('error', { target: { tagName: 'link', href: `${ASAL}/_nuxt/entry.css` } })
    await tunda()
    expect(d.replace).toHaveBeenCalledTimes(1)
  })

  it('berkas build lain yang tercatat gagal di Resource Timing ikut diminta ulang, tanpa ganda', async () => {
    const d = muat(tabBaru(), `${ASAL}/console`)
    d.entri.push(
      { name: `${ASAL}/_nuxt/Dep1.js`, responseStatus: 404 },
      { name: CHUNK, responseStatus: 404 },
      { name: `${ASAL}/_nuxt/Sehat.js`, responseStatus: 200 },
      { name: `${ASAL}/api/x`, responseStatus: 500 },
      { name: `${ASAL}/_nuxt/TanpaStatus.js` },
    )
    d.pancar('error', galatSkrip())
    await tunda()
    expect(d.fetch.mock.calls.map(c => c[0])).toEqual([`${ASAL}/_nuxt/Dep1.js`, CHUNK])
  })

  it('permintaan ulang gagal atau menggantung tidak menahan muat ulang', async () => {
    const gagal = muat(tabBaru(), `${ASAL}/console`, { fetch: () => Promise.reject(new Error('jaringan')) })
    gagal.pancar('vite:preloadError', galatVite())
    await tunda()
    expect(gagal.replace).toHaveBeenCalledTimes(1)

    const gantung = muat(tabBaru(), `${ASAL}/console`, { fetch: () => new Promise(() => {}) })
    gantung.pancar('vite:preloadError', galatVite())
    await tunda()
    expect(gantung.replace).not.toHaveBeenCalled()
    gantung.waktuHabis()
    gantung.waktuHabis()
    expect(gantung.replace).toHaveBeenCalledTimes(1)
  })

  it('galat tanpa alamat (Safari) tetap memuat ulang, tanpa permintaan ulang', async () => {
    const d = muat(tabBaru(), `${ASAL}/console`)
    d.pancar('vite:preloadError', { payload: new Error('Importing a module script failed.') })
    await tunda()
    expect(d.fetch).not.toHaveBeenCalled()
    expect(d.replace).toHaveBeenCalledTimes(1)
  })

  it('alamat relatif di pesan Vite (CSS) dikenali', async () => {
    const d = muat(tabBaru(), `${ASAL}/console`)
    d.pancar('vite:preloadError', { payload: new Error('Unable to preload CSS for /_nuxt/halaman.Zz9.css') })
    await tunda()
    expect(d.fetch.mock.calls[0]![0]).toBe(`${ASAL}/_nuxt/halaman.Zz9.css`)
  })

  it('banyak galat beruntun di satu dokumen = satu muat ulang', async () => {
    const d = muat(tabBaru(), `${ASAL}/console`)
    for (let i = 0; i < 5; i++) d.pancar('vite:preloadError', galatVite(`${ASAL}/_nuxt/K${i}.js`))
    d.pancar('error', galatSkrip())
    await tunda()
    d.waktuHabis()
    d.pancar('vite:preloadError', galatVite())
    await tunda()
    expect(d.replace).toHaveBeenCalledTimes(1)
  })

  it('plugin boleh menyusulkan halaman tujuan selama pemulihan berjalan; asal lain ditolak', async () => {
    const d = muat(tabBaru(), `${ASAL}/console`)
    d.pancar('vite:preloadError', galatVite())
    expect(d.w.__caPulihChunk!(null, '/console/cashflow/audit?hal=2')).toBe(true)
    await tunda()
    const t = tujuan(d)
    expect(t.pathname + t.search.replace(/&?_mc=[^&]+/, '')).toBe('/console/cashflow/audit?hal=2')

    const lain = muat(tabBaru(), `${ASAL}/console`)
    expect(lain.w.__caPulihChunk!(null, 'https://jahat.test/x')).toBe(true)
    await tunda()
    expect(tujuan(lain).pathname).toBe('/console')
    expect((lain.replace.mock.calls[0]![0] as string).startsWith('/')).toBe(true)
  })
})

describe('pulih chunk: tidak pernah berputar', () => {
  /** Ikuti muat ulang otomatis sampai berhenti. Halamannya SELALU gagal;
   *  `berkasSehat` menentukan jawaban server saat berkas diminta ulang. */
  async function ikuti(tab: Tab, awal: string, berkasSehat = false, batas = 6): Promise<string[]> {
    const jejak = [awal]
    let href = awal
    for (let i = 0; i < batas; i++) {
      const d = muat(tab, href, { fetch: () => Promise.resolve({ ok: berkasSehat }) })
      d.pancar('error', galatSkrip())
      d.pancar('vite:preloadError', galatVite())
      await tunda()
      d.waktuHabis()
      if (!d.replace.mock.calls.length) break
      href = new URL(d.replace.mock.calls[0]![0] as string, ASAL).href
      jejak.push(href)
    }
    return jejak
  }
  const otomatis = (jejak: string[]) => jejak.length - 1

  it('berkas terus gagal → tepat satu muat ulang otomatis lalu berhenti', async () => {
    expect(otomatis(await ikuti(tabBaru(), `${ASAL}/console/cashflow`))).toBe(1)
    expect(otomatis(await ikuti(tabBaru(), `${ASAL}/console/cashflow`, true))).toBe(1)
  })

  it('tetap satu kali walau sessionStorage diblokir (penjaga parameter tidak butuh penyimpanan)', async () => {
    const tab: Tab = { simpanan: new Map(), simpananDiblokir: true }
    expect(otomatis(await ikuti(tab, `${ASAL}/console/cashflow`, true))).toBe(1)
    expect(tab.simpanan.size).toBe(0)
  })

  it('dokumen hasil pemulihan: parameter dibuang dari alamat, tembolok tetap diperbaiki, tetapi dokumen itu tidak memuat ulang lagi', async () => {
    const d = muat(tabBaru(), `${ASAL}/console/cashflow?tab=a&${PARAM_PULIH_CHUNK}=abc#x`)
    expect(d.alamat()).toBe(`${ASAL}/console/cashflow?tab=a#x`)
    expect(d.w.__caPulihChunk!(CHUNK)).toBe(false)
    d.pancar('vite:preloadError', galatVite())
    d.pancar('error', galatSkrip())
    await tunda()
    d.waktuHabis()
    expect(d.fetch).toHaveBeenCalledTimes(1)
    expect(d.fetch).toHaveBeenCalledWith(CHUNK, { cache: 'reload', credentials: 'same-origin' })
    expect(d.replace).not.toHaveBeenCalled()
  })

  it('kesempatan kedua hanya dengan bukti berkas sudah sehat; tidak pernah ada yang ketiga dalam satu jeda', async () => {
    const tab = tabBaru()
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(new Date('2026-11-17T03:00:00Z'))
      const mulai = Date.now()
      // Rilis sedang berjalan: server masih 404, muat ulang pertama sia-sia.
      expect(otomatis(await ikuti(tab, `${ASAL}/console`))).toBe(1)
      expect(tab.simpanan.get(KUNCI_PULIH_CHUNK)).toBe(`${mulai}:1`)

      // Pengguna memuat ulang sendiri, server masih 404: tidak ada muat ulang otomatis.
      vi.setSystemTime(mulai + 60_000)
      expect(otomatis(await ikuti(tab, `${ASAL}/console`))).toBe(0)
      expect(tab.simpanan.get(KUNCI_PULIH_CHUNK)).toBe(`${mulai}:1`)

      // Server sudah benar: permintaan ulang berhasil, satu muat ulang lagi.
      vi.setSystemTime(mulai + 120_000)
      expect(otomatis(await ikuti(tab, `${ASAL}/console`, true))).toBe(1)
      expect(tab.simpanan.get(KUNCI_PULIH_CHUNK)).toBe(`${mulai + 120_000}:2`)

      // Halaman tetap gagal karena sebab lain: berapa kali pun pengguna memuat ulang, tidak ada yang ketiga.
      let total = 0
      for (let i = 0; i < 5; i++) {
        vi.setSystemTime(Date.now() + 30_000)
        total += otomatis(await ikuti(tab, `${ASAL}/console`, true))
      }
      expect(total).toBe(0)

      // Sesudah jeda habis, hitungan mulai lagi dari satu.
      vi.setSystemTime(mulai + 120_000 + JEDA_PULIH_CHUNK_MS + 1000)
      expect(otomatis(await ikuti(tab, `${ASAL}/console`))).toBe(1)
      expect(tab.simpanan.get(KUNCI_PULIH_CHUNK)).toBe(`${Date.now()}:1`)
    } finally {
      vi.useRealTimers()
    }
  })

  it('kesempatan kedua batal bila permintaan ulang menggantung', async () => {
    const tab = tabBaru()
    tab.simpanan.set(KUNCI_PULIH_CHUNK, `${Date.now() - 5000}:1`)
    const d = muat(tab, `${ASAL}/console`, { fetch: () => new Promise(() => {}) })
    d.pancar('vite:preloadError', galatVite())
    await tunda()
    d.waktuHabis()
    expect(d.replace).not.toHaveBeenCalled()
    expect(tab.simpanan.get(KUNCI_PULIH_CHUNK)).toMatch(/:1$/)
    // Tidak ada alamat baru untuk dibuktikan: pemanggil diberi tahu pemulihan tidak berjalan.
    expect(d.w.__caPulihChunk!(CHUNK, '/console')).toBe(false)
  })

  it('jam mundur tidak membuka putaran: catatan di masa depan tetap menahan', async () => {
    const tab = tabBaru()
    tab.simpanan.set(KUNCI_PULIH_CHUNK, `${Date.now() + 60_000}:2`)
    expect(otomatis(await ikuti(tab, `${ASAL}/console`, true))).toBe(0)
  })

  it('catatan rusak dianggap kosong, lalu ditulis ulang dengan bentuk yang benar', async () => {
    const tab = tabBaru()
    tab.simpanan.set(KUNCI_PULIH_CHUNK, '{"state":"x"}')
    expect(otomatis(await ikuti(tab, `${ASAL}/console`))).toBe(1)
    expect(tab.simpanan.get(KUNCI_PULIH_CHUNK)).toMatch(/^\d+:1$/)
  })

  it('yang disimpan hanya waktu dan hitungan', async () => {
    const tab = tabBaru()
    await ikuti(tab, `${ASAL}/console/cashflow/pengguna/abc?cari=rahasia`)
    expect([...tab.simpanan.keys()]).toEqual([KUNCI_PULIH_CHUNK])
    expect(tab.simpanan.get(KUNCI_PULIH_CHUNK)).toMatch(/^\d+:[12]$/)
  })
})

describe('pulih chunk: pemasangan', () => {
  it('skripnya sah sebagai skrip sebaris dan mendapat hash CSP console', () => {
    const kode = skripPulihChunk()
    expect(kode).not.toMatch(/<\/script|<!--/i)
    const html = `<html><head><script>${kode}</script></head></html>`
    expect(skripSebaris(html)).toEqual([kode])
    expect(hashSkrip(kode)).toMatch(/^'sha256-/)
  })

  it('folder build lain bisa diberikan', async () => {
    expect(skripPulihChunk('/app/_aset/')).toContain('DIR="/app/_aset/"')
  })

  it('nuxt.config memasangnya di <head>, dan chunkError tetap manual', () => {
    const konfig = readFileSync(join(AKAR, 'nuxt.config.ts'), 'utf8')
    expect(konfig).toMatch(/script: \[\{ key: 'pulih-chunk', innerHTML: skripPulihChunk\(\), tagPosition: 'head' \}\]/)
    expect(konfig).toMatch(/emitRouteChunkError: 'manual'/)
  })
})
