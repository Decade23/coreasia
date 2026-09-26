/**
 * Penjaga struktur Fase 2 (Ruang 360, 0094) — hal yang tidak terlihat
 * vue-tsc maupun uji adapter:
 * - setiap tab TAB_RUANG punya berkas; induk memasang <NuxtPage/>; tab
 *   Dompet ada juga di Pengguna 360;
 * - satu klik, tanpa dialog: halaman & komponen Ruang 360 tanpa modal atau
 *   kolom alasan; kasus ruang dibuka dengan isian otomatis;
 * - /aktivitas tidak pernah menampilkan id ruang (Selidiki mengirim id
 *   peristiwa saja) dan tidak memakai v1;
 * - baris tab Ruang Pengguna 360 bertaut ke /ruang/<id>.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TAB_RUANG } from '../../adapters/cashflowRuang'
import { TAB_PENGGUNA } from '../../adapters/cashflowKasus'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
function jelajah(dir: string, hasil: string[] = []): string[] {
  for (const nama of readdirSync(dir)) {
    const jalur = join(dir, nama)
    if (statSync(jalur).isDirectory()) jelajah(jalur, hasil)
    else if (/\.(vue|ts)$/.test(nama)) hasil.push(jalur)
  }
  return hasil
}

describe('Fase 2: rute Ruang 360', () => {
  it('setiap tab ruang punya berkas; induk memasang <NuxtPage/>; daftar ruang tetap di ruang/index.vue', () => {
    for (const t of TAB_RUANG) {
      const f = `pages/console/cashflow/ruang/[id]/${t || 'index'}.vue`
      expect(existsSync(join(AKAR, f)), f).toBe(true)
    }
    expect(baca('pages/console/cashflow/ruang/[id].vue')).toMatch(/<NuxtPage\s*\/>/)
    expect(existsSync(join(AKAR, 'pages/console/cashflow/ruang/index.vue'))).toBe(true)
    // ruang.vue berdampingan dengan folder ruang/ akan jadi induk tanpa <NuxtPage/> (rencana, "Jebakan rute Nuxt").
    expect(existsSync(join(AKAR, 'pages/console/cashflow/ruang.vue'))).toBe(false)
  })
  it('tab Dompet Pengguna 360 terdaftar dan berkasnya ada', () => {
    expect(TAB_PENGGUNA).toContain('dompet')
    expect(existsSync(join(AKAR, 'pages/console/cashflow/pengguna/[id]/dompet.vue'))).toBe(true)
  })
  it('tab Ruang Pengguna 360 menautkan nama ruang ke Ruang 360', () => {
    const f = baca('pages/console/cashflow/pengguna/[id]/ruang.vue')
    expect((f.match(/:to="`\/console\/cashflow\/ruang\/\$\{r\.id\}`"/g) ?? []).length).toBe(2)
  })
})

describe('Fase 2: satu klik, tanpa dialog (keputusan Master 21 Sep 2026)', () => {
  it('halaman & komponen Ruang 360 tanpa modal maupun kolom alasan', () => {
    const berkas = [
      ...jelajah(join(AKAR, 'pages/console/cashflow/ruang')),
      'pages/console/cashflow/aktivitas.vue',
      ...['CashflowKepalaRuang', 'CashflowTabDompet', 'CashflowTabTransaksi', 'CashflowTabJejak', 'CashflowTabAkses']
        .map(k => `components/cashflow/${k}.vue`),
    ].map(f => (f.startsWith('/') ? f : join(AKAR, f)))
    for (const f of berkas) expect(readFileSync(f, 'utf8'), f).not.toMatch(/<ConsoleModal\b|<textarea\b|<input[^>]*alasan/)
  })
  it('kasus ruang dibuka dengan isian otomatis (bukan masukan orang), lingkup [ruang itu]', () => {
    const f = baca('composables/cashflow/useCashflowKasus.ts')
    expect(f).toMatch(/api\.kasusBuka\(subjek, SKENARIO_RUANG, PRESET_OTOMATIS, RANAH_RUANG, \[subjek\], alasanOtomatisRuang\(new Date\(\)\), 'workspace'\)/)
  })
  it('induk Ruang 360 memulihkan kasus bertipe workspace dan melepas halaman saat pergi', () => {
    expect(baca('composables/cashflow/useCashflowRuang.ts')).toMatch(/kasus\.pulihkan\(ws, 'workspace'\)/)
    const induk = baca('pages/console/cashflow/ruang/[id].vue')
    expect(induk).toMatch(/\bmuat\(muatKepala\)/)
    expect(induk).toMatch(/lepasHalaman = kasus\.pasangHalaman\(\)/)
    expect(induk).toMatch(/watch\(\(\) => kasus\.keadaan\.value\.galat,[\s\S]{0,120}tahap === 'sesi'\) keMasukBilaSesi\(/)
  })
})

describe('Fase 2: /aktivitas', () => {
  const f = baca('pages/console/cashflow/aktivitas.vue')
  it('feed v2 tanpa kolom ruang, aktor, atau jam', () => {
    expect(f).not.toMatch(/ruang_pendek|r\.pada\b|formatJam|workspace_id/)
  })
  it('Selidiki mengirim id peristiwa saja lalu pindah ke tab Jejak ruang dari jawaban server', () => {
    expect(f).toMatch(/api\.kasusBukaDariPeristiwa\(id, alasanSelidiki\(new Date\(\)\)\)/)
    expect(f).toMatch(/tujuanSelidiki\(d\)/)
    expect(f).toMatch(/adalahBatasAkses\(d\)/)
  })
  it('useCashflowAdmin tidak lagi memanggil v1 aktivitas maupun cari', () => {
    const admin = baca('composables/cashflow/useCashflowAdmin.ts')
    expect(admin).not.toMatch(/'admin_aktivitas_terbaru'|'admin_cari'/)
  })
})

describe('Fase 2: tab Dompet', () => {
  const f = baca('components/cashflow/CashflowTabDompet.vue')
  it('ranah dompet ditambah otomatis sekali per kasus (bukan tombol), tidak untuk kasus anak', () => {
    expect(f).toMatch(/ditambahUntuk\.value === id \|\| kasus\.kasus\.value\?\.anak\) return\s+ditambahUntuk\.value = id\s+void aksi\(\(\) => kasus\.tambah\(\['dompet'\]\)\)/)
  })
  it('Pemeriksaan bertaut ke tab Transaksi ?cek=<jenis>, bukan daftar id', () => {
    expect(f).toMatch(/const keCek = \(cek: string\) => `\$\{props\.dasar\}\/transaksi\?cek=\$\{cek\}`/)
    expect(f).not.toMatch(/\?ids=/)
  })
  it('mutasi di laci ?dompet= (push), kursor mutasi dikunci per dompet', () => {
    expect(f).toMatch(/const bukaMutasi = \(id: string\) => setel\(\{ dompet: id, kursor: '' \}, \{ dorong: true \}\)/)
    expect(f).toMatch(/\|mutasi:\$\{q\.value\.dompet\}\|/)
  })
})
