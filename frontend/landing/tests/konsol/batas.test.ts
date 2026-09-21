/**
 * IP klien menurut BFF (pembatas /api/admin/sesi, log, dan X-Konsol-Klien-IP
 * ke gateway) dan pembatas jendela tetap per instans.
 */
import { describe, expect, it } from 'vitest'
import { diCloudflare, ipKlien, ipSah, kunciBatas, PembatasJendela } from '../../server/lib/konsol/batas'

describe('ipSah', () => {
  it.each([
    ['203.0.113.9', '203.0.113.9'],
    [' 203.0.113.9 ', '203.0.113.9'],
    ['203.0.113.9, 10.0.0.1', '203.0.113.9'],
    ['::ffff:203.0.113.9', '203.0.113.9'],
    ['[2001:db8::1]', '2001:db8::1'],
    ['2001:db8::1', '2001:db8::1'],
  ])('%s → %s', (masuk, keluar) => {
    expect(ipSah(masuk)).toBe(keluar)
  })
  it.each(['', 'bukan-ip', '203.0.113.9:443', '999.1.1.1', null, undefined])('%s → null', (masuk) => {
    expect(ipSah(masuk)).toBeNull()
  })
})

describe('ipKlien', () => {
  it('di luar Vercel: hanya alamat soket, header (karangan klien) diabaikan', () => {
    expect(ipKlien({ diVercel: false, xRealIp: '1.1.1.1', cfConnectingIp: '2.2.2.2', alamatSoket: '::ffff:127.0.0.1' })).toBe('127.0.0.1')
    expect(ipKlien({ diVercel: false, alamatSoket: null })).toBeNull()
  })

  it('di Vercel: x-real-ip (dipasang Vercel), cadangan x-vercel-forwarded-for', () => {
    expect(ipKlien({ diVercel: true, xRealIp: '198.51.100.4', cfConnectingIp: '9.9.9.9' })).toBe('198.51.100.4')
    expect(ipKlien({ diVercel: true, xVercelForwardedFor: '198.51.100.5, 10.0.0.1' })).toBe('198.51.100.5')
    expect(ipKlien({ diVercel: true })).toBeNull()
  })

  it('cf-connecting-ip HANYA bila peer-nya memang edge Cloudflare', () => {
    expect(diCloudflare('104.16.1.1')).toBe(true)
    expect(diCloudflare('2606:4700::1')).toBe(true)
    expect(diCloudflare('198.51.100.4')).toBe(false)
    expect(ipKlien({ diVercel: true, xRealIp: '104.16.1.1', cfConnectingIp: '203.0.113.20' })).toBe('203.0.113.20')
    // Edge Cloudflare tanpa cf-connecting-ip yang sah → IP edge (lebih kasar, bukan karangan).
    expect(ipKlien({ diVercel: true, xRealIp: '104.16.1.1', cfConnectingIp: 'ngawur' })).toBe('104.16.1.1')
  })
})

describe('kunciBatas', () => {
  it('IPv4 apa adanya; IPv6 per /64 (sama dengan gateway); tanpa IP satu kunci bersama', () => {
    expect(kunciBatas('203.0.113.9')).toBe('203.0.113.9')
    expect(kunciBatas('2001:db8:1:2:aaaa::1')).toBe(kunciBatas('2001:db8:1:2:bbbb:cccc:dddd:eeee'))
    expect(kunciBatas('2001:db8:1:2::1')).toBe('2001:db8:1:2::/64')
    expect(kunciBatas('2001:db8:1:3::1')).not.toBe(kunciBatas('2001:db8:1:2::1'))
    expect(kunciBatas(null)).toBe('tak-dikenal')
  })
})

describe('PembatasJendela', () => {
  it('batas per kunci dalam jendela tetap; berhasil pun menghitung; habis jendela → baru', () => {
    const p = new PembatasJendela(3, 60_000)
    expect([1, 2, 3].map(() => p.periksa('a', 0).ok)).toEqual([true, true, true])
    expect(p.periksa('a', 1_000)).toEqual({ ok: false, tungguDetik: 59 })
    expect(p.periksa('b', 1_000).ok).toBe(true)
    expect(p.periksa('a', 60_000).ok).toBe(true)
  })

  it('peta dibatasi ukurannya saat banjir kunci acak', () => {
    const p = new PembatasJendela(1, 60_000, 100)
    for (let i = 0; i < 1000; i++) p.periksa(`k${i}`, 0)
    expect(p.ukuran).toBeLessThanOrEqual(100)
  })
})
