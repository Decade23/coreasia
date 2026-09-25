/**
 * plugins/konsol-isolasi.client.ts — sisa console di sessionStorage tab.
 *
 * Temuan F8: dokumen publik yang dipulihkan dari back/forward cache (Back dari
 * console) tidak menjalankan plugin lagi, padahal console di tab yang sama
 * sudah menulis token CashFlow (akses + refresh) ke sessionStorage, dan GTM di
 * dokumen itu masih hidup. Kini dokumen publik memasang pendengar pageshow:
 * persisted → token + draf dibuang, lalu dokumen dimuat ulang — hanya bila
 * memang ada sisa console (Back biasa di situs publik tetap memakai bfcache).
 *
 * Nuxt ditiru secukupnya (defineNuxtPlugin, useRouter, window, document).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AWALAN_DRAF, KUNCI_SESI_CASHFLOW } from '~/utils/konsol'

vi.mock('~/composables/useKonsolIkatan', () => ({ ikatanKonsol: vi.fn() }))

class Simpanan {
  peta = new Map<string, string>()
  get length() { return this.peta.size }
  key(i: number) { return [...this.peta.keys()][i] ?? null }
  getItem(k: string) { return this.peta.get(k) ?? null }
  setItem(k: string, v: string) { this.peta.set(k, v) }
  removeItem(k: string) { this.peta.delete(k) }
}

let simpan: Simpanan
let pendengar: Map<string, Array<(e: { persisted?: boolean }) => void>>
let urutan: string[]
const reload = vi.fn()

beforeAll(() => {
  vi.stubGlobal('defineNuxtPlugin', (p: unknown) => p)
  vi.stubGlobal('useRouter', () => ({ beforeEach: vi.fn() }))
  vi.stubGlobal('document', { cookie: '' })
})
afterAll(() => vi.unstubAllGlobals())

beforeEach(() => {
  simpan = new Simpanan()
  pendengar = new Map()
  urutan = []
  reload.mockReset()
  reload.mockImplementation(() => urutan.push('reload'))
})

/** Jalankan plugin seolah dokumen di `path` baru dimuat. */
async function muat(path: string) {
  vi.stubGlobal('window', {
    location: { pathname: path, protocol: 'https:', reload, assign: vi.fn() },
    get sessionStorage() { return simpan },
    addEventListener: (jenis: string, f: (e: { persisted?: boolean }) => void) => {
      pendengar.set(jenis, [...(pendengar.get(jenis) ?? []), f])
    },
  })
  vi.resetModules()
  const plugin = (await import('~/plugins/konsol-isolasi.client')).default as unknown as () => void
  plugin()
}
const pageshow = (persisted: boolean) => { for (const f of pendengar.get('pageshow') ?? []) f({ persisted }) }
const isiTokenConsole = () => {
  simpan.setItem(KUNCI_SESI_CASHFLOW, '{"access_token":"AKSES-RAHASIA","refresh_token":"SEGAR"}')
  simpan.setItem(`${AWALAN_DRAF}artikel`, '{"isi":"draf"}')
  simpan.setItem('lain', 'tetap')
}

describe('konsol-isolasi: dokumen publik', () => {
  it('saat dimuat: token CashFlow dan draf console dibuang, kunci lain tetap', async () => {
    isiTokenConsole()
    await muat('/about')
    expect([...simpan.peta.keys()]).toEqual(['lain'])
  })

  it('F8: dipulihkan dari bfcache sesudah console menulis token → token & draf dibuang, LALU dimuat ulang', async () => {
    await muat('/about')
    // Tab pindah ke /console (navigasi dokumen), console menulis token, lalu Back.
    isiTokenConsole()
    simpan.removeItem = ((asli) => (k: string) => { urutan.push(`hapus:${k}`); asli.call(simpan, k) })(simpan.removeItem)
    pageshow(true)
    expect([...simpan.peta.keys()]).toEqual(['lain'])
    expect(reload).toHaveBeenCalledTimes(1)
    expect(urutan.at(-1)).toBe('reload')
    expect(urutan).toContain(`hapus:${KUNCI_SESI_CASHFLOW}`)
  })

  it('pageshow biasa (bukan dari bfcache) → tidak memuat ulang', async () => {
    await muat('/about')
    isiTokenConsole()
    pageshow(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('Back biasa di situs publik (storage tanpa sisa console) → bfcache dipakai, TANPA muat ulang', async () => {
    await muat('/layanan/jasa-pembuatan-website')
    simpan.setItem('lain', 'tetap')
    pageshow(true)
    expect(reload).not.toHaveBeenCalled()
    expect([...simpan.peta.keys()]).toEqual(['lain'])
  })

  it('hanya draf console yang tertinggal → dibuang lalu dimuat ulang', async () => {
    await muat('/about')
    simpan.setItem(`${AWALAN_DRAF}artikel`, '{"isi":"draf"}')
    pageshow(true)
    expect(simpan.getItem(`${AWALAN_DRAF}artikel`)).toBeNull()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('sessionStorage diblokir → tidak melempar dan tidak memuat ulang (GTM pun tak bisa membacanya)', async () => {
    await muat('/about')
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('SecurityError') } })
    expect(() => pageshow(true)).not.toThrow()
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('konsol-isolasi: dokumen console', () => {
  it('console tidak memasang pendengar bfcache dan tidak membuang tokennya sendiri', async () => {
    isiTokenConsole()
    await muat('/console/cashflow')
    expect(pendengar.get('pageshow')).toBeUndefined()
    expect(simpan.getItem(KUNCI_SESI_CASHFLOW)).not.toBeNull()
  })

  it('login console: token CashFlow dibuang, draf dibiarkan, tanpa pendengar bfcache', async () => {
    isiTokenConsole()
    await muat('/console/login')
    expect(simpan.getItem(KUNCI_SESI_CASHFLOW)).toBeNull()
    expect(simpan.getItem(`${AWALAN_DRAF}artikel`)).not.toBeNull()
    expect(pendengar.get('pageshow')).toBeUndefined()
  })
})
