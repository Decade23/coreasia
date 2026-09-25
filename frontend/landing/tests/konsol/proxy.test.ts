/**
 * Inti proxy console → gateway: header yang diteruskan, refresh sekali saat
 * 401, penghapusan cookie saat refresh ditolak, rute pengakhir sesi, dan
 * penerusan jawaban (status asli, biner, tanpa Set-Cookie gateway).
 */
import { describe, expect, it } from 'vitest'
import { rakitTujuan } from '../../server/lib/konsol/jalur'
import { ubahAkunSendiri, pemilikToken, HEADER_KLIEN_IP, saringHeaderKeluar, saringHeaderMasuk, segarkanToken, teruskan, type FetchGateway } from '../../server/lib/konsol/proxy'

const GW = 'http://gw.test/api'
const jwt = (klaim: Record<string, unknown>) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(klaim)).toString('base64url')}.t`
const AKSES = jwt({ typ: 'access', email: 'admin@coreasia.id', exp: 4102444800 })
const SEGAR = jwt({ typ: 'refresh', exp: 4102444800 })
const AKSES_BARU = jwt({ typ: 'access', email: 'admin@coreasia.id', v: 2, exp: 4102444800 })
const SEGAR_BARU = jwt({ typ: 'refresh', v: 2, exp: 4102444800 })

interface Panggilan { url: string; init: RequestInit }

/** Gateway palsu: `jawab` menerima panggilan ke-n dan memulangkan Response. */
function gatewayPalsu(jawab: (p: Panggilan, n: number) => Response) {
  const log: Panggilan[] = []
  const fetch: FetchGateway = async (url, init) => {
    const p = { url, init }
    log.push(p)
    return jawab(p, log.length)
  }
  return { fetch, log }
}

const json = (status: number, isi: unknown, header: Record<string, string> = {}) =>
  new Response(JSON.stringify(isi), { status, headers: { 'content-type': 'application/json', ...header } })

const bearer = (p: Panggilan) => new Headers(p.init.headers).get('authorization')

const minta = (over: Partial<Parameters<typeof teruskan>[0]> = {}) => ({
  metode: 'GET',
  jalur: 'admin/articles',
  tujuan: rakitTujuan(GW, 'admin/articles', 'page=1')!,
  header: new Headers({ accept: 'application/json' }),
  akses: AKSES,
  segar: SEGAR,
  ...over,
})

describe('saringHeaderMasuk — cookie, Host, hop-by-hop tidak diteruskan', () => {
  it('hanya daftar putih', () => {
    const h = saringHeaderMasuk(new Headers({
      accept: 'application/json',
      'content-type': 'multipart/form-data; boundary=abc',
      'accept-language': 'id',
      cookie: '__Host-Http-ca_konsol_akses=rahasia',
      host: 'coreasia.id',
      connection: 'keep-alive',
      'keep-alive': 'timeout=5',
      'transfer-encoding': 'chunked',
      'x-forwarded-for': '1.2.3.4',
      authorization: 'Bearer dari-peramban',
      'x-console': '1',
      origin: 'https://coreasia.id',
      // Karangan peramban: IP yang dilaporkan ke gateway hanya dari BFF sendiri.
      'x-konsol-klien-ip': '6.6.6.6',
    }))
    expect([...h.keys()].sort()).toEqual(['accept', 'accept-language', 'content-type'])
    expect(h.get('content-type')).toBe('multipart/form-data; boundary=abc')
  })
})

describe('saringHeaderKeluar — jawaban gateway ke peramban', () => {
  it('Set-Cookie & content-encoding gateway dibuang, no-store dipasang', () => {
    const h = saringHeaderKeluar(new Headers({
      'content-type': 'image/png',
      'content-disposition': 'attachment; filename="a.png"',
      'retry-after': '120',
      'set-cookie': 'auth_admin_token=x; HttpOnly',
      'content-encoding': 'gzip',
      'content-length': '999',
      'access-control-allow-origin': '*',
    }))
    expect(h.get('set-cookie')).toBeNull()
    expect(h.get('content-encoding')).toBeNull()
    expect(h.get('content-length')).toBeNull()
    expect(h.get('access-control-allow-origin')).toBeNull()
    expect(h.get('content-type')).toBe('image/png')
    expect(h.get('content-disposition')).toBe('attachment; filename="a.png"')
    expect(h.get('retry-after')).toBe('120')
    expect(h.get('cache-control')).toBe('no-store')
  })
})

describe('teruskan — alur normal', () => {
  it('cookie akses menjadi Bearer; tujuan, metode, dan badan mentah diteruskan', async () => {
    const gw = gatewayPalsu(() => json(200, { data: [] }))
    const badan = new TextEncoder().encode('--abc\r\nContent-Disposition: form-data; name="file"\r\n\r\nPNG\r\n--abc--')
    const hasil = await teruskan(minta({
      metode: 'POST',
      jalur: 'admin/upload',
      tujuan: rakitTujuan(GW, 'admin/upload', '')!,
      header: saringHeaderMasuk(new Headers({ 'content-type': 'multipart/form-data; boundary=abc', cookie: 'x=y' })),
      body: badan,
    }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(gw.log).toHaveLength(1)
    expect(gw.log[0]!.url).toBe('http://gw.test/api/admin/upload')
    expect(gw.log[0]!.init.method).toBe('POST')
    expect(gw.log[0]!.init.redirect).toBe('manual')
    expect(bearer(gw.log[0]!)).toBe(`Bearer ${AKSES}`)
    expect(new Headers(gw.log[0]!.init.headers).get('cookie')).toBeNull()
    expect(gw.log[0]!.init.body).toBe(badan)
    expect(hasil.respons.status).toBe(200)
    expect(hasil.tokenBaru).toBeNull()
    expect(hasil.hapusCookie).toBe(false)
  })

  it('galat gateway diteruskan dengan status aslinya (403, 429 + Retry-After)', async () => {
    const gw403 = gatewayPalsu(() => json(403, { errors: { code: 'FORBIDDEN' } }))
    expect((await teruskan(minta(), { gatewayUrl: GW, fetch: gw403.fetch })).respons.status).toBe(403)
    const gw429 = gatewayPalsu(() => json(429, { errors: { code: 'TOO_MANY' } }, { 'retry-after': '300' }))
    const hasil = await teruskan(minta(), { gatewayUrl: GW, fetch: gw429.fetch })
    expect(hasil.respons.status).toBe(429)
    expect(hasil.respons.headers.get('retry-after')).toBe('300')
    expect(gw429.log).toHaveLength(1) // bukan 401: tidak ada refresh
  })

  it('jawaban biner diteruskan utuh', async () => {
    const bita = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 255, 1, 2])
    const gw = gatewayPalsu(() => new Response(bita, { status: 200, headers: { 'content-type': 'image/png' } }))
    const hasil = await teruskan(minta(), { gatewayUrl: GW, fetch: gw.fetch })
    expect(hasil.respons.headers.get('content-type')).toBe('image/png')
    expect(new Uint8Array(await hasil.respons.arrayBuffer())).toEqual(bita)
  })

  it('tanpa cookie sama sekali → 401 tanpa memanggil gateway', async () => {
    const gw = gatewayPalsu(() => json(200, {}))
    const hasil = await teruskan(minta({ akses: null, segar: null }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(hasil.respons.status).toBe(401)
    expect(gw.log).toHaveLength(0)
  })

  it('gateway tidak terjangkau → 502, cookie dibiarkan', async () => {
    const hasil = await teruskan(minta(), { gatewayUrl: GW, fetch: async () => { throw new TypeError('fetch failed') } })
    expect(hasil.respons.status).toBe(502)
    expect(hasil.hapusCookie).toBe(false)
  })
})

describe('teruskan — refresh sekali', () => {
  it('401 → refresh → ulangi dengan token baru; cookie baru dilaporkan', async () => {
    const gw = gatewayPalsu((p) => {
      if (p.url.endsWith('/admin/auth/refresh')) {
        expect(JSON.parse(String(p.init.body))).toEqual({ refresh_token: SEGAR })
        expect(new Headers(p.init.headers).get('authorization')).toBeNull()
        return json(200, { data: { access_token: AKSES_BARU, refresh_token: SEGAR_BARU, user: { email: 'admin@coreasia.id' } } })
      }
      return bearer(p) === `Bearer ${AKSES_BARU}` ? json(200, { data: ['ok'] }) : json(401, { errors: { code: 'UNAUTHORIZED' } })
    })
    const hasil = await teruskan(minta(), { gatewayUrl: GW, fetch: gw.fetch })
    expect(gw.log.map(p => p.url)).toEqual([
      'http://gw.test/api/admin/articles?page=1',
      'http://gw.test/api/admin/auth/refresh',
      'http://gw.test/api/admin/articles?page=1',
    ])
    expect(hasil.respons.status).toBe(200)
    expect(await hasil.respons.json()).toEqual({ data: ['ok'] })
    expect(hasil.tokenBaru).toEqual({ akses: AKSES_BARU, segar: SEGAR_BARU })
    expect(hasil.hapusCookie).toBe(false)
  })

  it('badan non-GET diulang utuh sesudah refresh', async () => {
    const badan = new TextEncoder().encode('{"title":"x"}')
    const gw = gatewayPalsu((p) => {
      if (p.url.endsWith('/admin/auth/refresh')) return json(200, { data: { access_token: AKSES_BARU, refresh_token: SEGAR_BARU } })
      return bearer(p) === `Bearer ${AKSES_BARU}` ? json(201, { data: { id: '1' } }) : json(401, {})
    })
    const hasil = await teruskan(minta({ metode: 'POST', body: badan }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(hasil.respons.status).toBe(201)
    expect(gw.log[2]!.init.body).toBe(badan)
  })

  it('refresh hanya SEKALI: 401 sesudah refresh diteruskan, tanpa putaran kedua', async () => {
    const gw = gatewayPalsu((p) => p.url.endsWith('/admin/auth/refresh')
      ? json(200, { data: { access_token: AKSES_BARU, refresh_token: SEGAR_BARU } })
      : json(401, { errors: { code: 'UNAUTHORIZED' } }))
    const hasil = await teruskan(minta(), { gatewayUrl: GW, fetch: gw.fetch })
    expect(gw.log).toHaveLength(3)
    expect(gw.log.filter(p => p.url.endsWith('/refresh'))).toHaveLength(1)
    expect(hasil.respons.status).toBe(401)
  })

  it('refresh ditolak (sesi dicabut) → 401 asli diteruskan dan cookie dihapus', async () => {
    const gw = gatewayPalsu((p) => p.url.endsWith('/admin/auth/refresh')
      ? json(401, { errors: { code: 'UNAUTHORIZED', message: 'Sesi sudah tidak berlaku' } })
      : json(401, { errors: { code: 'UNAUTHORIZED', message: 'asli' } }))
    const hasil = await teruskan(minta(), { gatewayUrl: GW, fetch: gw.fetch })
    expect(hasil.respons.status).toBe(401)
    expect((await hasil.respons.json()).errors.message).toBe('asli')
    expect(hasil.hapusCookie).toBe(true)
    expect(hasil.tokenBaru).toBeNull()
  })

  it('refresh gagal karena gateway (5xx) → cookie TIDAK dihapus', async () => {
    const gw = gatewayPalsu((p) => p.url.endsWith('/admin/auth/refresh') ? json(503, {}) : json(401, {}))
    const hasil = await teruskan(minta(), { gatewayUrl: GW, fetch: gw.fetch })
    expect(hasil.respons.status).toBe(401)
    expect(hasil.hapusCookie).toBe(false)
  })

  it('401 tanpa cookie segar → tidak ada refresh', async () => {
    const gw = gatewayPalsu(() => json(401, {}))
    const hasil = await teruskan(minta({ segar: null }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(gw.log).toHaveLength(1)
    expect(hasil.respons.status).toBe(401)
  })

  it('akses sudah dibuang peramban (kedaluwarsa) → refresh DULU, lalu satu permintaan', async () => {
    const gw = gatewayPalsu((p) => p.url.endsWith('/admin/auth/refresh')
      ? json(200, { data: { access_token: AKSES_BARU, refresh_token: SEGAR_BARU } })
      : json(200, { data: bearer(p) }))
    const hasil = await teruskan(minta({ akses: null }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(gw.log.map(p => p.url.split('/api/')[1])).toEqual(['admin/auth/refresh', 'admin/articles?page=1'])
    expect(await hasil.respons.json()).toEqual({ data: `Bearer ${AKSES_BARU}` })
    expect(hasil.tokenBaru).toEqual({ akses: AKSES_BARU, segar: SEGAR_BARU })
  })

  it('akses kedaluwarsa + refresh ditolak → 401 lokal, cookie dihapus', async () => {
    const gw = gatewayPalsu(() => json(401, {}))
    const hasil = await teruskan(minta({ akses: null }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(gw.log).toHaveLength(1)
    expect(hasil.respons.status).toBe(401)
    expect(hasil.hapusCookie).toBe(true)
  })
})

describe('teruskan — rute pengakhir sesi', () => {
  // Router Fiber gateway tidak peka huruf: varian huruf besar juga mengakhiri
  // sesi di gateway, jadi cookie & sesi CashFlow harus ikut dicabut.
  it.each([
    'admin/auth/logout-all',
    'admin/auth/totp/enable',
    'admin/auth/totp/disable',
    'admin/auth/LOGOUT-ALL',
    'admin/AUTH/Totp/Enable',
    'admin/Auth/totp/DISABLE',
  ])(
    '%s berhasil → cookie dihapus, pemilik token (id + email) dilaporkan',
    async (jalur) => {
      const gw = gatewayPalsu(() => new Response(null, { status: 204 }))
      const hasil = await teruskan(minta({ metode: 'POST', jalur, tujuan: rakitTujuan(GW, jalur, '')! }), { gatewayUrl: GW, fetch: gw.fetch })
      expect(hasil.respons.status).toBe(204)
      expect(hasil.hapusCookie).toBe(true)
      expect(hasil.tokenBaru).toBeNull()
      expect(hasil.pemilikSesiBerakhir?.email).toBe('admin@coreasia.id')
    },
  )

  it('gagal (kode salah 400) → cookie tetap', async () => {
    const jalur = 'admin/auth/totp/disable'
    const gw = gatewayPalsu(() => json(400, { errors: { code: 'TOTP_INVALID' } }))
    const hasil = await teruskan(minta({ metode: 'POST', jalur, tujuan: rakitTujuan(GW, jalur, '')! }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(hasil.respons.status).toBe(400)
    expect(hasil.hapusCookie).toBe(false)
    expect(hasil.pemilikSesiBerakhir).toBeNull()
  })
})

describe('teruskan — ganti password akun sendiri mengakhiri sesi', () => {
  const SUB = '0b6e7c1e-2a55-4d59-9c5f-0a8d2f9d1b11'
  const aksesMilik = jwt({ typ: 'access', sub: SUB, email: 'admin@coreasia.id', role: 'super_admin', exp: 4102444800 })
  const badan = (isi: unknown) => new TextEncoder().encode(JSON.stringify(isi))
  const put = (jalur: string, isi: unknown) =>
    minta({ metode: 'PUT', jalur, tujuan: rakitTujuan(GW, jalur, '')!, body: badan(isi), akses: aksesMilik })

  it('PUT admin/users/<id sendiri> {password} berhasil → cookie dihapus, sesi CashFlow dicabut', async () => {
    const gw = gatewayPalsu(() => json(200, { data: { id: SUB } }))
    const hasil = await teruskan(put(`admin/users/${SUB}`, { password: 'Baru-1234', current_password: 'x' }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(hasil.hapusCookie).toBe(true)
    // F3: id admin gateway (klaim sub) ikut dilaporkan — pencabutan per id.
    expect(hasil.pemilikSesiBerakhir).toEqual({ id: SUB, email: 'admin@coreasia.id' })
  })

  it('F3: ganti email / peran akun sendiri, atau menonaktifkannya → sesi berakhir', async () => {
    for (const isi of [{ email: 'baru@coreasia.id' }, { role: 'admin' }, { is_active: false }]) {
      const gw = gatewayPalsu(() => json(200, { data: { id: SUB } }))
      const hasil = await teruskan(put(`admin/users/${SUB}`, isi), { gatewayUrl: GW, fetch: gw.fetch })
      expect(hasil.hapusCookie, JSON.stringify(isi)).toBe(true)
      expect(hasil.pemilikSesiBerakhir, JSON.stringify(isi)).toEqual({ id: SUB, email: 'admin@coreasia.id' })
    }
  })

  it('bukan akhir sesi: admin lain, tanpa password, gagal, atau metode lain', async () => {
    const ok = () => gatewayPalsu(() => json(200, { data: {} }))
    const kasus = [
      put('admin/users/admin-lain', { password: 'Baru-1234' }),
      put(`admin/users/${SUB}`, { full_name: 'Nama', role: 'super_admin' }),
      // Form ubah selalu mengirim email: nilai yang sama (beda huruf) tidak mengakhiri sesi.
      put(`admin/users/${SUB}`, { full_name: 'Nama', email: 'ADMIN@coreasia.id', is_active: true }),
      put(`admin/users/${SUB}`, { password: '' }),
      minta({ metode: 'POST', jalur: `admin/users/${SUB}`, tujuan: rakitTujuan(GW, `admin/users/${SUB}`, '')!, body: badan({ password: 'x' }), akses: aksesMilik }),
    ]
    for (const k of kasus) {
      const hasil = await teruskan(k, { gatewayUrl: GW, fetch: ok().fetch })
      expect(hasil.hapusCookie).toBe(false)
      expect(hasil.pemilikSesiBerakhir).toBeNull()
    }
    const gagal = gatewayPalsu(() => json(400, { errors: { code: 'PASSWORD_INVALID' } }))
    const hasil = await teruskan(put(`admin/users/${SUB}`, { password: 'Baru-1234' }), { gatewayUrl: GW, fetch: gagal.fetch })
    expect(hasil.hapusCookie).toBe(false)
  })

  it('pemilikToken: id dari user_id (cadangan sub) yang berbentuk uuid, huruf kecil', () => {
    expect(pemilikToken(jwt({ user_id: SUB.toUpperCase(), sub: 'lain', email: ' a@b.id ' }))).toEqual({ id: SUB, email: 'a@b.id' })
    expect(pemilikToken(jwt({ sub: SUB }))).toEqual({ id: SUB, email: null })
    expect(pemilikToken(jwt({ sub: 'bukan-uuid', email: 'a@b.id' }))).toEqual({ id: null, email: 'a@b.id' })
    expect(pemilikToken(jwt({ sub: 'bukan-uuid' }))).toBeNull()
    expect(pemilikToken(null)).toBeNull()
  })

  it('ubahAkunSendiri: id tidak peka huruf, badan rusak aman', () => {
    expect(ubahAkunSendiri({ metode: 'put', jalur: `admin/USERS/${SUB.toUpperCase()}`, body: badan({ password: 'x' }) }, aksesMilik)).toBe(true)
    expect(ubahAkunSendiri({ metode: 'PUT', jalur: `admin/users/${SUB}`, body: new TextEncoder().encode('{rusak') }, aksesMilik)).toBe(false)
    expect(ubahAkunSendiri({ metode: 'PUT', jalur: `admin/users/${SUB}/x`, body: badan({ password: 'x' }) }, aksesMilik)).toBe(false)
    expect(ubahAkunSendiri({ metode: 'PUT', jalur: `admin/users/${SUB}`, body: badan({ password: 'x' }) }, null)).toBe(false)
  })
})

describe('X-Konsol-Klien-IP — IP klien yang dilaporkan BFF ke gateway', () => {
  it('dipasang dari konteks BFF di permintaan utama DAN refresh', async () => {
    const gw = gatewayPalsu((p, n) => n === 1 ? json(401, {}) : n === 2
      ? json(200, { data: { access_token: AKSES_BARU, refresh_token: SEGAR_BARU } })
      : json(200, { data: [] }))
    await teruskan(minta(), { gatewayUrl: GW, fetch: gw.fetch, klienIp: '203.0.113.7' })
    expect(gw.log).toHaveLength(3)
    for (const p of gw.log) expect(new Headers(p.init.headers).get(HEADER_KLIEN_IP)).toBe('203.0.113.7')
  })

  it('tanpa IP di konteks → tidak ada header, walau peramban mengirimnya', async () => {
    const gw = gatewayPalsu(() => json(200, { data: [] }))
    await teruskan(minta({ header: new Headers({ accept: 'application/json', [HEADER_KLIEN_IP]: '6.6.6.6' }) }), { gatewayUrl: GW, fetch: gw.fetch })
    expect(new Headers(gw.log[0]!.init.headers).get(HEADER_KLIEN_IP)).toBeNull()
  })
})

describe('segarkanToken', () => {
  it('jawaban 200 tanpa token lengkap dianggap gagal, bukan sukses', async () => {
    const hasil = await segarkanToken(SEGAR, { gatewayUrl: GW, fetch: async () => json(200, { data: { access_token: AKSES_BARU } }) })
    expect(hasil.status).toBe('gagal')
  })
})
