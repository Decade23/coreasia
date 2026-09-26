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
      expect(baca(berkas), berkas).toMatch(new RegExp(`<CashflowPanelTab ranah="${ranah}" aktivasi[\\s>]`))
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
