/**
 * Ikatan dokumen console: BFF hanya melayani dokumen /console yang diberi token
 * saat navigasi. Halaman publik satu-asal (GTM) lolos Sec-Fetch-Site, tetapi
 * tidak bisa memperoleh token ini.
 */
import { describe, expect, it } from 'vitest'
import { buatIkat, cocokIkatan, ikatSah, kunciIkatan, metaIkatan, navigasiDokumen, tokenIkatan } from '../../server/lib/konsol/ikatan'
import { bacaIkatanMeta, galatIkatan, META_IKATAN } from '../../utils/konsol'

const KUNCI = kunciIkatan({ khusus: 'k'.repeat(40) })!

describe('kunciIkatan', () => {
  it('kunci khusus ≥ 32 aksara didahulukan; pendek → turunan service key; keduanya kosong → null', () => {
    const khusus = kunciIkatan({ khusus: 'a'.repeat(32), cadangan: 'service' })
    const pendek = kunciIkatan({ khusus: 'pendek', cadangan: 'service' })
    const cadangan = kunciIkatan({ cadangan: 'service' })
    expect(khusus).toHaveLength(32)
    expect(pendek!.equals(cadangan!)).toBe(true)
    expect(khusus!.equals(cadangan!)).toBe(false)
    expect(kunciIkatan({})).toBeNull()
    expect(kunciIkatan({ khusus: '  ', cadangan: '' })).toBeNull()
  })

  it('HKDF: kunci turunan tidak sama dengan rahasia sumbernya', () => {
    const sumber = 's'.repeat(32)
    expect(kunciIkatan({ khusus: sumber })!.toString('utf8')).not.toBe(sumber)
  })
})

describe('token ikatan', () => {
  it('nilai ikat 32 byte acak base64url, unik', () => {
    const a = buatIkat()
    expect(ikatSah(a)).toBe(true)
    expect(a).toHaveLength(43)
    expect(buatIkat()).not.toBe(a)
  })

  it('cocok hanya untuk pasangan (kunci, ikat) yang sama', () => {
    const ikat = buatIkat()
    const token = tokenIkatan(KUNCI, ikat)
    expect(cocokIkatan(KUNCI, ikat, token)).toBe(true)
    // ikat lain (cookie ditimpa/ditanam) atau kunci lain → tidak cocok
    expect(cocokIkatan(KUNCI, buatIkat(), token)).toBe(false)
    expect(cocokIkatan(kunciIkatan({ khusus: 'z'.repeat(40) })!, ikat, token)).toBe(false)
    // token bukan nilai cookie: cookie saja tidak cukup
    expect(cocokIkatan(KUNCI, ikat, ikat)).toBe(false)
  })

  it('header/cookie cacat atau kosong → tidak cocok, tanpa melempar', () => {
    const ikat = buatIkat()
    for (const h of [null, undefined, '', 'x', `${tokenIkatan(KUNCI, ikat)}=`, 'a'.repeat(44)]) {
      expect(cocokIkatan(KUNCI, ikat, h)).toBe(false)
    }
    expect(cocokIkatan(KUNCI, null, tokenIkatan(KUNCI, ikat))).toBe(false)
    expect(cocokIkatan(KUNCI, 'bukan-ikat', tokenIkatan(KUNCI, ikat))).toBe(false)
  })
})

describe('navigasiDokumen — hanya navigasi dokumen puncak yang diberi token', () => {
  it('document + navigate → ya', () => {
    expect(navigasiDokumen({ dest: 'document', mode: 'navigate' })).toBe(true)
    expect(navigasiDokumen({ dest: 'Document', mode: 'NAVIGATE' })).toBe(true)
  })
  type Sec = { dest: string | null; mode: string | null }
  it.each<[Sec, string]>([
    [{ dest: 'empty', mode: 'cors' }, 'fetch() dari halaman publik'],
    [{ dest: 'empty', mode: 'same-origin' }, 'fetch satu-asal'],
    [{ dest: 'iframe', mode: 'navigate' }, 'iframe (juga ditolak X-Frame-Options)'],
    [{ dest: 'document', mode: 'no-cors' }, 'bukan navigasi'],
    [{ dest: null, mode: null }, 'peramban tanpa Sec-Fetch-*'],
  ])('%o → tidak (%s)', (h) => {
    expect(navigasiDokumen(h)).toBe(false)
  })
})

describe('meta ikatan di klien', () => {
  it('dibaca sekali lalu elemennya dibuang; nilai cacat → null', () => {
    const token = tokenIkatan(KUNCI, buatIkat())
    expect(metaIkatan(META_IKATAN, token)).toBe(`<meta name="${META_IKATAN}" content="${token}">`)
    let dibuang = 0
    const doc = (nilai: string | null) => ({
      querySelector: () => (nilai === null ? null : { getAttribute: () => nilai, remove: () => { dibuang++ } }),
    })
    expect(bacaIkatanMeta(doc(token))).toBe(token)
    expect(dibuang).toBe(1)
    expect(bacaIkatanMeta(doc('<script>'))).toBeNull()
    expect(bacaIkatanMeta(doc(null))).toBeNull()
    expect(bacaIkatanMeta(null)).toBeNull()
  })

  it('galatIkatan: hanya 403 berstatusMessage "ikatan"', () => {
    expect(galatIkatan({ status: 403, data: { statusMessage: 'ikatan' } })).toBe(true)
    expect(galatIkatan({ statusCode: 403, data: { statusMessage: 'lintas-situs' } })).toBe(false)
    expect(galatIkatan({ status: 401, data: { statusMessage: 'ikatan' } })).toBe(false)
    expect(galatIkatan(null)).toBe(false)
  })
})
