/**
 * Setiap kunci kamus yang dipakai modul CashFlow ADA di ID dan EN.
 *
 * tcf() memulangkan jalurnya sendiri bila kunci tidak ada ('kasus.bilah.x'
 * tampil mentah di layar) — vue-tsc tidak menangkapnya karena tcf bertipe any.
 * Di sini:
 * - kunci LITERAL tcf('a.b') di components/cashflow, pages/console/cashflow,
 *   dan composables/cashflow dicari di kedua bahasa;
 * - kunci DINAMIS (tcf(`ranah.${r}`)) diperiksa atas semua nilai yang
 *   mungkin datang: daftar nilai adapter yang sendirinya dikunci ke migrasi.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { PRESET_KASUS, RANAH_T1, RANAH_T2, RANAH_T3, SKENARIO_OTOMATIS, STATUS_KASUS, TAB_PENGGUNA } from '../../adapters/cashflowKasus'
import { CEK_TRANSAKSI, JENIS_TEKS } from '../../adapters/cashflowBuku'
import { JENIS_PERISTIWA } from '../../adapters/cashflowJejak'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
function jelajah(dir: string, hasil: string[] = []): string[] {
  if (!existsSync(dir)) return hasil
  for (const nama of readdirSync(dir)) {
    const jalur = join(dir, nama)
    if (statSync(jalur).isDirectory()) jelajah(jalur, hasil)
    else if (/\.(ts|vue)$/.test(nama)) hasil.push(jalur)
  }
  return hasil
}
const berkas = ['components/cashflow', 'pages/console/cashflow', 'composables/cashflow'].flatMap(d => jelajah(join(AKAR, d)))
const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[bahasa])

describe('kamus CashFlow lengkap untuk setiap kunci yang dipakai', () => {
  it('kunci literal tcf(…) ada di ID dan EN', () => {
    const kunci = new Set<string>()
    for (const f of berkas) {
      for (const m of readFileSync(f, 'utf8').matchAll(/tcf\(\s*['"]([a-zA-Z0-9_.]+)['"]\s*\)/g)) kunci.add(m[1]!)
    }
    expect(kunci.size).toBeGreaterThan(150)
    const hilang = [...kunci].flatMap(k => (['id', 'en'] as const).filter(b => ambil(b, k) === undefined).map(b => `${b}:${k}`))
    expect(hilang).toEqual([])
  })

  it('kunci dinamis: semua nilai yang mungkin punya label ID dan EN', () => {
    const jalur = [
      ...[...RANAH_T1, ...RANAH_T2, ...RANAH_T3].map(r => `ranah.${r}`),
      ...PRESET_KASUS.map(p => `preset.${p}`),
      `skenario.${SKENARIO_OTOMATIS}`,
      ...STATUS_KASUS.map(s => `kasus.status.${s}`),
      ...['saya', 'semua'].map(l => `kasus.lingkupOpsi.${l}`),
      ...TAB_PENGGUNA.map(t => `tab.${t || 'ringkas'}`),
      ...JENIS_PERISTIWA.map(j => `jejak.jenisOpsi.${j}`),
      ...CEK_TRANSAKSI.map(c => `saring.cekOpsi.${c}`),
      ...JENIS_TEKS.map(j => `teks.label.${j}`),
      ...['pengguna', 'transaksi', 'sampah'].map(j => `cari.jenis.${j}`),
      'nav.kasus',
    ]
    const hilang = jalur.flatMap(k => (['id', 'en'] as const).filter(b => typeof ambil(b, k) !== 'string').map(b => `${b}:${k}`))
    expect(hilang).toEqual([])
  })

  it('preset kasus TANPA berkala (K12)', () => {
    expect(Object.keys(KAMUS_CASHFLOW.id.preset)).not.toContain('berkala')
    expect(Object.keys(KAMUS_CASHFLOW.en.preset)).not.toContain('berkala')
  })
})
