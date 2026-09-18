/**
 * Pembaca migrasi Supabase CashFlow untuk uji KONTRAK — bukan berkas uji.
 *
 * Contoh jawaban server di uji adapter hanya berguna bila bentuknya dijaga
 * oleh sumber kebenaran: migrasi. Tanpa ini, contoh dan adapter bisa sama-sama
 * salah dan ujinya tetap hijau (itu yang terjadi pada detail pengguna dan
 * pengumuman). Di sini kunci jsonb_build_object dan kolom tabel dibaca dari
 * definisi TERAKHIR di folder migrasi.
 *
 * Folder migrasi ada di repo CashFlow, bukan di repo ini: bawaannya repo
 * saudara di mesin Master, bisa ditimpa lewat env CASHFLOW_MIGRASI. Bila tidak
 * ditemukan, uji kontrak DILEWATI dan terlihat sebagai "skipped" — bukan
 * lulus diam-diam.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AKAR_LANDING = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
export const DIR_MIGRASI = process.env.CASHFLOW_MIGRASI
  ?? resolve(AKAR_LANDING, '../../../../..', 'cowork/works-in-m5/cashflow/supabase/migrations')
export const adaMigrasi = existsSync(DIR_MIGRASI)

/** Semua migrasi, urut nama (= urut terap), tanpa komentar baris `--`. */
function semuaMigrasi(): Array<{ nama: string; sql: string }> {
  return readdirSync(DIR_MIGRASI)
    .filter(n => n.endsWith('.sql'))
    .sort()
    .map(nama => ({ nama, sql: readFileSync(join(DIR_MIGRASI, nama), 'utf8').replace(/--[^\n]*/g, '') }))
}

/** Tutup kurung pasangan dari `buka` (indeks '('), melompati string '…'. */
function tutupKurung(teks: string, buka: number): number {
  let dalam = 0
  for (let i = buka; i < teks.length; i++) {
    const c = teks[i]
    if (c === "'") { i = teks.indexOf("'", i + 1); if (i < 0) break; continue }
    if (c === '(') dalam++
    else if (c === ')' && --dalam === 0) return i
  }
  throw new Error('Kurung tidak tertutup')
}

/** Isi di antara kurung, dipecah di koma tingkat teratas. */
function argumen(teks: string, buka: number): string[] {
  const tutup = tutupKurung(teks, buka)
  const hasil: string[] = []
  let dalam = 0
  let awal = buka + 1
  for (let i = buka + 1; i < tutup; i++) {
    const c = teks[i]
    if (c === "'") { i = teks.indexOf("'", i + 1); if (i < 0) break; continue }
    if (c === '(') dalam++
    else if (c === ')') dalam--
    else if (c === ',' && dalam === 0) { hasil.push(teks.slice(awal, i).trim()); awal = i + 1 }
  }
  hasil.push(teks.slice(awal, tutup).trim())
  return hasil
}

/** Pohon kunci: null = daun; objek = kunci bersarang (elemen larik diwakili elemennya). */
export type PohonKunci = { [k: string]: PohonKunci | null }

/** Kunci jsonb_build_object PERTAMA di `sql`, bersarang ke nilai yang juga membangun objek. */
export function pohonJsonb(sql: string): PohonKunci {
  const m = /jsonb_build_object\s*\(/i.exec(sql)
  if (!m) throw new Error('jsonb_build_object tidak ditemukan')
  const args = argumen(sql, m.index + m[0].length - 1)
  const pohon: PohonKunci = {}
  for (let i = 0; i + 1 < args.length; i += 2) {
    const kunci = /^'([^']+)'$/.exec(args[i]!)?.[1]
    if (!kunci) throw new Error(`Kunci bukan literal: ${args[i]}`)
    const nilai = args[i + 1]!
    pohon[kunci] = /jsonb_build_object\s*\(/i.test(nilai) ? pohonJsonb(nilai) : null
  }
  return pohon
}

/** Pohon kunci dari contoh JSON (larik → bentuk elemen pertamanya). */
export function pohonContoh(nilai: unknown): PohonKunci | null {
  if (Array.isArray(nilai)) return nilai.length ? pohonContoh(nilai[0]) : null
  if (nilai && typeof nilai === 'object') {
    return Object.fromEntries(Object.entries(nilai).map(([k, v]) => [k, pohonContoh(v)]))
  }
  return null
}

/** Pohon dengan kunci terurut — supaya toEqual membandingkan isi, bukan urutan. */
export function urutPohon(p: PohonKunci | null): PohonKunci | null {
  if (!p) return null
  return Object.fromEntries(Object.keys(p).sort().map(k => [k, urutPohon(p[k]!)]))
}

/** Badan (antara $$…$$) dan kepala definisi TERAKHIR sebuah fungsi. */
export function fungsiTerakhir(nama: string): { berkas: string; kepala: string; badan: string } {
  const pola = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${nama}\\s*\\(`, 'gi')
  let temu: { berkas: string; kepala: string; badan: string } | null = null
  for (const { nama: berkas, sql } of semuaMigrasi()) {
    for (const m of sql.matchAll(pola)) {
      const buka = sql.indexOf('$$', m.index)
      const tutup = sql.indexOf('$$', buka + 2)
      temu = { berkas, kepala: sql.slice(m.index, buka), badan: sql.slice(buka + 2, tutup) }
    }
  }
  if (!temu) throw new Error(`Fungsi ${nama} tidak ada di migrasi`)
  return temu
}

/** Parameter definisi TERAKHIR sebuah fungsi, urut sesuai server. `bawaan` =
 *  punya default (boleh tidak dikirim). Parameter OUT tidak ikut: PostgREST
 *  mencocokkan panggilan hanya dengan parameter masukan. */
export function parameterFungsi(nama: string): Array<{ nama: string; bawaan: boolean }> {
  const { kepala } = fungsiTerakhir(nama)
  return argumen(kepala, kepala.indexOf('('))
    .filter(a => a.length > 0)
    .map(a => /^(?:(in|out|inout|variadic)\s+)?(\w+)/i.exec(a))
    .filter((m): m is RegExpExecArray => !!m && m[1]?.toLowerCase() !== 'out')
    .map(m => ({ nama: m[2]!, bawaan: /\bdefault\b|=/i.test(m.input) }))
}

/** Kolom sebuah tabel: create table terakhir + add/drop column sesudahnya. */
export function kolomTabel(tabel: string): { kolom: string[]; definisi: Record<string, string> } {
  const buat = new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${tabel}\\s*\\(`, 'gi')
  const tambah = new RegExp(`alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?public\\.${tabel}\\s+add\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?(\\w+)([^;]*)`, 'gi')
  const buang = new RegExp(`alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?public\\.${tabel}\\s+drop\\s+column\\s+(?:if\\s+exists\\s+)?(\\w+)`, 'gi')
  const definisi = new Map<string, string>()
  for (const { sql } of semuaMigrasi()) {
    for (const m of sql.matchAll(buat)) {
      definisi.clear()
      for (const a of argumen(sql, m.index + m[0].length - 1)) {
        const nama = /^(\w+)/.exec(a)?.[1]
        if (!nama || /^(constraint|primary|unique|check|foreign|exclude)$/i.test(nama)) continue
        definisi.set(nama, a)
      }
    }
    for (const m of sql.matchAll(tambah)) definisi.set(m[1]!, `${m[1]}${m[2]}`)
    for (const m of sql.matchAll(buang)) definisi.delete(m[1]!)
  }
  return { kolom: [...definisi.keys()].sort(), definisi: Object.fromEntries(definisi) }
}

/** Kolom `returns table (…)` definisi TERAKHIR sebuah fungsi, urut sesuai server. */
export function kolomKembalian(nama: string): string[] {
  const { kepala } = fungsiTerakhir(nama)
  const m = /returns\s+table\s*\(/i.exec(kepala)
  if (!m) throw new Error(`${nama} tidak memulangkan table (…)`)
  return argumen(kepala, m.index + m[0].length - 1).map((a) => {
    const kolom = /^(\w+)/.exec(a)?.[1]
    if (!kolom) throw new Error(`Kolom tak terbaca di ${nama}: ${a}`)
    return kolom
  })
}

/** Folder toko/ repo CashFlow (alat & uji SQL produksi), saudara folder migrasi. */
export const DIR_TOKO = process.env.CASHFLOW_TOKO ?? resolve(DIR_MIGRASI, '../../toko')
