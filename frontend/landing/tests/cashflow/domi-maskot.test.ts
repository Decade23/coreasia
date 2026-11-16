/**
 * Maskot Domi di console: gambar diam di tiga tempat saja (sapaan Ringkasan,
 * kepala Cadangan Domi, keadaan kosong daftar), dan sapaan Ringkasan.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSSRApp, h, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import CashflowDomiMaskot from '../../components/cashflow/CashflowDomiMaskot.vue'
import CashflowKeadaan from '../../components/cashflow/CashflowKeadaan.vue'
import { jamWib, kunciKeadaan, namaPanggilan, waktuSapaan } from '../../utils/cashflow/sapaan'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (f: string) => readFileSync(join(AKAR, f), 'utf8')
const Ikon = { props: ['name'], render(this: { name: string }) { return h('i', { 'data-ikon': this.name }) } }
const render = (komponen: Component, props: Record<string, unknown> = {}) => {
  const app = createSSRApp({ render: () => h(komponen, props) })
  app.component('Icon', Ikon)
  app.component('CashflowDomiMaskot', CashflowDomiMaskot)
  return renderToString(app)
}
const semuaVue = (dir: string): string[] => readdirSync(join(AKAR, dir)).flatMap((n) => {
  const f = join(dir, n)
  return statSync(join(AKAR, f)).isDirectory() ? semuaVue(f) : f.endsWith('.vue') ? [f] : []
})

describe('maskot Domi', () => {
  it('gambar hiasan: tersembunyi dari pembaca layar, ukurannya dari prop', async () => {
    const html = await render(CashflowDomiMaskot, { ukuran: 64 })
    expect(html).toMatch(/^<svg[^>]*aria-hidden="true"/)
    expect(html).toMatch(/width="64" height="64"/)
    expect(html).toMatch(/viewBox="0 0 120 120"/i)
    expect(html).not.toMatch(/cf-domi-napas/)
  })
  it('gerak hanya bila diminta, dan aturannya menghormati prefers-reduced-motion', async () => {
    expect(await render(CashflowDomiMaskot, { napas: true })).toMatch(/class="[^"]*cf-domi-napas/)
    const src = baca('components/cashflow/CashflowDomiMaskot.vue')
    const animasi = [...src.matchAll(/animation:/g)]
    expect(animasi).toHaveLength(1)
    expect(src).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.cf-domi-napas \.cf-domi-tubuh \{ animation:/)
  })
  it('badan dan tutup mengikuti tema, tanpa warna tetap di gambarnya', () => {
    const src = baca('components/cashflow/CashflowDomiMaskot.vue')
    expect(src).toMatch(/\.cf-domi-badan \{ fill: #3D4E8C; \}/)
    expect(src).toMatch(/html\[data-theme="light"\] \.cf-domi-badan \{ fill: #1A2445; \}/)
    expect(src).not.toMatch(/class="cf-domi-(badan|tutup)"[^>]*fill=/)
  })
  it('hanya tiga tempat yang memakainya: Ringkasan, Cadangan Domi, dan keadaan kosong', () => {
    const pemakai = [...semuaVue('pages'), ...semuaVue('components'), ...semuaVue('layouts')]
      .filter(f => f !== 'components/cashflow/CashflowDomiMaskot.vue' && /<CashflowDomiMaskot\b/.test(baca(f)))
    expect(pemakai.sort()).toEqual([
      'components/cashflow/CashflowKeadaan.vue',
      'pages/console/cashflow/domi.vue',
      'pages/console/cashflow/index.vue',
    ])
    // Hanya sapaan Ringkasan yang bergerak.
    expect(baca('pages/console/cashflow/domi.vue')).not.toMatch(/<CashflowDomiMaskot[^>]*napas/)
    expect(baca('components/cashflow/CashflowKeadaan.vue')).not.toMatch(/<CashflowDomiMaskot[^>]*napas/)
  })
})

describe('keadaan daftar dan maskot', () => {
  const maskot = (html: string) => (html.match(/data-uji="domi-maskot"/g) ?? []).length
  it('kosong menampilkan satu Domi, di dalam kartu lain ukurannya lebih kecil', async () => {
    const biasa = await render(CashflowKeadaan, { jenis: 'kosong', judul: 'Belum ada data', pesan: 'Daftar ini masih kosong.' })
    expect(maskot(biasa)).toBe(1)
    expect(biasa).toMatch(/width="96"/)
    expect(biasa).not.toMatch(/data-ikon/)
    expect(await render(CashflowKeadaan, { jenis: 'kosong', polos: true, pesan: 'Kosong.' })).toMatch(/width="72"/)
  })
  it('maskot bisa dimatikan, lalu ikonnya yang tampil', async () => {
    const html = await render(CashflowKeadaan, { jenis: 'kosong', maskot: false, icon: 'lucide:tags', pesan: 'Kosong.' })
    expect(maskot(html)).toBe(0)
    expect(html).toMatch(/data-ikon="lucide:tags"/)
  })
  it('memuat, galat, dan akses terbatas tidak pernah memakai maskot', async () => {
    for (const jenis of ['memuat', 'galat', 'terbatas']) {
      expect(maskot(await render(CashflowKeadaan, { jenis, judul: 'Judul', pesan: 'Pesan', labelUlang: 'Coba lagi' }))).toBe(0)
    }
  })
})

describe('sapaan Ringkasan', () => {
  const pada = (jamUtc: string) => new Date(`2026-11-16T${jamUtc}:00Z`)
  it('jam dibaca di WIB, apa pun zona mesin', () => {
    expect(jamWib(pada('00:30'))).toBe(7)
    expect(jamWib(pada('17:00'))).toBe(0)
  })
  it('pagi, siang, sore, malam berganti di jam yang wajar', () => {
    expect(['21:00', '03:59', '04:00', '07:59', '08:00', '11:59', '12:00', '20:00'].map(j => waktuSapaan(pada(j))))
      .toEqual(['pagi', 'pagi', 'siang', 'siang', 'sore', 'sore', 'malam', 'malam'])
  })
  it('nama panggilan: kata pertama, kosong bila tidak ada, dipotong bila kepanjangan', () => {
    expect(namaPanggilan('  Rahmawati Kusumaningsih ')).toBe('Rahmawati')
    expect(namaPanggilan(null)).toBe('')
    expect(namaPanggilan('A'.repeat(40))).toBe(`${'A'.repeat(24)}…`)
  })
  it('kabar yang perlu ditindak menang atas angka', () => {
    expect(kunciKeadaan({ wa: null, pengguna: null })).toBe('memuat')
    expect(kunciKeadaan({ wa: null, pengguna: 1248 })).toBe('angka')
    expect(kunciKeadaan({ wa: 'sehat', pengguna: 1248 })).toBe('sehat')
    expect(kunciKeadaan({ wa: 'gangguan', pengguna: null })).toBe('gangguan')
    expect(kunciKeadaan({ wa: 'sebagian', pengguna: 1248 })).toBe('sebagian')
    expect(kunciKeadaan({ wa: 'nonaktif', pengguna: 1248 })).toBe('nonaktif')
  })
  it('kalimatnya ada di kedua bahasa, tanpa em-dash, titik koma, dan emoji', () => {
    for (const bahasa of ['id', 'en'] as const) {
      const r = KAMUS_CASHFLOW[bahasa].ringkasan
      const teks = [
        ...Object.values(r.sapaan), r.keadaan.memuat,
        ...(['sehat', 'angka', 'sebagian', 'gangguan', 'nonaktif'] as const).map(k => r.keadaan[k]('1.248')),
        ...Object.values(r.keadaanTanpaAngka),
      ]
      expect(teks).toHaveLength(15)
      for (const t of teks) {
        expect(t).not.toMatch(/[—;]|\p{Extended_Pictographic}/u)
        expect(t.length).toBeGreaterThan(3)
      }
      expect(r.keadaan.sehat('1.248')).toContain('1.248')
    }
  })
})
