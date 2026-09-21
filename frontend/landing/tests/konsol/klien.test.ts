/**
 * Pembantu klien console (utils/konsol.ts): jalur console, deteksi GTM/iklan,
 * penahan loop muat ulang, dan penghapusan cookie token lama.
 */
import { describe, expect, it } from 'vitest'
import {
  bolehMuatUlang,
  COOKIE_LAMA_KONSOL,
  detikDariPesan,
  galatDari,
  galatJaringan,
  halamanLoginKonsol,
  hapusCookieLama,
  JEDA_MUAT_ULANG_MS,
  jalurKonsol,
  jenisDokumen,
  kanonKonsol,
  KUNCI_MUAT_ULANG,
  menitTunggu,
  pesanKelolaAdmin,
  pesanLogin,
  pihakKetigaTermuat,
} from '../../utils/konsol'

describe('jalurKonsol', () => {
  it.each(['/console', '/console/', '/console/login', '/console/cashflow/pengguna?x=1', '/console#a'])('%s = console', (p) => {
    expect(jalurKonsol(p)).toBe(true)
  })
  // vue-router tidak peka huruf: varian ini tetap merender halaman console,
  // jadi penjaga GTM/iklan/CSP juga harus menganggapnya console.
  it.each(['/Console/login', '/CONSOLE', '/cOnSoLe/cashflow', '/%63onsole/login', '/%43ONSOLE'])('%s = console (huruf/encoding)', (p) => {
    expect(jalurKonsol(p)).toBe(true)
  })
  it.each(['/', '/consoles', '/konsol', '/api/gw/admin', '/artikel/console', '/%E0%A4%A', '/Consoles'])('%s bukan console', (p) => {
    expect(jalurKonsol(p)).toBe(false)
  })
})

describe('kanonKonsol — 301 ke huruf kecil sebelum renderer', () => {
  it.each([
    ['/Console/login', '/console/login'],
    ['/CONSOLE', '/console'],
    ['/%63onsole/login?ke=/console/users', '/console/login?ke=/console/users'],
    ['/Console/cashflow/pengguna/ABC-1?x=Y#z', '/console/cashflow/pengguna/ABC-1?x=Y#z'],
  ])('%s → %s (hanya segmen pertama; id & query utuh)', (masuk, keluar) => {
    expect(kanonKonsol(masuk)).toBe(keluar)
  })
  it.each(['/console', '/console/login', '/about', '/Consoles/x', '/'])('%s tidak dialihkan', (p) => {
    expect(kanonKonsol(p)).toBeNull()
  })
})

describe('jenisDokumen — publik · konsol · login', () => {
  it.each(['/console/login', '/console/login/', '/console/login?ke=/console/users', '/Console/Login', '/console/%4Cogin'])('%s = login', (p) => {
    expect(halamanLoginKonsol(p)).toBe(true)
    expect(jenisDokumen(p)).toBe('login')
  })
  it.each(['/console', '/console/', '/console/users', '/console/login/x', '/console/logins', '/console/cashflow/masuk'])('%s = konsol', (p) => {
    expect(halamanLoginKonsol(p)).toBe(false)
    expect(jenisDokumen(p)).toBe('konsol')
  })
  it.each(['/', '/about', '/login', '/artikel/console/login'])('%s = publik', (p) => {
    expect(jenisDokumen(p)).toBe('publik')
  })
})

describe('galat login & gateway', () => {
  const galatFetch = (status: number | undefined, data?: unknown, header: Record<string, string> = {}) => ({
    status,
    data,
    response: status === undefined ? undefined : { status, headers: new Headers(header) },
  })

  it('tanpa jawaban HTTP (jaringan, CORS dari 522 Cloudflare, habis waktu) = status 0', () => {
    const g = galatDari(new TypeError('Failed to fetch'))
    expect(g).toMatchObject({ status: 0, kode: 'JARINGAN', tunggu: null })
    expect(galatJaringan(g)).toBe(true)
  })

  it('5xx/52x = tidak terjangkau; 503 punya pesan sendiri; 4xx bukan', () => {
    for (const s of [500, 502, 504, 520, 522]) expect(galatJaringan({ status: s })).toBe(true)
    for (const s of [503, 400, 401, 403, 423, 429]) expect(galatJaringan({ status: s })).toBe(false)
  })

  it('429: Retry-After dipakai bila terbaca, selain itu menit dari pesan gateway', () => {
    const berheader = galatDari(galatFetch(429, { errors: { code: 'TOO_MANY_REQUESTS', message: 'x' } }, { 'retry-after': '120' }))
    expect(berheader.tunggu).toBe(120)
    const tanpaHeader = galatDari(galatFetch(429, { errors: { message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' } }))
    expect(tanpaHeader.tunggu).toBe(900)
    expect(menitTunggu(tanpaHeader)).toBe(15)
    expect(menitTunggu(galatDari(galatFetch(429, { errors: { message: 'Terlalu banyak.' } })))).toBeNull()
  })

  it('detikDariPesan', () => {
    expect(detikDariPesan('Coba lagi dalam 3 menit.')).toBe(180)
    expect(detikDariPesan('tanpa angka')).toBeNull()
    expect(detikDariPesan('0 menit')).toBeNull()
    expect(detikDariPesan(null)).toBeNull()
  })

  it('pesanLogin: "periksa email dan password" HANYA untuk 401 gateway', () => {
    const k = (g: Parameters<typeof pesanLogin>[0]) => pesanLogin(g, 'login.failed')
    expect(k({ status: 0, kode: 'JARINGAN', pesan: '', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.unreachable' })
    expect(k({ status: 522, kode: 'HTTP_522', pesan: '', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.unreachable' })
    expect(k({ status: 500, kode: 'INTERNAL_ERROR', pesan: 'x', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.unreachable' })
    expect(k({ status: 502, kode: 'GATEWAY_UNREACHABLE', pesan: 'x', tunggu: null, sumber: 'console' })).toEqual({ kunci: 'login.unreachable' })
    expect(k({ status: 503, kode: 'SERVICE_UNAVAILABLE', pesan: 'x', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.unavailable' })
    expect(k({ status: 401, kode: 'UNAUTHORIZED', pesan: 'Email atau password salah', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.failed' })
    expect(k({ status: 429, kode: 'TOO_MANY_REQUESTS', pesan: '', tunggu: 900, sumber: 'gateway' })).toEqual({ kunci: 'login.tooMany', param: { menit: 15 } })
    expect(k({ status: 429, kode: 'TOO_MANY_REQUESTS', pesan: '', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.tooManyLater' })
    expect(k({ status: 423, kode: 'TOTP_LOCKED', pesan: 'x', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.totpLocked' })
    expect(k({ status: 401, kode: 'TOTP_INVALID', pesan: 'x', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.totpInvalid' })
    expect(k({ status: 401, kode: 'MFA_CHALLENGE_INVALID', pesan: 'x', tunggu: null, sumber: 'gateway' })).toEqual({ kunci: 'login.totpExpired' })
    expect(k({ status: 403, kode: 'HTTP_403', pesan: 'ikatan', tunggu: null, sumber: 'console' })).toEqual({ kunci: 'login.muatUlang' })
    // Gateway menerima sandi, serah terima ke BFF ditolak: bukan salah sandi.
    expect(k({ status: 401, kode: 'UNAUTHORIZED', pesan: 'x', tunggu: null, sumber: 'console' })).toEqual({ kunci: 'login.sesiGagal' })
    expect(k({ status: 400, kode: 'VALIDATION_FAILED', pesan: 'Email tidak valid', tunggu: null, sumber: 'gateway' })).toEqual({ teks: 'Email tidak valid' })
    expect(k(null)).toEqual({ kunci: 'login.failed' })
  })
})

describe('pihakKetigaTermuat', () => {
  const tanpaSkrip = { querySelector: () => null }
  it('bersih', () => {
    expect(pihakKetigaTermuat({ document: tanpaSkrip })).toBe(false)
  })
  it('dataLayer, gtag, atau google_tag_manager', () => {
    expect(pihakKetigaTermuat({ dataLayer: [], document: tanpaSkrip })).toBe(true)
    expect(pihakKetigaTermuat({ gtag: () => {}, document: tanpaSkrip })).toBe(true)
    expect(pihakKetigaTermuat({ google_tag_manager: {}, document: tanpaSkrip })).toBe(true)
  })
  it('tag <script> googletagmanager di DOM', () => {
    const selektor: string[] = []
    const ada = pihakKetigaTermuat({ document: { querySelector: (s: string) => { selektor.push(s); return {} } } })
    expect(ada).toBe(true)
    expect(selektor[0]).toContain('googletagmanager.com')
  })
})

describe('bolehMuatUlang — penahan loop', () => {
  const simpanan = () => {
    const isi = new Map<string, string>()
    return { getItem: (k: string) => isi.get(k) ?? null, setItem: (k: string, v: string) => { isi.set(k, v) }, isi }
  }
  it('pertama boleh, kedua dalam jeda ditahan, sesudah jeda boleh lagi', () => {
    const s = simpanan()
    expect(bolehMuatUlang(s, 1_000)).toBe(true)
    expect(s.isi.get(KUNCI_MUAT_ULANG)).toBe('1000')
    expect(bolehMuatUlang(s, 1_000 + JEDA_MUAT_ULANG_MS - 1)).toBe(false)
    expect(bolehMuatUlang(s, 1_000 + JEDA_MUAT_ULANG_MS)).toBe(true)
  })
  it('penyimpanan tidak tersedia/melempar → tidak memuat ulang', () => {
    expect(bolehMuatUlang(null, 1)).toBe(false)
    expect(bolehMuatUlang({ getItem: () => { throw new Error('diblokir') }, setItem: () => {} }, 1)).toBe(false)
  })
})

describe('hapusCookieLama', () => {
  /** document.cookie palsu: baca = daftar cookie, tulis = dicatat. */
  const dokumen = (awal: string) => {
    const tulis: string[] = []
    return {
      tulis,
      get cookie() { return awal },
      set cookie(v: string) { tulis.push(v) },
    }
  }

  it('mengedaluwarsakan auth_admin_token & refresh_admin_token yang ada (Path=/)', () => {
    const doc = dokumen('coreasia-theme=dark; auth_admin_token=eyJ.a.b; refresh_admin_token=eyJ.c.d')
    expect(hapusCookieLama(doc, true)).toEqual([...COOKIE_LAMA_KONSOL])
    expect(doc.tulis).toHaveLength(2)
    for (const [i, nama] of COOKIE_LAMA_KONSOL.entries()) {
      expect(doc.tulis[i]).toMatch(new RegExp(`^${nama}=;`))
      expect(doc.tulis[i]).toContain('Max-Age=0')
      expect(doc.tulis[i]).toContain('Expires=Thu, 01 Jan 1970')
      expect(doc.tulis[i]).toContain('Path=/')
      expect(doc.tulis[i]).toContain('Secure')
    }
  })

  it('http: tanpa Secure; tidak menyentuh cookie lain atau yang tidak ada', () => {
    const doc = dokumen('coreasia-theme=light; refresh_admin_token=x')
    expect(hapusCookieLama(doc, false)).toEqual(['refresh_admin_token'])
    expect(doc.tulis).toHaveLength(1)
    expect(doc.tulis[0]).not.toContain('Secure')
    expect(hapusCookieLama(dokumen('coreasia-theme=light'), false)).toEqual([])
  })

  it('nama mirip tidak ikut terhapus', () => {
    const doc = dokumen('xauth_admin_token=1; auth_admin_token_lain=2')
    expect(hapusCookieLama(doc, false)).toEqual([])
  })
})

describe('pesanKelolaAdmin — halaman Users', () => {
  const g = (status: number, kode: string, pesan = '', tunggu: number | null = null) => ({ status, kode, pesan, tunggu })
  it('kode gateway sesi kuat → pesan jelas', () => {
    expect(pesanKelolaAdmin(g(400, 'CURRENT_PASSWORD_REQUIRED'), 'update')).toEqual({ kunci: 'users.errors.currentPasswordRequired' })
    expect(pesanKelolaAdmin(g(400, 'PASSWORD_INVALID'), 'update')).toEqual({ kunci: 'users.errors.currentPasswordWrong' })
    expect(pesanKelolaAdmin(g(403, 'MFA_REQUIRED'), 'create')).toEqual({ kunci: 'users.errors.mfaRequired' })
    expect(pesanKelolaAdmin(g(403, 'MFA_ENROLLMENT_TOO_RECENT'), 'delete')).toEqual({ kunci: 'users.errors.mfaTooRecent' })
    expect(pesanKelolaAdmin(g(423, 'TOTP_LOCKED'), 'update')).toEqual({ kunci: 'users.errors.totpLocked' })
    expect(pesanKelolaAdmin(g(423, 'HTTP_423'), 'update')).toEqual({ kunci: 'users.errors.totpLocked' })
  })
  it('409: create = email terdaftar; update/delete = baris berubah', () => {
    expect(pesanKelolaAdmin(g(409, 'CONFLICT', 'Email sudah terdaftar'), 'create')).toEqual({ kunci: 'users.errors.emailTerdaftar' })
    expect(pesanKelolaAdmin(g(409, 'CONFLICT', 'x'), 'update')).toEqual({ kunci: 'users.errors.berubah' })
  })
  it('429 dengan/tanpa menit; lainnya pesan gateway atau null', () => {
    expect(pesanKelolaAdmin(g(429, 'TOO_MANY_REQUESTS', '', 300), 'update')).toEqual({ kunci: 'users.errors.tooMany', param: { menit: 5 } })
    expect(pesanKelolaAdmin(g(429, 'TOO_MANY_REQUESTS'), 'update')).toEqual({ kunci: 'users.errors.tooManyLater' })
    expect(pesanKelolaAdmin(g(403, 'FORBIDDEN', 'Tidak punya izin'), 'update')).toEqual({ teks: 'Tidak punya izin' })
    expect(pesanKelolaAdmin(g(0, 'JARINGAN'), 'update')).toBeNull()
  })
})
