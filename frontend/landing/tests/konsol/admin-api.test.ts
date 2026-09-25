/**
 * composables/useAdminApi.ts — klien BFF console dijalankan sungguhan di node.
 *
 * Temuan tinjauan C2: postDenganHeader dulu menyusun sendiri header ikatan,
 * X-Console, metode, dan penanganan galat sesi, dan tidak ada uji yang
 * menjalankannya. Kini panggil() dan tulisDenganHeader() lewat satu pembantu
 * (kirim); uji ini memastikan keduanya membawa header yang ditagih BFF
 * (X-Konsol-Ikat untuk semua metode, X-Console untuk tulis) dan galat sesi
 * ditangani (tindakanGalatSesi ASLI dari utils/konsol).
 *
 * Auto-import Nuxt ditiru sebagai global: $fetch (+ .raw), headerIkatan,
 * useToast, useRouter, navigateTo, dan kawan-kawan.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { tindakanGalatSesi } from '~/utils/konsol'

const IKAT = { 'X-Konsol-Ikat': 'token-ikatan-uji' }

const raw = vi.fn()
const toast = { warning: vi.fn(), success: vi.fn(), error: vi.fn() }
const navigateTo = vi.fn()
const pulihkanIkatan = vi.fn(() => false)

type Api = {
  get: (p: string, q?: Record<string, unknown>) => Promise<unknown>
  post: (p: string, b?: unknown) => Promise<unknown>
  put: (p: string, b?: unknown) => Promise<unknown>
  del: (p: string) => Promise<void>
  tulisDenganHeader: (m: 'POST' | 'PUT' | 'DELETE', p: string, b?: unknown) => Promise<{ data: unknown; headers: Headers }>
}
let api: Api

beforeAll(async () => {
  const $fetch = Object.assign(vi.fn(), { raw })
  vi.stubGlobal('$fetch', $fetch)
  vi.stubGlobal('headerIkatan', () => ({ ...IKAT }))
  vi.stubGlobal('tindakanGalatSesi', tindakanGalatSesi)
  vi.stubGlobal('pulihkanIkatan', pulihkanIkatan)
  vi.stubGlobal('muatUlangKonsol', vi.fn())
  vi.stubGlobal('useToast', () => toast)
  vi.stubGlobal('useState', () => ({ value: null }))
  vi.stubGlobal('useRouter', () => ({ currentRoute: { value: { path: '/console/users', fullPath: '/console/users' } } }))
  vi.stubGlobal('pindahDisengaja', vi.fn())
  vi.stubGlobal('navigateTo', navigateTo)
  const { useAdminApi } = await import('~/composables/useAdminApi')
  api = useAdminApi() as unknown as Api
})
afterAll(() => vi.unstubAllGlobals())
beforeEach(() => {
  raw.mockReset()
  raw.mockImplementation(async () => ({ _data: { data: { ok: true } }, headers: new Headers({ 'x-konsol-cashflow-cabut': 'dicabut' }) }))
  for (const f of [toast.warning, toast.success, toast.error, navigateTo, pulihkanIkatan]) f.mockClear()
})

const kiriman = (n = 0) => {
  const [url, opsi] = raw.mock.calls[n]!
  return { url, metode: opsi.method, header: opsi.headers as Record<string, string>, body: opsi.body }
}
const galatFetch = (status: number, kode = '') =>
  Object.assign(new Error(`HTTP ${status}`), { statusCode: status, data: { errors: { code: kode, message: kode } } })

describe('tulisDenganHeader — satu jalur dengan panggil()', () => {
  it.each(['POST', 'PUT', 'DELETE'] as const)('%s: metode itu, X-Console + ikatan, badan, dan header jawaban dipulangkan', async (metode) => {
    const r = await api.tulisDenganHeader(metode, '/admin/users/u1/revoke-sessions', { a: 1 })
    expect(kiriman()).toEqual({
      url: '/api/gw/admin/users/u1/revoke-sessions', metode,
      header: { ...IKAT, 'X-Console': '1' }, body: { a: 1 },
    })
    expect(r.headers.get('x-konsol-cashflow-cabut')).toBe('dicabut')
    expect(r.data).toEqual({ data: { ok: true } })
  })

  it('GET tetap membawa ikatan, tanpa X-Console; post/put/del membawa keduanya', async () => {
    await api.get('/admin/users', { page: 1 })
    expect(kiriman(0).header).toEqual(IKAT)
    await api.post('/admin/x', {})
    await api.put('/admin/x', {})
    await api.del('/admin/x')
    for (const n of [1, 2, 3]) expect(kiriman(n).header, String(n)).toEqual({ ...IKAT, 'X-Console': '1' })
    expect([1, 2, 3].map(n => kiriman(n).metode)).toEqual(['POST', 'PUT', 'DELETE'])
  })

  it('401 di tengah tulis → galat dilempar ulang dan toast "Masuk lagi" menetap, tanpa pindah halaman', async () => {
    raw.mockRejectedValueOnce(galatFetch(401, 'UNAUTHORIZED'))
    await expect(api.tulisDenganHeader('POST', '/admin/users/u1/totp/reset')).rejects.toThrow('HTTP 401')
    expect(toast.warning).toHaveBeenCalledTimes(1)
    expect(toast.warning.mock.calls[0]!.slice(1)).toEqual([0, expect.objectContaining({ id: 'konsol-sesi-habis', kunci: 'sesi.habisTulis' })])
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('403 ikatan saat tulis → toast "Muat ulang" menetap', async () => {
    raw.mockRejectedValueOnce(Object.assign(new Error('HTTP 403'), { statusCode: 403, data: { statusMessage: 'ikatan' } }))
    await expect(api.tulisDenganHeader('DELETE', '/admin/users/u1')).rejects.toThrow()
    expect(toast.warning.mock.calls[0]?.[2]).toMatchObject({ id: 'konsol-ikatan', kunci: 'sesi.ikatanTulis' })
  })

  it('401 saat baca → pindah ke /console/login (panggil() lewat penanganan yang sama)', async () => {
    raw.mockRejectedValueOnce(galatFetch(401, 'UNAUTHORIZED'))
    await expect(api.get('/admin/users')).rejects.toThrow()
    expect(navigateTo).toHaveBeenCalledWith({ path: '/console/login', query: { ke: '/console/users' } })
  })

  it('galat biasa (409) tidak memicu tindakan sesi', async () => {
    raw.mockRejectedValueOnce(galatFetch(409, 'EMAIL_TAKEN'))
    await expect(api.tulisDenganHeader('PUT', '/admin/users/u1', {})).rejects.toThrow()
    expect(toast.warning).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
