/**
 * Daftar RPC console = daftar RPC yang diuji di atas 0088.
 *
 * cashflow/toko/uji-console-rpc.sql memanggil SETIAP RPC console dengan sesi
 * console palsu di atas migrasi 0088 (yang menolak sesi console di v1 dan
 * mencabut dua RPC). Uji itu hanya berarti bila daftarnya sama dengan yang
 * benar-benar dipanggil useCashflowAdmin.ts. Di sini keduanya dibandingkan,
 * supaya RPC baru di fase berikutnya tidak lupa ikut diuji — dan RPC yang
 * dicabut 0088 tidak kembali lewat halaman mana pun.
 *
 * Berkas uji SQL ada di repo CashFlow (bukan repo ini); bila tidak ditemukan,
 * perbandingannya DILEWATI dan terlihat "skipped". Penjaga RPC terlarang
 * tetap berjalan.
 *
 * NAMA ARGUMEN. Uji SQL memanggil secara POSISIONAL, sedangkan PostgREST
 * memilih fungsi menurut NAMA argumen: salah ketik p_* di useCashflowAdmin
 * lolos dari uji SQL dan baru gagal di produksi (PGRST202). Maka kunci setiap
 * objek argumen rpc() dibandingkan juga dengan parameter definisi terakhir
 * fungsinya di migrasi — tidak ada kunci asing, tidak ada parameter wajib
 * yang tertinggal.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { adaMigrasi, DIR_TOKO, fungsiTerakhir, parameterFungsi } from './migrasi'
import { POLA_AUDIT_INVESTIGASI } from '../../adapters/cashflow'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const ADMIN = readFileSync(join(AKAR, 'composables/cashflow/useCashflowAdmin.ts'), 'utf8')
const BERKAS_UJI = join(DIR_TOKO, 'uji-console-rpc.sql')
const adaUji = existsSync(BERKAS_UJI)
const UJI = adaUji ? readFileSync(BERKAS_UJI, 'utf8') : ''

/** Pasangan metode → RPC di useCashflowAdmin: `nama: (…) => rpc<…>('admin_x'`. */
function rpcAdmin(): Map<string, string> {
  const peta = new Map<string, string>()
  for (const m of ADMIN.matchAll(/(\w+):\s*\([^)]*\)\s*=>\s*rpc\b[^(']*\(\s*'([a-z0-9_]+)'/g)) peta.set(m[1]!, m[2]!)
  return peta
}
/** Semua nama RPC yang dipanggil lewat rpc() — termasuk yang tidak berbentuk metode. */
function namaRpcAdmin(): string[] {
  return [...new Set([...ADMIN.matchAll(/\brpc\b[^(']*\(\s*'([a-z0-9_]+)'/g)].map(m => m[1]!))].sort()
}
/** Kunci tingkat teratas objek literal yang dibuka di `buka` ('{'). */
function kunciObjek(teks: string, buka: number): string[] {
  const kunci: string[] = []
  const tambah = (bagian: string) => {
    const b = bagian.trim()
    if (!b) return
    const k = /^(\w+)\s*(?::|$)/.exec(b)?.[1]
    if (!k) throw new Error(`Kunci argumen tak terbaca (spread/terhitung tidak bisa diperiksa): ${b}`)
    kunci.push(k)
  }
  let dalam = 0
  let awal = buka + 1
  for (let i = buka; i < teks.length; i++) {
    const c = teks[i]!
    if (c === "'" || c === '"' || c === '`') { i = teks.indexOf(c, i + 1); if (i < 0) break; continue }
    if ('({['.includes(c)) dalam++
    else if (')}]'.includes(c)) {
      if (--dalam === 0) { tambah(teks.slice(awal, i)); return kunci }
    } else if (c === ',' && dalam === 1) { tambah(teks.slice(awal, i)); awal = i + 1 }
  }
  throw new Error('Objek argumen tidak tertutup')
}
/** Setiap panggilan rpc('admin_x'[, {…}]): nama + kunci objek argumennya.
 *  Argumen yang bukan objek literal tidak bisa diperiksa → galat. */
function panggilanRpc(teks: string): Array<{ nama: string; kunci: string[] }> {
  const hasil: Array<{ nama: string; kunci: string[] }> = []
  for (const m of teks.matchAll(/\brpc\b[^(']*\(\s*'([a-z0-9_]+)'\s*([),])/g)) {
    const nama = m[1]!
    if (m[2] === ')') { hasil.push({ nama, kunci: [] }); continue }
    let i = m.index + m[0].length
    while (/\s/.test(teks[i] ?? '')) i++
    if (teks[i] !== '{') throw new Error(`${nama}: argumen rpc() harus objek literal`)
    hasil.push({ nama, kunci: kunciObjek(teks, i) })
  }
  return hasil
}
/** Selisih kunci yang dikirim dengan parameter fungsi di migrasi; [] = cocok. */
function selisihArgumen(teks: string): string[] {
  const galat: string[] = []
  for (const { nama, kunci } of panggilanRpc(teks)) {
    const param = parameterFungsi(nama)
    const namaParam = param.map(p => p.nama)
    for (const k of kunci) if (!namaParam.includes(k)) galat.push(`${nama}: ${k} bukan parameter (${namaParam.join(', ') || 'tanpa parameter'})`)
    for (const p of param) if (!p.bawaan && !kunci.includes(p.nama)) galat.push(`${nama}: ${p.nama} tanpa default tapi tidak dikirim`)
    if (new Set(kunci).size !== kunci.length) galat.push(`${nama}: kunci ganda`)
  }
  return galat
}
/** Nama RPC di blok ⟦rpc-console⟧ uji SQL. */
function namaRpcUji(): string[] {
  const awal = UJI.indexOf('⟦rpc-console⟧ awal')
  const akhir = UJI.indexOf('⟦rpc-console⟧ akhir')
  if (awal < 0 || akhir < awal) throw new Error('Blok ⟦rpc-console⟧ tidak ditemukan di uji-console-rpc.sql')
  return [...UJI.slice(awal, akhir).matchAll(/\[\s*'(admin_\w+)'\s*,/g)].map(m => m[1]!).sort()
}
/** Pasangan RPC ← metode di kepala uji SQL: `--   admin_x   ← metode`. */
function daftarKepalaUji(): Map<string, string> {
  return new Map([...UJI.matchAll(/^--\s+(admin_\w+)\s+←\s+(\w+)\s*$/gm)].map(m => [m[2]!, m[1]!]))
}

describe('useCashflowAdmin ↔ toko/uji-console-rpc.sql', () => {
  it('setiap panggilan rpc() di useCashflowAdmin adalah metode bernama (terbaca uji ini)', () => {
    expect([...new Set(rpcAdmin().values())].sort()).toEqual(namaRpcAdmin())
    expect(namaRpcAdmin().length).toBeGreaterThan(20)
  })

  it.skipIf(!adaUji)(`blok ⟦rpc-console⟧ memanggil persis RPC useCashflowAdmin (${BERKAS_UJI})`, () => {
    const uji = namaRpcUji()
    expect(new Set(uji).size).toBe(uji.length)
    expect(uji).toEqual(namaRpcAdmin())
  })

  it.skipIf(!adaUji)('daftar di kepala uji = pasangan metode → RPC di useCashflowAdmin', () => {
    const kepala = daftarKepalaUji()
    const admin = rpcAdmin()
    expect([...kepala.entries()].sort()).toEqual([...admin.entries()].sort())
  })

  it.skipIf(!adaUji)('uji menerapkan penjagaan 0088 dan berakhir rollback', () => {
    expect(UJI).toMatch(/pakai-versi-baru/)
    expect(UJI.trimEnd().endsWith('rollback;')).toBe(true)
  })

  it.skipIf(!adaMigrasi)('setiap RPC console ada di migrasi (bukan salah ketik)', () => {
    for (const nama of namaRpcAdmin()) expect(() => fungsiTerakhir(nama), nama).not.toThrow()
  })

  it.skipIf(!adaMigrasi)('nama argumen rpc() = parameter fungsi di migrasi (PostgREST memilih menurut nama)', () => {
    const panggilan = panggilanRpc(ADMIN)
    expect([...new Set(panggilan.map(p => p.nama))].sort()).toEqual(namaRpcAdmin())
    expect(selisihArgumen(ADMIN)).toEqual([])
  })

  it.skipIf(!adaMigrasi)('penjaga argumen menangkap salah ketik, kunci asing, dan parameter wajib yang hilang', () => {
    expect(selisihArgumen(`rpc<X>('admin_daftar_ruang_v2', { p_limit: 1, p_offset: 0, p_cari: a.trim() || null, p_tipe: j })`))
      .toEqual(['admin_daftar_ruang_v2: p_tipe bukan parameter (p_limit, p_offset, p_cari, p_jenis)'])
    expect(selisihArgumen(`rpc<X>('admin_baca_catatan_transaksi', { p_user: u, p_alasan: f(a, b) })`))
      .toEqual(['admin_baca_catatan_transaksi: p_ids tanpa default tapi tidak dikirim'])
    expect(selisihArgumen(`rpc<X>('admin_stats')`)).toEqual([])
    expect(() => panggilanRpc(`rpc<X>('admin_stats', args)`)).toThrow(/objek literal/)
  })

  it.skipIf(!adaUji)('uji SQL #41 menyaring audit investigasi dengan pola yang sama dengan adapter', () => {
    expect(UJI).toContain(`like '${POLA_AUDIT_INVESTIGASI}'`)
    // …dan mengirim alasan berbentuk rpc(): "[pelaku] INVESTIGASI — …", bukan tanpa pelaku.
    expect(UJI).toMatch(/c_investigasi\s+constant\s+text\s*:=\s*'\['\|\|c_pelaku\|\|'\] INVESTIGASI — '/)
    expect(UJI).not.toMatch(/'INVESTIGASI — '\s*\|\|\s*c_alasan/)
  })
})

/* 0088: sesi console ditolak di enam v1 ini (42501 pakai-versi-baru), dan
   admin_ukuran_keberhasilan v1 + admin_buka_email dicabut dari authenticated.
   Nama yang dikutip ('admin_x' / "admin_x" / `admin_x`) = nama yang dikirim
   sebagai RPC; komentar yang menyebutnya tanpa kutip tidak dihitung. */
const TERLARANG = [
  'admin_baca_transaksi', 'admin_detail_pengguna', 'admin_ekspor_pengguna', 'admin_daftar_ruang',
  'admin_daftar_config', 'admin_daftar_audit', 'admin_ukuran_keberhasilan', 'admin_buka_email',
]
const DIR_SUMBER = ['pages', 'components', 'composables', 'server', 'adapters', 'middleware', 'layouts', 'plugins', 'utils', 'stores']

function jelajah(dir: string, hasil: string[] = []): string[] {
  if (!existsSync(dir)) return hasil
  for (const nama of readdirSync(dir)) {
    const jalur = join(dir, nama)
    if (statSync(jalur).isDirectory()) jelajah(jalur, hasil)
    else if (/\.(ts|vue|js|mjs)$/.test(nama)) hasil.push(jalur)
  }
  return hasil
}

describe('tidak ada panggilan console ke RPC yang ditutup 0088', () => {
  it('useCashflowAdmin tidak memanggil v1 maupun RPC yang dicabut', () => {
    for (const nama of namaRpcAdmin()) expect(TERLARANG).not.toContain(nama)
  })

  it('tidak ada nama RPC terlarang yang dikutip di sumber landing', () => {
    const pola = new RegExp(`['"\`](${TERLARANG.join('|')})['"\`]`)
    const temuan = DIR_SUMBER.flatMap(d => jelajah(join(AKAR, d)))
      .flatMap(f => readFileSync(f, 'utf8').split('\n').map((baris, i) => ({ f, i, baris })))
      .filter(x => pola.test(x.baris))
      .map(x => `${relative(AKAR, x.f)}:${x.i + 1}  ${x.baris.trim()}`)
    expect(temuan).toEqual([])
  })

  it('bukaEmail sudah tidak ada', () => {
    expect(ADMIN).not.toMatch(/\bbukaEmail\b/)
  })
})
