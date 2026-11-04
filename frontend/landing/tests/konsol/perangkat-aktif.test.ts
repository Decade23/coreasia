import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useKonsolPerangkatAktif } from '../../composables/useKonsolPerangkatAktif'

let mounted: () => void
let unmount: () => void
let win: EventTarget
let doc: EventTarget & { hidden: boolean }
let user: { value: { trusted_device_id?: string } | null }
const fetchMock = vi.fn()
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-04T12:00:00Z'))
  win = new EventTarget()
  doc = Object.assign(new EventTarget(), { hidden: false })
  user = { value: { trusted_device_id: 'perangkat' } }
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', doc)
  vi.stubGlobal('useAdminAuth', () => ({ user }))
  vi.stubGlobal('onMounted', (fn: () => void) => { mounted = fn })
  vi.stubGlobal('onBeforeUnmount', (fn: () => void) => { unmount = fn })
  vi.stubGlobal('headerIkatan', () => ({ 'X-Konsol-Ikat': 'dokumen-uji' }))
  vi.stubGlobal('pulihkanIkatan', vi.fn())
  fetchMock.mockReset().mockResolvedValue({ data: { user: {} } })
  vi.stubGlobal('$fetch', fetchMock)
  useKonsolPerangkatAktif()
  mounted()
})
afterEach(() => { unmount(); vi.useRealTimers(); vi.unstubAllGlobals() })

const pakaiSelama = async (menit: number) => {
  for (let i = 0; i < menit; i++) { win.dispatchEvent(new Event('scroll')); await vi.advanceTimersByTimeAsync(60_000) }
}
describe('perpanjangan perangkat saat Console dipakai', () => {
  it('aktivitas CashFlow tanpa panggilan gateway tetap memperpanjang melalui BFF', async () => {
    await pakaiSelama(31)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/refresh', expect.objectContaining({ method: 'POST', headers: { 'X-Console': '1', 'X-Konsol-Ikat': 'dokumen-uji' } }))
    await pakaiSelama(30)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('tab menganggur tidak memperpanjang; kembali aktif memperpanjang tanpa login', async () => {
    await vi.advanceTimersByTimeAsync(45 * 60_000)
    expect(fetchMock).not.toHaveBeenCalled()
    win.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('tab tersembunyi, sesi biasa, dan sesi keluar tidak diperpanjang', async () => {
    doc.hidden = true
    await pakaiSelama(31)
    expect(fetchMock).not.toHaveBeenCalled()
    doc.hidden = false
    user.value = {}
    await pakaiSelama(31)
    user.value = null
    await pakaiSelama(31)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('gangguan jaringan tidak menghapus login dan bisa dicoba lagi', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network'))
    await pakaiSelama(32)
    expect(user.value?.trusted_device_id).toBe('perangkat')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('timer dan pendengar aktivitas berhenti saat Console ditinggalkan', async () => {
    unmount()
    await pakaiSelama(61)
    win.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
