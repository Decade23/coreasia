/**
 * plugins/gtag.client.ts — page_referrer tidak pernah berisi URL console
 * (temuan F7, lapis kedua sesudah Referrer-Policy: no-referrer di console).
 *
 * Nuxt ditiru secukupnya; utils/konsol dipakai ASLI (auto-import dipasang
 * sebagai global yang menunjuk ke fungsinya).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { jalurKonsol, referrerAnalitik } from '~/utils/konsol'

const trackPageView = vi.fn()
const useHead = vi.fn()
let referrer = ''
let path = '/'

beforeAll(() => {
  vi.stubGlobal('defineNuxtPlugin', (p: unknown) => p)
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { gtmId: 'GTM-UJI' } }))
  vi.stubGlobal('useRouter', () => ({ currentRoute: { value: { path, fullPath: path } } }))
  vi.stubGlobal('useAnalytics', () => ({ trackPageView }))
  vi.stubGlobal('useHead', useHead)
  vi.stubGlobal('jalurKonsol', jalurKonsol)
  vi.stubGlobal('referrerAnalitik', referrerAnalitik)
})
afterAll(() => vi.unstubAllGlobals())
beforeEach(() => {
  trackPageView.mockReset()
  useHead.mockReset()
})

async function muat(dari: string, ke = '/') {
  referrer = dari
  path = ke
  vi.stubGlobal('document', { referrer, documentElement: { lang: 'id' } })
  vi.stubGlobal('window', {
    location: { pathname: ke, href: `https://coreasia.id${ke}` },
    requestAnimationFrame: (f: () => void) => f(),
  })
  vi.resetModules()
  const plugin = (await import('~/plugins/gtag.client')).default as unknown as (app: { hook: () => void }) => void
  plugin({ hook: vi.fn() })
}

describe('gtag: page_referrer', () => {
  it('dokumen publik yang dibuka dari console → page_referrer kosong', async () => {
    await muat('https://coreasia.id/console/cashflow/pengguna/3f2a9c1e-0000-4000-8000-000000000001/transaksi?tx=9b1d0000-0000-4000-8000-000000000002')
    expect(useHead).toHaveBeenCalledTimes(1)
    expect(trackPageView).toHaveBeenCalledTimes(1)
    expect(trackPageView.mock.calls[0]![1]).toMatchObject({ page_referrer: '' })
    expect(JSON.stringify(trackPageView.mock.calls)).not.toContain('console')
  })

  it('referrer publik/situs lain tetap dikirim', async () => {
    await muat('https://www.google.com/')
    expect(trackPageView.mock.calls[0]![1]).toMatchObject({ page_referrer: 'https://www.google.com/' })
  })

  it('dokumen console tidak memuat GTM sama sekali', async () => {
    await muat('https://www.google.com/', '/console/login')
    expect(useHead).not.toHaveBeenCalled()
    expect(trackPageView).not.toHaveBeenCalled()
  })
})
