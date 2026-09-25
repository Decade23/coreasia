/**
 * Rute BFF console dengan h3 SUNGGUHAN (temuan F13; perekat di ./bff.ts).
 *
 * Yang dikunci di sini — semuanya dulu bisa dihapus tanpa satu uji pun gagal:
 * - /api/gw/**, /api/cashflow/sesi, /api/admin/refresh, /api/admin/sesi
 *   menjawab 403 SEBELUM fetch ke gateway bila X-Konsol-Ikat tidak ada/tidak
 *   cocok, atau Sec-Fetch-Site bukan same-origin (skrip halaman publik
 *   satu-asal lolos Sec-Fetch-Site dan membawa cookie, tetapi tidak punya
 *   token ikatan). Setiap rute juga punya kontrol positif: permintaan yang sah
 *   BENAR-BENAR sampai ke gateway, jadi 403 di atas bukan kebetulan;
 * - /api/admin/sesi: pemilik token (sub) harus sama dengan /me id, dan
 *   cookie `ikat` diganti nilai baru sesudah serah terima;
 * - plugin konsol-csp: token ikatan hanya dititipkan pada navigasi dokumen
 *   (Sec-Fetch-Dest: document + Sec-Fetch-Mode: navigate);
 * - pencabutan sesi CashFlow (F3, migrasi 0092): logout, logout-all, akun
 *   sendiri diubah, dan DELETE /api/cashflow/sesi memanggil RPC per id admin
 *   gateway DAN RPC lama per email untuk SESI; kasus ditutup per email hanya
 *   bila id tidak diketahui (kasus dimiliki per id, label email bisa dipakai
 *   admin lain).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ADMIN_EMAIL, ADMIN_ID, AKSES, IKAT, cookieKonsol, headerKonsol, jwt, nilaiSetCookie, panggil, pasangGlobalNitro, tokenIkat,
} from './bff'
import { buatIkat } from '../../server/lib/konsol/ikatan'

const sb = vi.hoisted(() => ({
  rpc: [] as Array<{ nama: string; arg: Record<string, unknown> }>,
  rpcGagal: new Set<string>(),
  baris: null as Record<string, unknown> | null,
  keluar: [] as string[],
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async (nama: string, arg: Record<string, unknown>) => {
      sb.rpc.push({ nama, arg })
      return sb.rpcGagal.has(nama) ? { data: null, error: { message: `${nama} gagal` } } : { data: null, error: null }
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: sb.baris, error: null }) }) }) }),
    auth: {
      getUser: async () => ({ data: { user: { id: 'identitas-konsol' } }, error: null }),
      admin: { signOut: async (t: string) => { sb.keluar.push(t); return { error: null } } },
    },
  }),
}))

/** fetch ke gateway: setiap panggilan dicatat; jawabannya diatur per uji. */
const gateway = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
const json = (status: number, isi: unknown) =>
  new Response(JSON.stringify(isi), { status, headers: { 'content-type': 'application/json' } })

type Handler = unknown
const h: Record<string, Handler> = {}
beforeAll(async () => {
  pasangGlobalNitro()
  vi.stubGlobal('fetch', gateway)
  h.gw = (await import('../../server/api/gw/[...path]')).default
  h.cfSesi = (await import('../../server/api/cashflow/sesi.post')).default
  h.cfHapus = (await import('../../server/api/cashflow/sesi.delete')).default
  h.refresh = (await import('../../server/api/admin/refresh.post')).default
  h.sesi = (await import('../../server/api/admin/sesi.post')).default
  h.logout = (await import('../../server/api/admin/logout.post')).default
})
afterAll(() => vi.unstubAllGlobals())
beforeEach(() => {
  gateway.mockReset()
  gateway.mockImplementation(async () => json(200, { data: { ok: true } }))
  sb.rpc.length = 0
  sb.rpcGagal.clear()
  sb.baris = null
  sb.keluar.length = 0
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

const tanpa = (header: Record<string, string>, ...nama: string[]) =>
  Object.fromEntries(Object.entries(header).filter(([k]) => !nama.includes(k)))

/** Cara skrip halaman publik satu-asal (atau situs lain, atau curl) mencoba memakai BFF. */
const PENYUSUP: Array<[string, Record<string, string>]> = [
  ['tanpa X-Konsol-Ikat', tanpa(headerKonsol(), 'x-konsol-ikat')],
  ['token ikatan milik cookie lain', headerKonsol({ 'x-konsol-ikat': tokenIkat(buatIkat()) })],
  ['token ikatan rusak', headerKonsol({ 'x-konsol-ikat': 'bukan-token' })],
  ['Sec-Fetch-Site cross-site', headerKonsol({ 'sec-fetch-site': 'cross-site' })],
  ['Sec-Fetch-Site same-site', headerKonsol({ 'sec-fetch-site': 'same-site' })],
  ['tanpa Sec-Fetch-Site (curl)', tanpa(headerKonsol(), 'sec-fetch-site')],
]

describe('/api/gw/** — penjaga asal & ikatan sebelum gateway', () => {
  it('kontrol: permintaan dokumen console yang sah sampai ke gateway dengan Bearer dari cookie', async () => {
    const r = await panggil(h.gw, { path: '/api/gw/admin/users', header: headerKonsol(), cookie: cookieKonsol() })
    expect(r.status).toBe(200)
    expect(gateway).toHaveBeenCalledTimes(1)
    const [url, init] = gateway.mock.calls[0]!
    expect(url).toBe('http://gateway.uji/api/admin/users')
    expect(new Headers(init.headers).get('authorization')).toBe(`Bearer ${AKSES}`)
  })

  it.each(PENYUSUP)('%s → 403, gateway tidak dipanggil', async (_n, header) => {
    for (const metode of ['GET', 'POST']) {
      const r = await panggil(h.gw, { metode, path: '/api/gw/admin/users', header, cookie: cookieKonsol(), badan: metode === 'POST' ? '{}' : undefined })
      expect(r.status, metode).toBe(403)
    }
    expect(gateway).not.toHaveBeenCalled()
  })

  it('POST tanpa X-Console → 403 walau ikatan cocok', async () => {
    const r = await panggil(h.gw, { metode: 'POST', path: '/api/gw/admin/users', header: tanpa(headerKonsol(), 'x-console'), cookie: cookieKonsol(), badan: '{}' })
    expect(r).toMatchObject({ status: 403, statusMessage: 'tanpa-header-konsol' })
    expect(gateway).not.toHaveBeenCalled()
  })
})

describe('/api/gw/** — sesi berakhir mencabut sesi CashFlow per id DAN per email (F3)', () => {
  // Tanpa admin_kasus_tutup_pelaku: id diketahui, kasus ditutup per id saja.
  const RPC_PENUH = [
    { nama: 'admin_konsol_sesi_cabut_admin', arg: { p_admin_gw_id: ADMIN_ID } },
    { nama: 'admin_konsol_sesi_cabut_pelaku', arg: { p_email: ADMIN_EMAIL } },
    { nama: 'admin_kasus_tutup_admin', arg: { p_admin_gw_id: ADMIN_ID } },
  ]

  it('logout-all berhasil → cookie sesi dihapus, sesi dicabut per id dan email, kasus per id', async () => {
    gateway.mockImplementation(async () => new Response(null, { status: 204 }))
    const r = await panggil(h.gw, { metode: 'POST', path: '/api/gw/admin/auth/logout-all', header: headerKonsol(), cookie: cookieKonsol() })
    expect(r.status).toBe(204)
    expect(nilaiSetCookie(r, 'ca_konsol_akses')).toBe('')
    expect(sb.rpc).toEqual(RPC_PENUH)
  })

  it('ganti email akun sendiri → sesi berakhir; email sama (form ubah nama) → tidak', async () => {
    const ubah = (isi: unknown) => panggil(h.gw, {
      metode: 'PUT', path: `/api/gw/admin/users/${ADMIN_ID}`, header: headerKonsol({ 'content-type': 'application/json' }),
      cookie: cookieKonsol(), badan: JSON.stringify(isi),
    })
    await ubah({ full_name: 'Admin', email: 'ADMIN@coreasia.id', role: 'super_admin' })
    expect(sb.rpc).toEqual([])
    await ubah({ email: 'baru@coreasia.id' })
    // Email LAMA (dari token) yang dipakai jalur email: sesi yang dicetak dengan email lama ikut mati.
    expect(sb.rpc).toEqual(RPC_PENUH)
  })

  it('gagal di gateway (400) → tidak ada yang dicabut', async () => {
    gateway.mockImplementation(async () => json(400, { errors: { code: 'TOTP_INVALID' } }))
    await panggil(h.gw, { metode: 'POST', path: '/api/gw/admin/auth/totp/disable', header: headerKonsol(), cookie: cookieKonsol(), badan: '{}' })
    expect(sb.rpc).toEqual([])
  })
})

describe('/api/cashflow/sesi (POST) — penjaga sebelum gateway', () => {
  const hdr = (lain: Record<string, string> = {}) => headerKonsol({ 'x-cf-sesi': '1', ...lain })

  it('kontrol: permintaan sah sampai ke gateway /me', async () => {
    gateway.mockImplementation(async () => json(403, {}))
    const r = await panggil(h.cfSesi, { metode: 'POST', path: '/api/cashflow/sesi', header: hdr(), cookie: cookieKonsol() })
    expect(r).toMatchObject({ status: 401, statusMessage: 'cookie-ditolak' })
    expect(gateway).toHaveBeenCalledTimes(1)
    expect(gateway.mock.calls[0]![0]).toBe('http://gateway.uji/api/admin/auth/me')
  })

  it.each(PENYUSUP)('%s → 403, gateway tidak dipanggil, tidak ada sesi', async (_n, header) => {
    const r = await panggil(h.cfSesi, { metode: 'POST', path: '/api/cashflow/sesi', header: { ...header, 'x-cf-sesi': '1' }, cookie: cookieKonsol() })
    expect(r.status).toBe(403)
    expect(['ikatan', 'lintas-situs']).toContain(r.statusMessage)
    expect(gateway).not.toHaveBeenCalled()
    expect(sb.rpc).toEqual([])
  })

  it('tanpa X-CF-Sesi → 403 lintas-situs', async () => {
    const r = await panggil(h.cfSesi, { metode: 'POST', path: '/api/cashflow/sesi', header: headerKonsol(), cookie: cookieKonsol() })
    expect(r).toMatchObject({ status: 403, statusMessage: 'lintas-situs' })
    expect(gateway).not.toHaveBeenCalled()
  })
})

describe('/api/admin/refresh — penjaga sebelum gateway', () => {
  it('kontrol: permintaan sah menukar refresh token ke gateway', async () => {
    gateway.mockImplementation(async () => json(200, { data: { access_token: AKSES, refresh_token: AKSES, user: { id: ADMIN_ID } } }))
    const r = await panggil(h.refresh, { metode: 'POST', path: '/api/admin/refresh', header: headerKonsol(), cookie: cookieKonsol() })
    expect(r.status).toBe(200)
    expect(gateway).toHaveBeenCalledTimes(1)
    expect(gateway.mock.calls[0]![0]).toBe('http://gateway.uji/api/admin/auth/refresh')
  })

  it.each(PENYUSUP)('%s → 403, gateway tidak dipanggil', async (_n, header) => {
    const r = await panggil(h.refresh, { metode: 'POST', path: '/api/admin/refresh', header, cookie: cookieKonsol() })
    expect(r.status).toBe(403)
    expect(gateway).not.toHaveBeenCalled()
  })
})

describe('/api/admin/sesi — serah terima token login', () => {
  const badan = (sub = ADMIN_ID) => JSON.stringify({
    access_token: jwt({ typ: 'access', sub, tv: 1, exp: 4102444800 }),
    refresh_token: jwt({ typ: 'refresh', sub, tv: 1, exp: 4102444800 }),
  })
  const kirim = (header: Record<string, string>, b = badan()) =>
    panggil(h.sesi, { metode: 'POST', path: '/api/admin/sesi', header: { ...header, 'content-type': 'application/json' }, cookie: { ca_konsol_ikat: IKAT }, badan: b })

  it('kontrol: /me id = sub → 200, cookie sesi dipasang, `ikat` DIGANTI nilai baru', async () => {
    gateway.mockImplementation(async () => json(200, { data: { id: ADMIN_ID, email: ADMIN_EMAIL, is_active: true } }))
    const r = await kirim(headerKonsol())
    expect(r.status).toBe(200)
    expect(gateway).toHaveBeenCalledTimes(1)
    expect(nilaiSetCookie(r, 'ca_konsol_akses')).toBeTruthy()
    const ikatBaru = nilaiSetCookie(r, 'ca_konsol_ikat')
    expect(ikatBaru).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(ikatBaru).not.toBe(IKAT)
  })

  it('/me milik admin lain (id ≠ sub token) → 401, tidak ada cookie sesi', async () => {
    gateway.mockImplementation(async () => json(200, { data: { id: '11111111-1111-4111-8111-111111111111', email: 'lain@coreasia.id', is_active: true } }))
    const r = await kirim(headerKonsol())
    expect(r.status).toBe(401)
    expect(nilaiSetCookie(r, 'ca_konsol_akses')).toBeUndefined()
    expect(nilaiSetCookie(r, 'ca_konsol_ikat')).toBeUndefined()
  })

  it.each(PENYUSUP)('%s → 403, gateway tidak dipanggil', async (_n, header) => {
    const r = await kirim(header)
    expect(r.status).toBe(403)
    expect(gateway).not.toHaveBeenCalled()
    expect(nilaiSetCookie(r, 'ca_konsol_akses')).toBeUndefined()
  })
})

describe('/api/admin/logout — cabut sesi CashFlow per id DAN per email (F3)', () => {
  it('pemilik dari /me: id + email → sesi per id dan email, kasus per id saja; cookie dihapus', async () => {
    gateway.mockImplementation(async () => json(200, { data: { id: ADMIN_ID.toUpperCase(), email: ADMIN_EMAIL } }))
    const r = await panggil(h.logout, { metode: 'POST', path: '/api/admin/logout', header: headerKonsol(), cookie: cookieKonsol() })
    expect(r.status).toBe(200)
    expect(r.json).toMatchObject({ data: { ok: true, cashflow: 'dicabut' } })
    expect(sb.rpc.map(x => [x.nama, Object.values(x.arg)[0]])).toEqual([
      ['admin_konsol_sesi_cabut_admin', ADMIN_ID],
      ['admin_konsol_sesi_cabut_pelaku', ADMIN_EMAIL],
      ['admin_kasus_tutup_admin', ADMIN_ID],
    ])
    expect(nilaiSetCookie(r, 'ca_konsol_akses')).toBe('')
  })

  it('akses habis → pemilik dari user hasil refresh', async () => {
    gateway.mockImplementation(async () => json(200, { data: { access_token: AKSES, refresh_token: AKSES, user: { id: ADMIN_ID, email: ADMIN_EMAIL } } }))
    await panggil(h.logout, { metode: 'POST', path: '/api/admin/logout', header: headerKonsol(), cookie: tanpa(cookieKonsol(), 'ca_konsol_akses') })
    expect(sb.rpc.map(x => x.nama)).toContain('admin_konsol_sesi_cabut_admin')
    expect(sb.rpc.map(x => x.nama)).toContain('admin_konsol_sesi_cabut_pelaku')
  })

  it('RPC per id gagal → cashflow: gagal (tetap keluar, 200)', async () => {
    gateway.mockImplementation(async () => json(200, { data: { id: ADMIN_ID, email: ADMIN_EMAIL } }))
    sb.rpcGagal.add('admin_konsol_sesi_cabut_admin')
    const r = await panggil(h.logout, { metode: 'POST', path: '/api/admin/logout', header: headerKonsol(), cookie: cookieKonsol() })
    expect(r).toMatchObject({ status: 200, json: { data: { cashflow: 'gagal' } } })
  })
})

describe('DELETE /api/cashflow/sesi — semua sesi orang yang sama', () => {
  const hapus = () => panggil(h.cfHapus, {
    metode: 'DELETE', path: '/api/cashflow/sesi',
    header: { authorization: `Bearer ${jwt({ session_id: '22222222-2222-4222-8222-222222222222' })}` },
  })

  it('baris sesi ber-admin_gw_id → sesi dicabut per id DAN per email, kasus ditutup per id saja', async () => {
    sb.baris = { admin_gw_id: ADMIN_ID, pelaku: ADMIN_EMAIL }
    const r = await hapus()
    expect(r.status).toBe(200)
    expect(sb.rpc.map(x => x.nama)).toEqual([
      'admin_konsol_sesi_cabut_admin', 'admin_konsol_sesi_cabut_pelaku', 'admin_kasus_tutup_admin',
    ])
    expect(sb.keluar).toHaveLength(1)
  })

  it('sesi lama (tanpa admin_gw_id) → jalur email saja', async () => {
    sb.baris = { admin_gw_id: null, pelaku: ADMIN_EMAIL }
    await hapus()
    expect(sb.rpc.map(x => x.nama)).toEqual(['admin_konsol_sesi_cabut_pelaku', 'admin_kasus_tutup_pelaku'])
  })

  it('pencabutan per id gagal → 502 cabut-gagal (tidak pura-pura berhasil)', async () => {
    sb.baris = { admin_gw_id: ADMIN_ID, pelaku: ADMIN_EMAIL }
    sb.rpcGagal.add('admin_konsol_sesi_cabut_admin')
    const r = await hapus()
    expect(r).toMatchObject({ status: 502, statusMessage: 'cabut-gagal' })
  })

  it('tanpa baris → sesi ini saja', async () => {
    await hapus()
    expect(sb.rpc.map(x => x.nama)).toEqual(['admin_konsol_sesi_cabut'])
  })
})

describe('plugin konsol-csp — token ikatan hanya untuk navigasi dokumen console', () => {
  type KaitHtml = (html: { head: string[] }, ctx: { event: unknown }) => void
  let kaitHtml: KaitHtml
  beforeAll(async () => {
    const plugin = (await import('../../server/plugins/konsol-csp')).default as unknown as (n: unknown) => void
    const kait = new Map<string, KaitHtml>()
    plugin({ hooks: { hook: (nama: string, f: KaitHtml) => kait.set(nama, f) } })
    kaitHtml = kait.get('render:html')!
  })
  /** Render head untuk satu permintaan: hook dijalankan dengan event h3 asli. */
  async function head(path: string, header: Record<string, string>) {
    let hasil: string[] = []
    const r = await panggil((await import('h3')).defineEventHandler((event) => {
      const html = { head: ['<meta charset="utf-8">'] }
      kaitHtml(html, { event })
      hasil = html.head
      return 'ok'
    }), { path, header, cookie: { ca_konsol_ikat: IKAT } })
    return { head: hasil.join(''), r }
  }

  it('document + navigate di /console → <meta ca-konsol-ikat> berisi token untuk cookie ikat', async () => {
    const { head: isi } = await head('/console/cashflow', { 'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate' })
    expect(isi).toContain(`<meta name="ca-konsol-ikat" content="${tokenIkat(IKAT)}">`)
  })

  it.each([
    ['fetch dari JS (dest empty)', { 'sec-fetch-dest': 'empty', 'sec-fetch-mode': 'cors' }],
    ['iframe', { 'sec-fetch-dest': 'iframe', 'sec-fetch-mode': 'navigate' }],
    ['document tanpa navigate', { 'sec-fetch-dest': 'document', 'sec-fetch-mode': 'no-cors' }],
    ['tanpa Sec-Fetch-*', {}],
  ])('%s → tanpa token ikatan', async (_n, header) => {
    const { head: isi } = await head('/console/cashflow', header as Record<string, string>)
    expect(isi).not.toContain('ca-konsol-ikat')
  })

  it('halaman publik tidak pernah diberi token', async () => {
    const { head: isi } = await head('/about', { 'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate' })
    expect(isi).not.toContain('ca-konsol-ikat')
  })
})
