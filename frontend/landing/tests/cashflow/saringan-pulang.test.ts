/**
 * Saringan Struk/Kabar yang ditolak server tidak boleh mengunci tab.
 *
 * Saringan hidup di useState (per ruang / per subjek) lintas navigasi klien,
 * dan galat CashflowPanelTab menggantikan slot — kontrol saringan ikut hilang.
 * Dulu: Dari > Sampai yang DIKETIK (min/max input date tidak mencegahnya)
 * → 22023 saringan; ruang Kabar dari kasus lama yang tidak ada di lingkup
 * kasus baru → 42501 kasus-lingkup. Satu-satunya jalan keluar: muat ulang
 * peramban. Kini nilai itu tidak pernah dikirim, dan galat apa pun selagi
 * saringan terpasang menampilkan "Atur ulang saringan" di luar panel.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SARING_STRUK_KOSONG, saringStrukSah } from '../../adapters/cashflowRanahBuku'
import { ruangKabarSah } from '../../adapters/cashflowPerangkat'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
const W1 = '11111111-1111-4111-8111-111111111111'
const W2 = '22222222-2222-4222-8222-222222222222'

describe('saringStrukSah', () => {
  const s = (dari: string | null, sampai: string | null) => saringStrukSah({ ...SARING_STRUK_KOSONG, jenis: 'masuk', dari, sampai })
  it('rentang terbalik ditukar, saringan lain utuh', () => {
    expect(s('2026-09-20', '2026-09-01')).toMatchObject({ jenis: 'masuk', dari: '2026-09-01', sampai: '2026-09-20' })
  })
  it('rentang benar dan satu sisi saja tidak diubah', () => {
    expect(s('2026-09-01', '2026-09-20')).toMatchObject({ dari: '2026-09-01', sampai: '2026-09-20' })
    expect(s('2026-09-20', null)).toMatchObject({ dari: '2026-09-20', sampai: null })
    expect(s(null, '2026-01-01')).toMatchObject({ dari: null, sampai: '2026-01-01' })
  })
  it('tanggal rusak atau tidak ada di kalender dibuang', () => {
    expect(s('2026-02-31', '20260101')).toMatchObject({ dari: null, sampai: null })
    expect(s('', 'x')).toMatchObject({ dari: null, sampai: null })
  })
})

describe('ruangKabarSah: hanya ruang di lingkup kasus kini', () => {
  it('uuid di lingkup dikirim; di luar lingkup, rusak, atau lingkup kosong → null (semua ruang)', () => {
    expect(ruangKabarSah(W1, [W1, W2])).toBe(W1)
    expect(ruangKabarSah(W2, [W1])).toBeNull()
    expect(ruangKabarSah(W1, [])).toBeNull()
    expect(ruangKabarSah('bukan-uuid', ['bukan-uuid'])).toBeNull()
    expect(ruangKabarSah(null, [W1])).toBeNull()
  })
})

describe('jalan pulang dari galat saringan', () => {
  it('Struk: saringan tersimpan dinormalkan; tanggal diketik lewat saringStrukSah', () => {
    expect(baca('pages/console/cashflow/ruang/[id]/struk.vue')).toMatch(/saringStrukSah\(simpan\.value\.s\)/)
    expect(baca('components/cashflow/CashflowTabStruk.vue')).toMatch(/emit\('saring', saringStrukSah\(/)
  })
  it('Kabar: ruang tersimpan dicocokkan dengan kasus.ruang', () => {
    expect(baca('pages/console/cashflow/pengguna/[id]/kabar.vue')).toMatch(/ruangKabarSah\(s\.ruang, ruang\.value\)/)
  })
  it('tombol "Atur ulang saringan" pada galat berada DI LUAR CashflowPanelTab', () => {
    for (const [berkas, g, kosong] of [
      ['pages/console/cashflow/ruang/[id]/struk.vue', 'd', 'SARING_STRUK_KOSONG'],
      ['pages/console/cashflow/pengguna/[id]/kabar.vue', 'k', 'SARING_KABAR_KOSONG'],
    ] as const) {
      const isi = baca(berkas)
      const sesudahPanel = isi.slice(isi.indexOf('</CashflowPanelTab>'))
      expect(sesudahPanel, berkas).toContain(`v-if="${g}.galat.value && adaSaring"`)
      expect(sesudahPanel, berkas).toContain(`@click="gantiSaring({ ...${kosong} })"`)
    }
  })
})
