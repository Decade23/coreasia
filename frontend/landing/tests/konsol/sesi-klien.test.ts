/**
 * Sesi habis / ikatan basi di tengah kerja (Fase 0c, putaran 2).
 *
 * Regresi yang ditutup: simpan artikel yang ditolak 403 'ikatan' (login di tab
 * lain) atau 401 (sesi berakhir) dulu memuat ulang dokumen / pindah ke login
 * secara otomatis, dan isi editor hilang tanpa pesan. Sekarang metode tulis
 * tidak pernah memuat ulang atau berpindah sendiri, dan draf artikel
 * dititipkan di sessionStorage sebelum dokumen ditinggalkan.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  AWALAN_DRAF,
  bacaDraf,
  hapusDraf,
  hapusSemuaDraf,
  metodeTulis,
  simpanDraf,
  tindakanGalatSesi,
  UMUR_DRAF_MS,
} from '../../utils/konsol'

const baca = (rel: string) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8')

/** Bentuk galat $fetch (ofetch FetchError) dari BFF. */
const galat = (status: number, data?: unknown) => ({ status, statusCode: status, data, response: { status, headers: new Headers() } })
const IKATAN = galat(403, { statusCode: 403, statusMessage: 'ikatan' })
const HABIS = galat(401, { errors: { code: 'UNAUTHORIZED', message: 'Sesi berakhir' } })

describe('tindakanGalatSesi — tulis tidak pernah memuat ulang/berpindah sendiri', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'post'])('%s 403 ikatan → minta-muat-ulang (bukan muat ulang otomatis)', (m) => {
    expect(tindakanGalatSesi(m, IKATAN)).toBe('minta-muat-ulang')
  })
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('%s 401 → minta-masuk (bukan pindah ke login otomatis)', (m) => {
    expect(tindakanGalatSesi(m, HABIS)).toBe('minta-masuk')
  })
  it('GET (dan metode kosong = GET bawaan $fetch): tetap otomatis', () => {
    expect(tindakanGalatSesi('GET', IKATAN)).toBe('muat-ulang')
    expect(tindakanGalatSesi(undefined, IKATAN)).toBe('muat-ulang')
    expect(tindakanGalatSesi('HEAD', HABIS)).toBe('ke-login')
    expect(tindakanGalatSesi('GET', HABIS)).toBe('ke-login')
  })
  it('galat lain bukan urusan sesi', () => {
    for (const m of ['GET', 'POST']) {
      expect(tindakanGalatSesi(m, galat(403, { errors: { code: 'MFA_REQUIRED', message: 'x' } }))).toBeNull()
      expect(tindakanGalatSesi(m, galat(403, { statusCode: 403, statusMessage: 'asal' }))).toBeNull()
      expect(tindakanGalatSesi(m, galat(422, { errors: { code: 'VALIDATION_FAILED' } }))).toBeNull()
      expect(tindakanGalatSesi(m, galat(500))).toBeNull()
      expect(tindakanGalatSesi(m, new TypeError('Failed to fetch'))).toBeNull()
    }
  })
  it('metodeTulis', () => {
    expect(metodeTulis('GET')).toBe(false)
    expect(metodeTulis('head')).toBe(false)
    expect(metodeTulis(undefined)).toBe(false)
    expect(metodeTulis('POST')).toBe(true)
    expect(metodeTulis('delete')).toBe(true)
  })
})

describe('draf console di sessionStorage', () => {
  const simpanan = () => {
    const isi = new Map<string, string>()
    return {
      isi,
      getItem: (k: string) => isi.get(k) ?? null,
      setItem: (k: string, v: string) => { isi.set(k, v) },
      removeItem: (k: string) => { isi.delete(k) },
      get length() { return isi.size },
      key: (i: number) => [...isi.keys()][i] ?? null,
    }
  }
  const FORM = { form: { title: 'Judul', content: '<p>isi panjang</p>' }, ai: { title: 'AI' }, aiKategori: 'seo' }

  it('pulih untuk admin yang sama', () => {
    const s = simpanan()
    expect(simpanDraf(s, 'artikel:baru', 'admin-1', FORM, 1_000)).toBe(true)
    expect(s.isi.has(`${AWALAN_DRAF}artikel:baru`)).toBe(true)
    expect(bacaDraf(s, 'artikel:baru', 'admin-1', 2_000)).toEqual(FORM)
  })

  it('admin lain di tab yang sama tidak mewarisinya (dan draf dibuang)', () => {
    const s = simpanan()
    simpanDraf(s, 'artikel:baru', 'admin-1', FORM, 1_000)
    expect(bacaDraf(s, 'artikel:baru', 'admin-2', 2_000)).toBeNull()
    expect(s.isi.size).toBe(0)
  })

  it('tanpa id admin: tidak disimpan dan tidak dipulihkan', () => {
    const s = simpanan()
    expect(simpanDraf(s, 'k', '', FORM, 1_000)).toBe(false)
    simpanDraf(s, 'k', 'admin-1', FORM, 1_000)
    expect(bacaDraf(s, 'k', '', 2_000)).toBeNull()
  })

  it('kedaluwarsa 24 jam, rusak, atau bukan objek → dibuang', () => {
    const s = simpanan()
    simpanDraf(s, 'k', 'admin-1', FORM, 1_000)
    expect(bacaDraf(s, 'k', 'admin-1', 1_000 + UMUR_DRAF_MS)).toBeNull()
    expect(s.isi.size).toBe(0)
    s.setItem(`${AWALAN_DRAF}k`, '{bukan json')
    expect(bacaDraf(s, 'k', 'admin-1', 2_000)).toBeNull()
    expect(s.isi.size).toBe(0)
    s.setItem(`${AWALAN_DRAF}k`, JSON.stringify({ v: 1, pemilik: 'admin-1', waktu: 1_000, isi: 'teks' }))
    expect(bacaDraf(s, 'k', 'admin-1', 2_000)).toBeNull()
  })

  it('penyimpanan penuh/diblokir → false (pemanggil tetap menjaga dengan beforeunload)', () => {
    const penuh = { getItem: () => null, setItem: () => { throw new DOMException('quota', 'QuotaExceededError') }, removeItem: () => {} }
    expect(simpanDraf(penuh, 'k', 'admin-1', FORM, 1_000)).toBe(false)
    const rusak = { getItem: () => { throw new Error('diblokir') }, setItem: () => {}, removeItem: () => { throw new Error('diblokir') } }
    expect(bacaDraf(rusak, 'k', 'admin-1', 1_000)).toBeNull()
    expect(() => hapusDraf(rusak, 'k')).not.toThrow()
  })

  it('hapusSemuaDraf (dokumen publik) hanya membuang draf console', () => {
    const s = simpanan()
    simpanDraf(s, 'artikel:baru', 'admin-1', FORM, 1_000)
    simpanDraf(s, 'artikel:abc', 'admin-1', FORM, 1_000)
    s.setItem('ca_konsol_muat_ulang', '1')
    s.setItem('lain', 'x')
    expect(hapusSemuaDraf(s)).toBe(2)
    expect([...s.isi.keys()].sort()).toEqual(['ca_konsol_muat_ulang', 'lain'])
  })
})

/* Tripwire sumber: kontrak di atas hanya berguna bila benar-benar dipakai. */
describe('pemakaian di klien console', () => {
  it('useAdminApi memutuskan dari METODE permintaan, lewat tindakanGalatSesi', () => {
    const src = baca('composables/useAdminApi.ts')
    expect(src).toMatch(/sesiHabis\(err, opsi\.method/)
    expect(src).toMatch(/tindakanGalatSesi\(metode, err\)/)
    // Muat ulang / pindah hanya lewat jalur yang menitipkan draf dulu.
    expect(src).not.toMatch(/location\.(reload|assign|href)/)
  })

  it('muat ulang oleh console selalu menandai pindahDisengaja lebih dulu', () => {
    const src = baca('composables/useKonsolIkatan.ts')
    expect(src).toMatch(/pindahDisengaja\(\)\s*\n\s*window\.location\.reload\(\)/)
    expect(src.match(/window\.location\.reload\(\)/g)?.length).toBe(1)
  })

  it.each(['pages/console/articles/create.vue', 'pages/console/articles/[id].vue'])('%s menitipkan draf dan menghapusnya sesudah tersimpan', (berkas) => {
    const src = baca(berkas)
    expect(src).toMatch(/useDrafKonsol\(/)
    expect(src).toMatch(/draf\.mulai/)
    expect(src).toMatch(/draf\.tandaiTersimpan\(\)/)
  })

  it('RichEditor tidak memancarkan update saat isi dipasang dari luar (Tiptap 3)', () => {
    // setContent(val, false) gaya Tiptap 2 memancarkan update di Tiptap 3:
    // isi server/draf ditulis ulang dan form yang belum disentuh tampak berubah.
    const src = baca('components/ui/RichEditor.client.vue')
    expect(src).not.toMatch(/setContent\([^)]*,\s*false\s*\)/)
    expect(src).toMatch(/setContent\(val, \{ emitUpdate: false \}\)/)
  })

  it('dokumen publik membuang draf console sebelum GTM', () => {
    expect(baca('plugins/konsol-isolasi.client.ts')).toMatch(/hapusSemuaDraf\(window\.sessionStorage\)/)
  })

  it('kalimat sesi & draf ada di ID dan EN', () => {
    const src = baca('composables/useConsoleI18n.ts')
    const blok = (nama: string) => [...src.matchAll(new RegExp(`\\n    ${nama}: \\{([^}]*)\\}`, 'g'))].map(m => m[1] ?? '')
    const kunciDi = (isi: string) => [...isi.matchAll(/^\s+(\w+):/gm)].map(m => m[1]).sort()
    const sesi = blok('sesi')
    const draf = blok('draf')
    expect(sesi.length).toBe(2)
    expect(draf.length).toBe(2)
    for (const b of sesi) expect(kunciDi(b)).toEqual(['habisTulis', 'ikatanBaca', 'ikatanTulis', 'masukLagi', 'muatUlang'])
    for (const b of draf) expect(kunciDi(b)).toEqual(['buang', 'dipulihkan'])
  })
})
