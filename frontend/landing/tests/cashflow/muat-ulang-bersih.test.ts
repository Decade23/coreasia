/**
 * plugins/muat-ulang-bersih.client.ts — muat ulang (build baru / chunk gagal)
 * TANPA menyalin payload.state ke sessionStorage (temuan fe p1 #2).
 *
 * Bawaan Nuxt 4 (emitRouteChunkError 'automatic') memanggil
 * reloadNuxtApp({ persistState: true }) dan menyalin SELURUH payload.state —
 * useState console: id kasus, nominal saringan, teks cari, kepala 360 — ke
 * sessionStorage 'nuxt:reload:state', yang tidak pernah dihapus karena
 * restoreState mati. Di sini: perilaku plugin pengganti (Nuxt ditiru
 * secukupnya), lalu penjaga konfigurasi supaya bawaan itu tidak kembali.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { KUNCI_STATE_MUAT_ULANG, hapusStateMuatUlang, jalurMuatUlang } from '~/utils/konsol'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')

type Penjaga = (to: { fullPath: string }) => unknown
const reloadNuxtApp = vi.fn()
let router: {
  beforeEach: ReturnType<typeof vi.fn>
  beforeResolve: ReturnType<typeof vi.fn>
  onError: ReturnType<typeof vi.fn>
}
let kait: Map<string, (x: { error: unknown }) => void>
let storage: { removeItem: ReturnType<typeof vi.fn> }
let storageDiblokir = false

beforeAll(() => {
  vi.stubGlobal('defineNuxtPlugin', (p: unknown) => p)
  vi.stubGlobal('useRouter', () => router)
  vi.stubGlobal('useRuntimeConfig', () => ({ app: { baseURL: '/' } }))
  vi.stubGlobal('reloadNuxtApp', reloadNuxtApp)
  vi.stubGlobal('window', {
    get sessionStorage() {
      if (storageDiblokir) throw new Error('SecurityError')
      return storage
    },
  })
})
afterAll(() => vi.unstubAllGlobals())

beforeEach(() => {
  reloadNuxtApp.mockReset()
  router = { beforeEach: vi.fn(), beforeResolve: vi.fn(), onError: vi.fn() }
  kait = new Map()
  storage = { removeItem: vi.fn() }
  storageDiblokir = false
})

async function pasangPlugin() {
  const m = await import('~/plugins/muat-ulang-bersih.client')
  const plugin = m.default as unknown as { setup: (app: { hook: (n: string, f: (x: { error: unknown }) => void) => void }) => void }
  plugin.setup({ hook: (n, f) => kait.set(n, f) })
}

describe('plugin muat-ulang-bersih', () => {
  it('menghapus salinan state muat-ulang yang tertinggal di awal setiap dokumen', async () => {
    await pasangPlugin()
    expect(storage.removeItem).toHaveBeenCalledWith('nuxt:reload:state')
  })

  it('storage diblokir tidak menggagalkan plugin', async () => {
    storageDiblokir = true
    await expect(pasangPlugin()).resolves.toBeUndefined()
    expect(router.onError).toHaveBeenCalledTimes(1)
  })

  it('build baru → navigasi berikutnya dimuat ulang di jalurnya, persistState:false', async () => {
    await pasangPlugin()
    expect(router.beforeResolve).not.toHaveBeenCalled()
    kait.get('app:manifest:update')!({ error: null })
    expect(router.beforeResolve).toHaveBeenCalledTimes(1)
    const penjaga = router.beforeResolve.mock.calls[0]![0] as Penjaga
    penjaga({ fullPath: '/console/cashflow/pengguna/abc/transaksi?dari=2026-09-01' })
    expect(reloadNuxtApp).toHaveBeenCalledWith({ path: '/console/cashflow/pengguna/abc/transaksi?dari=2026-09-01', persistState: false })
  })

  it('chunk gagal saat navigasi → dimuat ulang tanpa state; galat lain tidak', async () => {
    await pasangPlugin()
    const galatChunk = new Error('Failed to fetch dynamically imported module')
    kait.get('app:chunkError')!({ error: galatChunk })
    const onError = router.onError.mock.calls[0]![0] as (e: unknown, to: { fullPath: string }) => void
    onError(new Error('lain'), { fullPath: '/x' })
    expect(reloadNuxtApp).not.toHaveBeenCalled()
    onError(galatChunk, { fullPath: '/console/cashflow/audit' })
    expect(reloadNuxtApp).toHaveBeenCalledTimes(1)
    expect(reloadNuxtApp.mock.calls[0]![0]).toEqual({ path: '/console/cashflow/audit', persistState: false })
    // Navigasi baru mengosongkan catatan chunk gagal (seperti bawaan Nuxt).
    ;(router.beforeEach.mock.calls[0]![0] as () => void)()
    onError(galatChunk, { fullPath: '/y' })
    expect(reloadNuxtApp).toHaveBeenCalledTimes(1)
  })

  it('pembantu murni: jalur = joinURL(baseURL, fullPath); penghapus menelan galat storage', () => {
    expect(jalurMuatUlang('/', '/console/cashflow')).toBe('/console/cashflow')
    expect(jalurMuatUlang('/app/', '/console?x=1')).toBe('/app/console?x=1')
    expect(KUNCI_STATE_MUAT_ULANG).toBe('nuxt:reload:state')
    expect(() => hapusStateMuatUlang(() => { throw new Error('SecurityError') })).not.toThrow()
    expect(() => hapusStateMuatUlang(() => null)).not.toThrow()
  })
})

describe('keluar', () => {
  it('bersihkanJejak ikut menghapus salinan state muat-ulang', () => {
    const f = baca('composables/cashflow/useCashflowSesi.ts')
    const jejak = /const bersihkanJejak = \(\) => \{([\s\S]*?)\n {2}\}/.exec(f)?.[1] ?? ''
    expect(jejak).toMatch(/hapusStateMuatUlang\(/)
  })
})
