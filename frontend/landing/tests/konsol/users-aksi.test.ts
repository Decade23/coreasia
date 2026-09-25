/**
 * composables/useAdminUsers.ts dijalankan sungguhan di node (temuan tinjauan
 * C2): cabut sesi / reset TOTP, hapus, dan ubah admin membaca header BFF
 * X-Konsol-Cashflow-Cabut dan memilih toast sukses atau peringatan MENETAP
 * (runbook console, Langkah 1); modal konfirmasi hanya tertutup bila aksi
 * berhasil.
 *
 * Reaktivitas memakai vue ASLI, i18n memakai useConsoleI18n ASLI (interpolasi
 * {{…}} sungguhan), pemetaan galat memakai utils/konsol ASLI. Yang ditiru
 * hanya useAdminApi (tulisDenganHeader) dan useToast.
 */
import { computed, ref } from 'vue'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { galatDari, pesanKelolaAdmin } from '~/utils/konsol'

const bahasa = ref<'id' | 'en'>('id')
const toast = { success: vi.fn(), warning: vi.fn(), error: vi.fn() }
const tulis = vi.fn()

type Sasaran = { id: string; email: string; full_name: string }
type Users = {
  aksiSesi: (u: Sasaran, a: 'cabut-sesi' | 'reset-totp') => Promise<boolean>
  updateUser: (u: Sasaran, data: Record<string, unknown>) => Promise<boolean>
  deleteUser: (u: Sasaran) => Promise<boolean>
  konfirmasiSesi: { value: unknown }
  bukaKonfirmasiSesi: (a: 'cabut-sesi' | 'reset-totp', u: Sasaran) => void
  tutupKonfirmasiSesi: () => void
  jalankanKonfirmasiSesi: () => Promise<boolean>
  error: { value: string }
  saving: { value: boolean }
}
let buat: () => Users

beforeAll(async () => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useCoreI18n', () => ({ locale: bahasa }))
  const { useConsoleI18n } = await import('~/composables/useConsoleI18n')
  vi.stubGlobal('useConsoleI18n', useConsoleI18n)
  vi.stubGlobal('useToast', () => toast)
  vi.stubGlobal('useAdminApi', () => ({ tulisDenganHeader: tulis }))
  vi.stubGlobal('galatDari', galatDari)
  vi.stubGlobal('pesanKelolaAdmin', pesanKelolaAdmin)
  const { useAdminUsers } = await import('~/composables/useAdminUsers')
  buat = () => useAdminUsers() as unknown as Users
})
afterAll(() => vi.unstubAllGlobals())
beforeEach(() => {
  bahasa.value = 'id'
  tulis.mockReset()
  for (const f of Object.values(toast)) f.mockReset()
})

const BUDI: Sasaran = { id: 'b-1', email: 'budi@coreasia.id', full_name: 'Budi Santoso' }
const jawab = (hasil: string | null) => tulis.mockResolvedValue({
  data: undefined, headers: new Headers(hasil === null ? {} : { 'x-konsol-cashflow-cabut': hasil }),
})
const galat = (status: number, kode: string) =>
  Object.assign(new Error(`HTTP ${status}`), { statusCode: status, data: { errors: { code: kode, message: '' } } })

/** Setiap toast yang muncul: jenis, teks, dan durasi (undefined = bawaan). */
const toastMuncul = () => (['success', 'warning', 'error'] as const)
  .flatMap(j => toast[j].mock.calls.map(c => ({ jenis: j, teks: c[0] as string, durasi: c[1] as number | undefined })))

describe('aksiSesi — cabut sesi / reset TOTP admin lain', () => {
  it.each([
    ['cabut-sesi', '/admin/users/b-1/revoke-sessions'],
    ['reset-totp', '/admin/users/b-1/totp/reset'],
  ] as const)('%s → POST %s', async (aksi, jalur) => {
    jawab('dicabut')
    await buat().aksiSesi(BUDI, aksi)
    expect(tulis).toHaveBeenCalledWith('POST', jalur)
  })

  it('header dicabut → toast sukses bernama admin itu', async () => {
    jawab('dicabut')
    expect(await buat().aksiSesi(BUDI, 'cabut-sesi')).toBe(true)
    expect(toastMuncul()).toEqual([{ jenis: 'success', teks: 'Semua sesi Budi Santoso dicabut, termasuk sesi CashFlow.', durasi: undefined }])
  })

  it.each(['gagal', null])('header %s → peringatan MENETAP (durasi 0) yang menunjuk runbook, bukan sukses', async (hasil) => {
    jawab(hasil)
    expect(await buat().aksiSesi(BUDI, 'reset-totp')).toBe(true)
    const [t, ...lain] = toastMuncul()
    expect(lain).toEqual([])
    expect(t).toMatchObject({ jenis: 'warning', durasi: 0 })
    expect(t!.teks).toContain('Budi Santoso')
    expect(t!.teks).toContain('Langkah 1')
  })

  it('tanpa nama lengkap → email dipakai di pesan', async () => {
    jawab('dicabut')
    await buat().aksiSesi({ ...BUDI, full_name: '' }, 'cabut-sesi')
    expect(toastMuncul()[0]!.teks).toContain('budi@coreasia.id')
  })

  it('403 MFA_REQUIRED → toast galat, false, pesan tersimpan untuk modal', async () => {
    tulis.mockRejectedValue(galat(403, 'MFA_REQUIRED'))
    const u = buat()
    expect(await u.aksiSesi(BUDI, 'reset-totp')).toBe(false)
    expect(toastMuncul().map(t => t.jenis)).toEqual(['error'])
    expect(u.error.value).not.toBe('')
    expect(u.saving.value).toBe(false)
  })

  it('bahasa Inggris: teks en ikut terisi nama', async () => {
    bahasa.value = 'en'
    jawab('gagal')
    await buat().aksiSesi(BUDI, 'cabut-sesi')
    expect(toastMuncul()[0]!.teks).toMatch(/^Console sessions of Budi Santoso were revoked/)
  })
})

describe('modal konfirmasi sesi — tertutup hanya bila berhasil', () => {
  it('berhasil → modal tertutup', async () => {
    jawab('dicabut')
    const u = buat()
    u.bukaKonfirmasiSesi('cabut-sesi', BUDI)
    expect(u.konfirmasiSesi.value).toMatchObject({ aksi: 'cabut-sesi', user: { id: 'b-1' } })
    expect(await u.jalankanKonfirmasiSesi()).toBe(true)
    expect(u.konfirmasiSesi.value).toBeNull()
  })

  it('gagal → modal tetap terbuka dengan pesan galat', async () => {
    tulis.mockRejectedValue(galat(403, 'MFA_REQUIRED'))
    const u = buat()
    u.bukaKonfirmasiSesi('reset-totp', BUDI)
    expect(await u.jalankanKonfirmasiSesi()).toBe(false)
    expect(u.konfirmasiSesi.value).toMatchObject({ aksi: 'reset-totp' })
    expect(u.error.value).not.toBe('')
  })

  it('membuka modal membersihkan galat lama; tutup mengosongkan', () => {
    const u = buat()
    u.error.value = 'lama'
    u.bukaKonfirmasiSesi('cabut-sesi', BUDI)
    expect(u.error.value).toBe('')
    u.tutupKonfirmasiSesi()
    expect(u.konfirmasiSesi.value).toBeNull()
  })

  it('tanpa modal terbuka → tidak ada panggilan', async () => {
    expect(await buat().jalankanKonfirmasiSesi()).toBe(false)
    expect(tulis).not.toHaveBeenCalled()
  })
})

describe('hapus & ubah admin — hasil pencabutan sesi CashFlow ikut dibaca', () => {
  it('hapus: DELETE, header dicabut → sukses biasa', async () => {
    jawab('dicabut')
    expect(await buat().deleteUser(BUDI)).toBe(true)
    expect(tulis).toHaveBeenCalledWith('DELETE', '/admin/users/b-1')
    expect(toastMuncul()).toEqual([{ jenis: 'success', teks: 'User berhasil dihapus', durasi: undefined }])
  })

  it.each(['gagal', null])('hapus: header %s → peringatan menetap, bukan "berhasil dihapus"', async (hasil) => {
    jawab(hasil)
    await buat().deleteUser(BUDI)
    expect(toastMuncul()).toEqual([{
      jenis: 'warning', durasi: 0,
      teks: 'Budi Santoso dihapus, tetapi sesi CashFlow-nya belum tentu ikut dicabut. Cabut lewat SQL: runbook console, Langkah 1.',
    }])
  })

  it('ganti sandi admin lain: PUT, header gagal → peringatan menetap', async () => {
    jawab('gagal')
    expect(await buat().updateUser(BUDI, { password: 'Baru-1234' })).toBe(true)
    expect(tulis).toHaveBeenCalledWith('PUT', '/admin/users/b-1', { password: 'Baru-1234' })
    expect(toastMuncul()).toEqual([{ jenis: 'warning', durasi: 0, teks: expect.stringMatching(/^Perubahan Budi Santoso tersimpan.*Langkah 1\.$/) }])
  })

  it('ubah peran/nonaktifkan tanpa header → peringatan (BFF seharusnya mencabut)', async () => {
    for (const data of [{ full_name: 'Budi', role: 'admin' }, { is_active: false }, { full_name: 'Budi', email: 'b2@coreasia.id' }]) {
      for (const f of Object.values(toast)) f.mockReset()
      jawab(null)
      await buat().updateUser(BUDI, data)
      expect(toastMuncul().map(t => [t.jenis, t.durasi]), JSON.stringify(data)).toEqual([['warning', 0]])
    }
  })

  it('ubah nama saja / aktifkan tanpa header → sukses biasa (tidak ada yang dicabut)', async () => {
    for (const data of [{ full_name: 'Budi S' }, { is_active: true }]) {
      for (const f of Object.values(toast)) f.mockReset()
      jawab(null)
      await buat().updateUser(BUDI, data)
      expect(toastMuncul(), JSON.stringify(data)).toEqual([{ jenis: 'success', teks: 'User berhasil diperbarui', durasi: undefined }])
    }
  })

  it('tak-terkonfigurasi (modul CashFlow tidak dipasang) → sukses biasa', async () => {
    jawab('tak-terkonfigurasi')
    await buat().updateUser(BUDI, { password: 'Baru-1234' })
    await buat().deleteUser(BUDI)
    expect(toastMuncul().map(t => t.jenis)).toEqual(['success', 'success'])
  })

  it('409 EMAIL_TAKEN saat ubah → galat, tanpa toast sukses/peringatan', async () => {
    tulis.mockRejectedValue(galat(409, 'EMAIL_TAKEN'))
    expect(await buat().updateUser(BUDI, { email: 'x@coreasia.id' })).toBe(false)
    expect(toastMuncul().map(t => t.jenis)).toEqual(['error'])
  })
})
