/**
 * Penjaga struktur Fase 3 (ranah buku, 0095) — sambungan yang tidak terlihat
 * vue-tsc maupun uji perilaku (aktivasi-tab.test.ts):
 * - setiap tab Fase 3 punya berkas dan memakai CashflowPanelTab ber-`aktivasi`
 *   dengan ranahnya sendiri;
 * - admin_kasus_tambah untuk ranah Fase 3 hanya lewat CashflowPanelTab
 *   (useCashflowRanahAktivasi): tab, pemanggil RPC, dan halaman tidak
 *   memanggil kasus.tambah / kasusTambah sendiri;
 * - tautan tab (tiga baris NuxtLink) dan pintasan angka menandai aktivasi;
 * - tombol "Muat data" tidak menyebut ranah dan tanpa dialog.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { RANAH_BUKU_RUANG } from '../../adapters/cashflowRuang'
import { RANAH_ORANG_FASE3 } from '../../adapters/cashflowKasus'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
const TAB = [
  ...RANAH_BUKU_RUANG.map(r => ({ ranah: r, berkas: `pages/console/cashflow/ruang/[id]/${r}.vue` })),
  ...RANAH_ORANG_FASE3.map(r => ({ ranah: r, berkas: `pages/console/cashflow/pengguna/[id]/${r}.vue` })),
]

describe('Fase 3: tab ranah buku', () => {
  it('setiap tab Fase 3 memakai CashflowPanelTab ber-aktivasi dengan ranahnya sendiri', () => {
    for (const { ranah, berkas } of TAB) {
      expect(baca(berkas), berkas).toMatch(new RegExp(`<CashflowPanelTab\\s+ranah="${ranah}"\\s+aktivasi[\\s>]`))
    }
  })
  it('kasus.tambah hanya lewat CashflowPanelTab (aktivasi) — tab & pemanggil RPC tidak menambah ranah sendiri', () => {
    for (const berkas of [...TAB.map(t => t.berkas), 'composables/cashflow/useCashflowRanahBuku.ts']) {
      const isi = baca(berkas)
      expect(isi, berkas).not.toMatch(/\.tambah\(|kasusTambah|useCashflowRanahOtomatis/)
    }
    const panel = baca('components/cashflow/CashflowPanelTab.vue')
    expect(panel).toMatch(/useCashflowRanahAktivasi\(kasus, props\.ranah, aktivasiTab\.ambil\(route\.path\), kerja => aksi\(kerja\)\)/)
    expect(panel).toMatch(/props\.aktivasi && props\.ranah/)
  })
  it('tautan tab dan menu "Lainnya" menandai aktivasi; prefetch/hover tidak (hanya @click)', () => {
    const tab = baca('components/cashflow/CashflowTab.vue')
    expect(tab.match(/<NuxtLink[^>]*@click="tandai\(i\.to, \$event\)"/g)?.length).toBe(3)
    expect(tab).not.toMatch(/@(mouseenter|mouseover|focus|pointerenter)=/)
  })
  it('pintasan angka menandai aktivasi dengan peristiwa keyboard (isTrusted), paling banyak 9 tab', () => {
    for (const [induk, daftar] of [['pages/console/cashflow/ruang/[id].vue', 'TAB_RUANG'], ['pages/console/cashflow/pengguna/[id].vue', 'TAB_PENGGUNA']] as const) {
      expect(baca(induk)).toContain(`...${daftar}.slice(0, 9).map((t, i) => ({ kunci: String(i + 1), aksi: (e: KeyboardEvent) => { aktivasiTab.catat(keTab(t), e); navigateTo(keTab(t)) } })),`)
    }
  })
  it('"Muat data": tombol biasa, tanpa nama ranah, tanpa dialog', () => {
    const panel = baca('components/cashflow/CashflowPanelTab.vue')
    const blok = panel.slice(panel.indexOf('v-else-if="aktivasi && (diLuar'), panel.indexOf('v-else-if="diLuar ||'))
    expect(blok).toContain("tcf('aktivasi.muatData')")
    expect(blok).toContain('@click="muatData"')
    expect(blok).not.toMatch(/labelRanah|ranah\./)
    for (const { berkas } of TAB) expect(baca(berkas)).not.toMatch(/Modal|dialog|alasan/i)
  })
})

describe('Fase 3: isi tab Katalog, Jadwal, Usaha', () => {
  const HALAMAN = ['katalog', 'jadwal', 'usaha'].map(r => `pages/console/cashflow/ruang/[id]/${r}.vue`)
  const KOMPONEN = ['CashflowTabKatalog', 'CashflowTabJadwal', 'CashflowLaciJadwal', 'CashflowTabUsaha', 'CashflowRiwayatStok', 'CashflowSegmen']
    .map(k => `components/cashflow/${k}.vue`)
  const kunciSkema = (isi: string) => {
    const m = isi.match(/const SKEMA = \{([\s\S]*?)\} as const satisfies SkemaQuery/)
    return m ? [...m[1]!.matchAll(/^\s*(\w+): \{ jenis:/gm), ...m[1]!.matchAll(/\{ (\w+): \{ jenis:/g)].map(x => x[1]).sort() : []
  }
  it('isi sudah terpasang: tidak ada lagi keterangan "menyusul" di ketiga tab', () => {
    for (const h of HALAMAN) expect(baca(h), h).not.toContain('aktivasi.menyusul')
  })
  it('URL hanya membawa kunci struktur (spek §6): ?jadwal=, ?lihat=, ?produk=, ?kursor=; bulan, arsip, dan cari tetap di memori', () => {
    expect(kunciSkema(baca(HALAMAN[0]!))).toEqual([])
    expect(kunciSkema(baca(HALAMAN[1]!))).toEqual(['jadwal'])
    expect(kunciSkema(baca(HALAMAN[2]!))).toEqual(['kursor', 'lihat', 'produk'])
    for (const k of KOMPONEN) expect(baca(k), k).not.toMatch(/useCashflowQuery|setel\(|router\.(push|replace)/)
  })
  it('komponen isi tidak menambah ranah, tidak memanggil RPC langsung, dan tanpa v-html', () => {
    for (const k of KOMPONEN) {
      const isi = baca(k)
      expect(isi, k).not.toMatch(/\.tambah\(|kasusTambah|useCashflowRanahOtomatis|useCashflowAdmin\(/)
      expect(isi.slice(isi.indexOf('<template')), k).not.toMatch(/v-html|innerHTML/)
    }
  })
  it('warna kategori sebagai gaya hanya dari nilai tersaring adapter (warna), tidak pernah color mentah', () => {
    const isi = baca('components/cashflow/CashflowTabKatalog.vue')
    expect(isi).toContain(':style="c.warna ? { backgroundColor: c.warna } : undefined"')
    expect(isi).not.toMatch(/\.color\b/)
  })
  it('laci jadwal: pembayaran tanpa id (tanpa ranah transaksi) tidak bertaut; sampah rinci hanya bila server mengirimnya', () => {
    const isi = baca('components/cashflow/CashflowLaciJadwal.vue')
    expect(isi).toContain('<NuxtLink v-if="b.id" :to="keTx(b.id)"')
    expect(isi).toContain('v-if="!d.rinci.pembayaran"')
    expect(isi).toContain('<template v-if="d.rinci.diSampah">')
  })
})
