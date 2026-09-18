/**
 * Alasan email lengkap terikat PELAKU. Logout → login console adalah navigasi
 * SPA, jadi variabel modulnya hidup melewati pergantian admin di tab yang
 * sama; admin kedua tidak boleh mewarisi alasan (dan email utuh) admin pertama.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const user = ref<{ id: string; email: string } | null>(null)
vi.stubGlobal('useAdminAuth', () => ({ user }))
const { useCashflowAlasanDaftar, lupakanAlasanDaftar } = await import('~/composables/cashflow/useCashflowAlasanDaftar')

describe('useCashflowAlasanDaftar', () => {
  beforeEach(() => { lupakanAlasanDaftar(); user.value = { id: 'admin-a', email: 'a@coreasia.id' } })
  afterEach(() => { vi.useRealTimers() })

  it('admin yang sama memakai ulang alasannya', () => {
    const d = useCashflowAlasanDaftar()
    const e = d.ingat('Keluhan pengguna — tiket 123')
    expect(d.ambil()).toEqual(e)
  })

  it('admin lain di tab yang sama tidak mewarisi alasan, dan alasannya dibuang', () => {
    const d = useCashflowAlasanDaftar()
    d.ingat('Keluhan pengguna — tiket 123')
    user.value = { id: 'admin-b', email: 'b@coreasia.id' }
    expect(d.ambil()).toBeNull()
    user.value = { id: 'admin-a', email: 'a@coreasia.id' }
    expect(d.ambil()).toBeNull()
  })

  it('logout (lupakanAlasanDaftar) melupakan alasan', () => {
    const d = useCashflowAlasanDaftar()
    d.ingat('Keluhan pengguna — tiket 123')
    lupakanAlasanDaftar()
    expect(d.ambil()).toBeNull()
  })

  it('lewat 30 menit → null', () => {
    vi.useFakeTimers()
    const d = useCashflowAlasanDaftar()
    d.ingat('Keluhan pengguna — tiket 123')
    vi.advanceTimersByTime(30 * 60 * 1000 + 1)
    expect(d.ambil()).toBeNull()
  })

  it('admin belum diketahui: salinan tetap dipulangkan untuk muat ini, tapi tidak diingat', () => {
    user.value = null
    const d = useCashflowAlasanDaftar()
    expect(d.ingat('Keluhan pengguna — tiket 123').alasan).toBe('Keluhan pengguna — tiket 123')
    expect(d.ambil()).toBeNull()
  })
})
