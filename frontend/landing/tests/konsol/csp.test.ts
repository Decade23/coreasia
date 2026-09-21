/**
 * CSP console: setiap skrip sebaris yang dapat dieksekusi di HTML diberi hash
 * yang benar, tanpa 'unsafe-inline' dan tanpa domain GTM/iklan.
 */
import { webcrypto } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { bersihkanHeadKonsol, cspKonsol, hashSkrip, skripSebaris } from '../../server/lib/konsol/csp'
import { originHttp } from '../../utils/konsol'
import { HEADER_KEAMANAN_DASAR, HEADER_KONSOL } from '../../server/lib/konsol/header'

/** Hash lewat WebCrypto (jalur implementasi berbeda dari node:crypto createHash). */
async function hashWebCrypto(isi: string) {
  const digest = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(isi))
  return `'sha256-${Buffer.from(digest).toString('base64')}'`
}

const KONFIG = 'window.__NUXT__={};window.__NUXT__.config={public:{a:"b"},app:{baseURL:"/"}}'
const HTML = `<!DOCTYPE html><html><head>
<link rel="preconnect" href="https://www.googletagmanager.com"><link rel="dns-prefetch" href="https://www.googletagmanager.com">
<link rel="stylesheet" href="/_nuxt/entry.css">
<script type="module" src="/_nuxt/entry.js" crossorigin></script>
<script id="unhead:payload" type="application/json">{"title":"CoreAsia"}</script>
<script type="application/ld+json">{"@type":"Organization"}</script>
<script>window.__NUXT_SITE_CONFIG__={a:1}</script>
</head><body><div id="__nuxt"></div>
<script type="application/json" data-nuxt-data="nuxt-app" id="__NUXT_DATA__">[{"serverRendered":1},false]</script>
<script>${KONFIG}</script>
<script type="module">import('/x.js')</script>
<script type='text/javascript'>var q=1</script>
<script src=/_nuxt/b.js></script>
</body></html>`

describe('skripSebaris', () => {
  it('hanya skrip sebaris yang dapat dieksekusi (tanpa src, tipe JS)', () => {
    expect(skripSebaris(HTML)).toEqual([
      'window.__NUXT_SITE_CONFIG__={a:1}',
      KONFIG,
      "import('/x.js')",
      'var q=1',
    ])
  })
})

describe('hashSkrip', () => {
  it('sama dengan sha256 base64 WebCrypto atas teks persis', async () => {
    for (const isi of skripSebaris(HTML)) expect(hashSkrip(isi)).toBe(await hashWebCrypto(isi))
  })
  it('menormalkan CRLF seperti pengurai HTML', async () => {
    expect(hashSkrip('a\r\nb\rc')).toBe(await hashWebCrypto('a\nb\nc'))
  })
  it('spasi di awal/akhir ikut dihitung (tidak dipangkas)', () => {
    expect(hashSkrip(' x')).not.toBe(hashSkrip('x'))
  })
})

describe('cspKonsol', () => {
  const csp = cspKonsol(HTML, { supabaseUrl: 'https://abc.supabase.co/rest/v1' })
  const direktif = Object.fromEntries(csp.split('; ').map((d) => {
    const [nama, ...nilai] = d.split(' ')
    return [nama, nilai]
  }))

  it('script-src: self + hash setiap skrip sebaris, TANPA unsafe-inline/eval dan tanpa host luar', async () => {
    const hash = await Promise.all(skripSebaris(HTML).map(hashWebCrypto))
    expect(direktif['script-src']).toEqual(["'self'", ...hash])
    expect(csp).not.toMatch(/unsafe-inline'[^;]*;?\s*$/)
    expect(direktif['script-src']).not.toContain("'unsafe-inline'")
    expect(direktif['script-src']).not.toContain("'unsafe-eval'")
    expect(direktif['script-src-attr']).toEqual(["'none'"])
  })

  it('tanpa domain GTM/Analytics/iklan di mana pun', () => {
    expect(csp).not.toMatch(/googletagmanager|google-analytics|googleadservices|doubleclick|google\.com/)
  })

  it('connect-src: self (BFF) + origin Supabase CashFlow saja, tanpa gateway langsung', () => {
    expect(direktif['connect-src']).toEqual(["'self'", 'https://abc.supabase.co'])
    expect(csp).not.toMatch(/api\.coreasia\.id|localhost:8084|\*\.coreasia\.id/)
  })

  it('direktif pengaman lain ada', () => {
    expect(direktif['object-src']).toEqual(["'none'"])
    expect(direktif['base-uri']).toEqual(["'self'"])
    // 'none', bukan 'self': halaman publik satu-asal (GTM) tidak boleh
    // membingkai console lalu membaca DOM-nya.
    expect(direktif['frame-ancestors']).toEqual(["'none'"])
    expect(direktif['default-src']).toEqual(["'self'"])
  })

  it('Supabase tidak dikonfigurasi → connect-src hanya self; URL rusak diabaikan', () => {
    expect(cspKonsol('', {})).toContain("connect-src 'self';")
    expect(originHttp('bukan url')).toBeNull()
    expect(originHttp('javascript:alert(1)')).toBeNull()
    expect(cspKonsol('', { gatewayUrl: 'javascript:alert(1)' })).toContain("connect-src 'self';")
  })

  it('dokumen /console/login: connect-src self + origin gateway publik SAJA (tanpa Supabase, tanpa GTM)', () => {
    const login = cspKonsol(HTML, { gatewayUrl: 'https://api.coreasia.id/api' })
    const d = Object.fromEntries(login.split('; ').map((x) => {
      const [nama, ...nilai] = x.split(' ')
      return [nama, nilai]
    }))
    expect(d['connect-src']).toEqual(["'self'", 'https://api.coreasia.id'])
    expect(d['script-src']).not.toContain("'unsafe-inline'")
    expect(d['frame-ancestors']).toEqual(["'none'"])
    expect(login).not.toMatch(/supabase|googletagmanager|google-analytics/)
    // Origin saja: path /api tidak ikut (CSP host-source tanpa path = seluruh origin).
    expect(login).not.toContain('api.coreasia.id/api')
  })

  it('hash tidak berulang untuk skrip yang sama', () => {
    const dua = cspKonsol('<script>a()</script><script>a()</script>')
    expect(dua.match(/sha256-/g)).toHaveLength(1)
  })
})

describe('bersihkanHeadKonsol', () => {
  it('membuang preconnect/dns-prefetch GTM, sisanya utuh', () => {
    const head = '<meta charset="utf-8"><link rel="preconnect" href="https://www.googletagmanager.com"><link rel="dns-prefetch" href="https://www.googletagmanager.com"><link rel="icon" href="/favicon.ico">'
    expect(bersihkanHeadKonsol(head)).toBe('<meta charset="utf-8"><link rel="icon" href="/favicon.ico">')
  })
})

describe('HEADER_KONSOL (routeRules /console/**)', () => {
  it('menyalin semua header dasar /** (di Vercel aturan pertama yang cocok menang)', () => {
    for (const nama of Object.keys(HEADER_KEAMANAN_DASAR)) expect(HEADER_KONSOL).toHaveProperty(nama)
    expect(HEADER_KONSOL['Strict-Transport-Security']).toBe(HEADER_KEAMANAN_DASAR['Strict-Transport-Security'])
  })

  it('tidak boleh dibingkai siapa pun dan terputus dari opener halaman publik', () => {
    expect(HEADER_KONSOL['X-Frame-Options']).toBe('DENY')
    expect(HEADER_KONSOL['Cross-Origin-Opener-Policy']).toBe('same-origin')
    expect(HEADER_KONSOL['X-Robots-Tag']).toContain('noindex')
  })

  it('TANPA CSP statis (CSP ber-hash dipasang fungsi per jawaban)', () => {
    expect(Object.keys(HEADER_KONSOL).map((k) => k.toLowerCase())).not.toContain('content-security-policy')
  })

  it('header dasar halaman publik tidak ikut diperketat', () => {
    expect(HEADER_KEAMANAN_DASAR['X-Frame-Options']).toBe('SAMEORIGIN')
    expect(HEADER_KEAMANAN_DASAR).not.toHaveProperty('Cross-Origin-Opener-Policy')
  })
})
