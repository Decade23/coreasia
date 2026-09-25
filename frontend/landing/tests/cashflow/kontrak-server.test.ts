/**
 * Kontrak BFF (server Nitro) ↔ migrasi CashFlow: RPC service_role dan kolom
 * admin_konsol_sesi yang dipakai server/.
 *
 * Uji handler (tests/konsol/bff-handler.test.ts) meniru klien Supabase, jadi
 * salah ketik nama RPC atau nama argumen p_* lolos di sana dan baru gagal di
 * produksi (PGRST202) — padahal jalur pencabutan sengaja "tidak pernah
 * melempar": sesi CashFlow admin yang keluar diam-diam tetap hidup. Di sini
 * setiap rpc() di server/ (termasuk pasangan ['nama', { p_* }] di
 * lib/konsol/cashflow-cabut.ts) dicocokkan dengan definisi TERAKHIR fungsinya.
 *
 * RPC per id admin gateway dan kolom admin_gw_id baru ada sejak 0092
 * (kontrak lintas jalur 1–2). Sebelum 0092 ada di folder migrasi, uji ini
 * DILEWATI dan terlihat "skipped".
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { adaMigrasiNomor, kolomTabel, parameterFungsi } from './migrasi'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
function jelajah(dir: string, hasil: string[] = []): string[] {
  if (!existsSync(dir)) return hasil
  for (const nama of readdirSync(dir)) {
    const jalur = join(dir, nama)
    if (statSync(jalur).isDirectory()) jelajah(jalur, hasil)
    else if (nama.endsWith('.ts')) hasil.push(jalur)
  }
  return hasil
}
const SERVER = jelajah(join(AKAR, 'server')).map(f => ({ f: relative(AKAR, f), isi: readFileSync(f, 'utf8') }))

/** rpc('admin_x', { p_a: …, p_b }) dan ['admin_x', { p_a: … }] → nama + kunci argumen. */
function panggilanRpc(): Array<{ berkas: string; nama: string; kunci: string[] }> {
  const hasil: Array<{ berkas: string; nama: string; kunci: string[] }> = []
  for (const { f, isi } of SERVER) {
    for (const m of isi.matchAll(/(?:\brpc\(\s*|\[\s*)'([a-z0-9_]+)'\s*(?:,\s*\{([^}]*)\})?\s*[)\]]/g)) {
      if (!m[1]!.startsWith('admin_') && !m[1]!.startsWith('otp_')) continue
      const kunci = (m[2] ?? '').split(',').map(b => /^\s*(\w+)/.exec(b)?.[1]).filter((k): k is string => !!k)
      hasil.push({ berkas: f, nama: m[1]!, kunci })
    }
  }
  return hasil
}

const ADA_0092 = adaMigrasiNomor('0092')

describe('kontrak server/ ↔ migrasi CashFlow (0092)', () => {
  it('pemindai menemukan jalur pencabutan per id; jalur per email sudah dibuang dari server/', () => {
    const nama = new Set(panggilanRpc().map(p => p.nama))
    for (const n of ['admin_konsol_sesi_cabut_admin', 'admin_kasus_tutup_admin']) expect(nama, n).toContain(n)
    // Sesudah transisi paket A tidak ada sesi tanpa id yang hidup; cabut per
    // label email bisa mengenai admin lain. RPC-nya tetap ada di SQL (runbook).
    const perEmail = panggilanRpc().filter(p => ['admin_konsol_sesi_cabut_pelaku', 'admin_kasus_tutup_pelaku'].includes(p.nama))
    expect(perEmail.map(p => `${p.berkas}: ${p.nama}`)).toEqual([])
  })

  it.skipIf(!ADA_0092)('setiap RPC di server/ ada, dengan nama argumen yang persis sama (tanpa kunci asing, tanpa parameter wajib tertinggal)', () => {
    const salah: string[] = []
    for (const p of panggilanRpc()) {
      let param: Array<{ nama: string; bawaan: boolean }>
      try {
        param = parameterFungsi(p.nama)
      } catch {
        salah.push(`${p.berkas}: ${p.nama} tidak ada di migrasi`)
        continue
      }
      const kenal = new Set(param.map(x => x.nama))
      for (const k of p.kunci) if (!kenal.has(k)) salah.push(`${p.berkas}: ${p.nama} tidak punya ${k}`)
      for (const x of param) if (!x.bawaan && !p.kunci.includes(x.nama)) salah.push(`${p.berkas}: ${p.nama} butuh ${x.nama}`)
    }
    expect(salah).toEqual([])
  })

  it.skipIf(!ADA_0092)('kolom yang ditulis sesi.post.ts ke admin_konsol_sesi ada (admin_gw_id sejak 0092)', () => {
    const isi = SERVER.find(x => x.f.endsWith('api/cashflow/sesi.post.ts'))!.isi
    const m = /from\('admin_konsol_sesi'\)\.insert\(\{([^}]*)\}\)/.exec(isi)
    expect(m).not.toBeNull()
    const kolom = m![1]!.split(',').map(b => /^\s*(\w+)/.exec(b)?.[1]).filter((k): k is string => !!k)
    expect(kolom).toContain('admin_gw_id')
    expect(kolomTabel('admin_konsol_sesi').kolom).toEqual(expect.arrayContaining(kolom))
  })

  it.skipIf(!ADA_0092)('kolom yang DIBACA server/ dari admin_konsol_sesi ada; DELETE /api/cashflow/sesi membaca admin_gw_id', () => {
    // Salah ketik nama kolom di select() = PostgREST menjawab galat, handler
    // membaca baris kosong, dan pencabutan per id (F3) diam-diam tidak jalan.
    const ada = new Set(kolomTabel('admin_konsol_sesi').kolom)
    const dibaca: Array<{ f: string; kolom: string[] }> = []
    for (const { f, isi } of SERVER) {
      for (const m of isi.matchAll(/from\('admin_konsol_sesi'\)\s*\.select\('([^']*)'\)/g)) {
        dibaca.push({ f, kolom: m[1]!.split(',').map(k => k.trim()).filter(Boolean) })
      }
    }
    const hapus = dibaca.find(x => x.f.endsWith('api/cashflow/sesi.delete.ts'))
    expect(hapus?.kolom).toEqual(expect.arrayContaining(['admin_gw_id']))
    for (const x of dibaca) for (const k of x.kolom) expect(ada.has(k), `${x.f}: ${k}`).toBe(true)
  })
})
