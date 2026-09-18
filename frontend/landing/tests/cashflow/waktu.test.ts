/**
 * Waktu WIB di console CashFlow.
 *
 * Staf membaca data orang Indonesia; "tanggal 18" harus berarti 18 di Jakarta,
 * apa pun zona laptop yang membukanya. Batas yang paling sering salah adalah
 * 00:00–06:59 WIB: di UTC masih "kemarin". Uji ini berjalan dengan TZ bukan
 * WIB (lihat vitest.config.ts) supaya fungsi yang lupa timeZone ketahuan.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  tanggalPendek, keSeri30Hari, jamWib, waktuPendekWib, hariIniWib, tanggalWib,
  keDatetimeLokalWib, dariDatetimeLokalWib,
} from '../../adapters/cashflow'

it('uji berjalan di zona yang bukan WIB', () => {
  expect(new Date('2026-09-17T12:00:00Z').getTimezoneOffset()).not.toBe(-420)
})

describe('tanggalPendek', () => {
  it('kolom date YYYY-MM-DD diformat dari string, tidak digeser zona', () => {
    expect(tanggalPendek('2026-09-03')).toBe('3 Sep 2026')
    expect(tanggalPendek('2026-01-01')).toBe('1 Jan 2026')
  })

  it('timestamptz memakai hari WIB di batas tengah malam', () => {
    expect(tanggalPendek('2026-09-17T16:59:59Z')).toBe('17 Sep 2026') // 23:59:59 WIB
    expect(tanggalPendek('2026-09-17T17:00:00Z')).toBe('18 Sep 2026') // 00:00 WIB
    expect(tanggalPendek('2026-12-31T17:30:00.123456+00:00')).toBe('1 Jan 2027')
  })

  it('kosong atau rusak → —', () => {
    expect(tanggalPendek(null)).toBe('—')
    expect(tanggalPendek('')).toBe('—')
    expect(tanggalPendek('bukan-tanggal')).toBe('—')
  })
})

describe('jam dan waktu pendek WIB', () => {
  it('jam memakai WIB', () => {
    expect(jamWib('2026-09-17T18:05:00Z')).toBe('01.05')
    expect(jamWib('2026-09-17T16:59:00Z')).toBe('23.59')
  })
  it('waktu pendek audit: tanggal + jam WIB', () => {
    expect(waktuPendekWib('2026-09-17T18:05:00Z')).toBe('18 Sep 01.05')
  })
})

describe('hari WIB sebagai string', () => {
  it('hariIniWib di batas: 17 Sep 17:00 UTC sudah 18 Sep di Jakarta', () => {
    expect(hariIniWib(new Date('2026-09-17T16:59:59Z'))).toBe('2026-09-17')
    expect(hariIniWib(new Date('2026-09-17T17:00:00Z'))).toBe('2026-09-18')
  })
  it('tanggalWib untuk timestamptz dan kolom date', () => {
    expect(tanggalWib('2026-09-17T18:00:00+00:00')).toBe('2026-09-18')
    expect(tanggalWib('2026-09-17')).toBe('2026-09-17')
  })
})

describe('keSeri30Hari', () => {
  afterEach(() => { vi.useRealTimers() })

  it('hari terakhir = hari ini WIB, bukan hari ini UTC', () => {
    vi.useFakeTimers()
    // 18 Sep 01:30 WIB — di UTC masih 17 Sep.
    vi.setSystemTime(new Date('2026-09-17T18:30:00Z'))
    const seri = keSeri30Hari([
      { tanggal: '2026-09-18', jumlah: 5 },
      { tanggal: '2026-08-20', jumlah: 2 },
      { tanggal: '2026-08-19', jumlah: 9 },
    ])
    expect(seri).toHaveLength(30)
    expect(seri[29]).toBe(5)
    expect(seri[0]).toBe(2)
    // 19 Agu berada di luar jendela 30 hari WIB.
    expect(seri.reduce((a, b) => a + b, 0)).toBe(7)
  })
})

describe('input datetime-local pengumuman ditafsirkan sebagai WIB', () => {
  it('ISO → nilai input WIB', () => {
    expect(keDatetimeLokalWib('2026-09-17T18:30:00Z')).toBe('2026-09-18T01:30')
    expect(keDatetimeLokalWib(new Date('2026-09-17T02:00:00Z'))).toBe('2026-09-17T09:00')
  })
  it('nilai input WIB → ISO UTC', () => {
    expect(dariDatetimeLokalWib('2026-09-18T01:30')).toBe('2026-09-17T18:30:00.000Z')
  })
  it('pulang-pergi tidak bergeser', () => {
    const v = '2026-03-01T00:15'
    expect(keDatetimeLokalWib(dariDatetimeLokalWib(v)!)).toBe(v)
  })
  it('masukan rusak → null', () => {
    expect(dariDatetimeLokalWib('')).toBeNull()
    expect(dariDatetimeLokalWib('2026-13-01T00:00')).toBeNull()
    expect(dariDatetimeLokalWib('2026-02-30T08:00')).toBeNull()
  })
})

describe('bahasa EN: nama bulan dan pemisah jam berganti, zona tetap WIB', () => {
  it('tanggalPendek', () => {
    expect(tanggalPendek('2026-08-03', 'en')).toBe('3 Aug 2026')
    expect(tanggalPendek('2026-05-17T17:00:00Z', 'en')).toBe('18 May 2026')
    expect(tanggalPendek('2026-10-01', 'en')).toBe('1 Oct 2026')
    expect(tanggalPendek('2026-12-31T17:30:00Z', 'en')).toBe('1 Jan 2027')
    // Bawaan tetap Indonesia.
    expect(tanggalPendek('2026-08-03')).toBe('3 Agu 2026')
  })
  it('jamWib dan waktuPendekWib', () => {
    expect(jamWib('2026-09-17T07:05:00Z', 'en')).toBe('14:05')
    expect(jamWib('2026-09-17T07:05:00Z')).toBe('14.05')
    expect(waktuPendekWib('2026-12-17T18:05:00Z', 'en')).toBe('18 Dec 01:05')
    expect(waktuPendekWib('2026-12-17T18:05:00Z')).toBe('18 Des 01.05')
  })
})
