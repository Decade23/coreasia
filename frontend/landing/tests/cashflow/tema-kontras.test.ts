/**
 * Kontras token tema area CashFlow (assets/css/cashflow-tema.css).
 *
 * Setiap pasangan teks dan latar yang dipakai komponen lewat var(--ca-*) atau
 * token --cf-* harus minimal 4,5:1 (WCAG AA untuk teks biasa), di terang dan
 * di gelap. Nilainya dibaca dari berkas CSS itu sendiri, jadi mengganti satu
 * warna di sana langsung diuji di sini.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const css = readFileSync(join(AKAR, 'assets/css/cashflow-tema.css'), 'utf8')

const blok = (penanda: string) => {
  const awal = css.indexOf(`/* @tema ${penanda}`)
  expect(awal, penanda).toBeGreaterThan(-1)
  const buka = css.indexOf('{', awal)
  return { pemilih: css.slice(css.indexOf('*/', awal) + 2, buka).trim(), isi: css.slice(buka + 1, css.indexOf('}', buka)) }
}
const variabel = (isi: string) => Object.fromEntries([...isi.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1]!, m[2]!.trim()]))

const TEMA = { terang: variabel(blok('terang').isi), gelap: variabel(blok('gelap').isi) }
const PETA = variabel(blok('peta').isi)

const luminans = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const kontras = (a: string, b: string) => {
  const [x, y] = [luminans(a), luminans(b)].sort((p, q) => q - p)
  return (x! + 0.05) / (y! + 0.05)
}
/** Pisah daftar pemilih pada koma di luar kurung (`:is(a, b) c, d` = dua pemilih). */
const pisahPemilih = (teks: string) => {
  const hasil: string[] = []
  let dalam = 0
  let kini = ''
  for (const c of teks) {
    if (c === '(') dalam++
    if (c === ')') dalam--
    if (c === ',' && dalam === 0) { hasil.push(kini.trim()); kini = '' } else kini += c
  }
  return [...hasil, kini.trim()]
}
/** Nilai padat sebuah token: --cf-* langsung, --ca-* lewat petanya. */
const nilai = (tema: Record<string, string>, token: string): string => {
  const v = token.startsWith('--ca-') ? PETA[token] : tema[token]
  expect(v, token).toBeDefined()
  const rujuk = /^var\((--[a-z0-9-]+)\)$/.exec(v!)
  return rujuk ? nilai(tema, rujuk[1]!) : v!
}

/* [teks, latar]. Latar yang sungguh dipakai: halaman (--ca-bg), kartu
   (--ca-panel-bg), bidang terangkat (--ca-panel-bg-strong, --ca-chip-bg), dan
   bidang awan navigasi. */
const LATAR = ['--ca-bg', '--ca-panel-bg', '--ca-panel-bg-strong', '--ca-chip-bg', '--cf-awan']
const PASANGAN: [string, string][] = [
  ...['--ca-text', '--ca-muted', '--ca-subtle'].flatMap(t => LATAR.map(l => [t, l] as [string, string])),
  // Teks status di atas bidang statusnya (pil, pemberitahuan).
  ['--ca-gold-text', '--ca-gold-bg'], ['--ca-emerald-text', '--ca-emerald-bg'],
  ['--ca-danger-text', '--ca-danger-bg'], ['--ca-info-text', '--ca-info-bg'],
  // Teks status polos (.ca-tone-*) di halaman, kartu, dan bidang terangkat.
  ...['--ca-gold-text', '--ca-emerald-text', '--ca-danger-text', '--ca-info-text', '--ca-brand-deep']
    .flatMap(t => ['--ca-bg', '--ca-panel-bg', '--ca-panel-bg-strong'].map(l => [t, l] as [string, string])),
  // Teks biasa di atas bidang status (kartu peringatan berisi kalimat).
  ['--ca-text', '--ca-gold-bg'], ['--ca-text', '--ca-danger-bg'], ['--ca-text', '--ca-emerald-bg'], ['--ca-text', '--ca-info-bg'],
  // Pilihan aktif (pintu navigasi), tombol utama, lencana hitungan.
  ['--cf-on-inti', '--cf-inti'], ['--cf-on-emas', '--cf-emas'], ['--cf-on-emas', '--cf-emas-tua'], ['--cf-galat', '--cf-galat-bg'],
  // Navigasi: tautan pintu dan halaman di kartu, tombol cari di bidang awan.
  ['--cf-tinta2', '--cf-kartu'], ['--cf-tinta2', '--cf-awan'], ['--cf-tinta', '--cf-kartu'],
]
/* Bukan teks: garis fokus dan garis tab aktif cukup 3:1 terhadap bidangnya. */
const BUKAN_TEKS: [string, string][] = [
  ['--cf-fokus', '--cf-kartu'], ['--cf-fokus', '--cf-layar'], ['--cf-aksen', '--cf-kartu'],
]

describe('token tema area CashFlow', () => {
  it('dicakup hanya ke isi halaman dan lapisan di body, di bawah kelas cf-area', () => {
    for (const p of ['gelap', 'terang', 'peta']) {
      const pemilih = blok(p).pemilih.split(',').map(s => s.trim().replace(/^html\[data-theme="light"\] /, ''))
      expect(pemilih, p).toEqual(['body.cf-area .ca-console-main', 'body.cf-area > :not(#__nuxt)'])
    }
    expect(blok('terang').pemilih).toMatch(/^html\[data-theme="light"\] /)
    // Tidak ada aturan yang menyentuh sidebar, bilah atas, atau akar dokumen.
    expect(css).not.toMatch(/ca-console-(sidebar|topbar|shell|nav-item)/)
    const tanpaKomentar = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const pemilih = [...tanpaKomentar.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap(m => pisahPemilih(m[1]!))
    expect(pemilih.length).toBeGreaterThan(10)
    for (const s of pemilih) expect(s, s).toMatch(/^(html\[data-theme="light"\] )?body\.cf-area[ >]/)
  })

  it('kedua tema mendefinisikan token yang sama, semuanya warna padat', () => {
    expect(Object.keys(TEMA.terang).sort()).toEqual(Object.keys(TEMA.gelap).sort())
    for (const [n, t] of Object.entries(TEMA)) {
      for (const [k, v] of Object.entries(t)) if (!k.startsWith('--cf-bayang')) expect(v, `${n} ${k}`).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('token console yang dipakai komponen CashFlow semuanya dipetakan', () => {
    for (const t of [
      '--ca-bg', '--ca-border', '--ca-text', '--ca-muted', '--ca-subtle', '--ca-brand', '--ca-brand-deep', '--ca-accent',
      '--ca-panel-bg', '--ca-panel-bg-strong', '--ca-dropdown-bg', '--ca-chip-bg', '--ca-toggle-track', '--ca-toggle-thumb',
      '--ca-gold-text', '--ca-gold-bg', '--ca-gold-border', '--ca-emerald-text', '--ca-emerald-bg', '--ca-emerald-border',
      '--ca-danger-text', '--ca-danger-bg', '--ca-danger-border', '--ca-info-text', '--ca-info-bg',
    ]) expect(PETA[t], t).toBeDefined()
  })

  for (const n of ['terang', 'gelap'] as const) {
    it(`tema ${n}: setiap pasangan teks dan latar minimal 4,5:1`, () => {
      const kurang = PASANGAN
        .map(([t, l]) => ({ pasangan: `${t} di atas ${l}`, k: kontras(nilai(TEMA[n], t), nilai(TEMA[n], l)) }))
        .filter(x => x.k < 4.5)
        .map(x => `${x.pasangan}: ${x.k.toFixed(2)}`)
      expect(kurang).toEqual([])
    })
    it(`tema ${n}: garis fokus dan tab aktif minimal 3:1`, () => {
      for (const [a, b] of BUKAN_TEKS) expect(kontras(nilai(TEMA[n], a), nilai(TEMA[n], b)), `${a} di atas ${b}`).toBeGreaterThanOrEqual(3)
    })
  }

  it('hitungan kontras cocok dengan angka acuan', () => {
    expect(kontras('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(kontras('#646E85', '#F4F6FA')).toBeCloseTo(4.72, 1)
    expect(kontras('#1A1204', '#FFBE3D')).toBeCloseTo(11.2, 1)
  })
})
