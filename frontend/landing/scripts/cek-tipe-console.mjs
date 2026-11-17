// Pemeriksaan tipe yang sungguh berjalan untuk console (dan seluruh landing).
//
// KENAPA ADA. `vue-tsc --noEmit` di folder ini selalu keluar 0 dalam sekejap
// tanpa memeriksa apa pun: tsconfig.json di akar berisi `"files": []` dan hanya
// menunjuk .nuxt/tsconfig.json dan .nuxt/tsconfig.server.json lewat
// `references`. Rujukan itu hanya diikuti mode build (`-b`). Tanpa `-b`
// programnya nol berkas, jadi "0 galat" tidak berarti apa-apa.
//
// Skrip ini menunjuk proyeknya langsung (`-p .nuxt/tsconfig.app.json` dan
// `-p .nuxt/tsconfig.server.json`), lalu:
//   1. memastikan berkas console benar-benar masuk program (bukan hampa);
//   2. membandingkan galatnya dengan garis dasar di
//      scripts/tipe-console-dasar.json. Galat lama dicatat, tidak diperbaiki
//      di sini. Galat BARU menggagalkan (kode keluar 1).
//
// Jalankan sesudah `npx nuxi prepare` (folder .nuxt harus ada):
//   node scripts/cek-tipe-console.mjs            periksa terhadap garis dasar
//   node scripts/cek-tipe-console.mjs --tulis    tulis ulang garis dasar
//   node scripts/cek-tipe-console.mjs --rinci    cetak juga galat lama console
//
// vue-tsc tidak tercantum di package.json. Urutan pencariannya:
//   VUE_TSC=<jalur bin/vue-tsc.js atau perintah>, node_modules/.bin/vue-tsc,
//   lalu `npx` dengan versi yang dikunci di bawah (butuh jaringan sekali).
//
// Sidik galat sengaja tanpa nomor baris, supaya menyisipkan baris di atas galat
// lama tidak terbaca sebagai galat baru. Berkas console disimpan per galat
// (kode dan kalimat pertama). Berkas lain cukup jumlah per kode, karena satu
// berkas terjemahan saja menyumbang seribuan lebih.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const akar = join(dirname(fileURLToPath(import.meta.url)), '..')
const DASAR = join(akar, 'scripts', 'tipe-console-dasar.json')
const VERSI_VUE_TSC = '3.3.14'
const VERSI_TYPESCRIPT = '6.0.3'
const PROYEK = ['.nuxt/tsconfig.app.json', '.nuxt/tsconfig.server.json']
const tulis = process.argv.includes('--tulis')
const rinci = process.argv.includes('--rinci')

/** Berkas yang termasuk console: halaman, komponen, adapter, sesi, BFF, dan ujinya. */
const CAKUPAN = [
  /^pages\/console\//, /^layouts\/console\.vue$/, /^middleware\/(console|cashflow)/,
  /^components\/(cashflow|console|leadku|articles)\//, /^composables\/cashflow\//,
  /^composables\/use(Admin|Console|Konsol|DrafKonsol|ApiKeys|Articles|AuditLogs|BotSchedules|Briefs|CadConsole|Keywords|Permissions|ImageUpload|AIGenerate|Toast)/,
  /^adapters\//, /^utils\/cashflow\//, /^utils\/(konsol|rbac)\.ts$/, /^plugins\/konsol/,
  /^server\/api\/(admin|cashflow|gw)\//, /^server\/lib\/konsol\//, /^server\/(middleware|plugins)\/konsol/,
  /^tests\/(cashflow|konsol)\//,
]
/** Kalau salah satu dari ini tidak ikut diperiksa, pemeriksaannya dianggap hampa. */
const WAJIB_ADA = [
  'pages/console/cashflow/index.vue', 'pages/console/cashflow/hapus-akun.vue', 'components/cashflow/CashflowKeadaan.vue',
  'composables/cashflow/useCashflowAdmin.ts', 'adapters/cashflow.ts', 'server/api/cashflow/sesi.post.ts',
]
const dalamCakupan = berkas => CAKUPAN.some(p => p.test(berkas))

if (PROYEK.some(p => !existsSync(join(akar, p)))) {
  console.error('✖ .nuxt belum ada. Jalankan dulu: npx nuxi prepare')
  process.exit(2)
}

const lokal = join(akar, 'node_modules', '.bin', 'vue-tsc')
const perintah = process.env.VUE_TSC
  ? (process.env.VUE_TSC.endsWith('.js') ? [process.execPath, process.env.VUE_TSC] : [process.env.VUE_TSC])
  : existsSync(lokal)
    ? [lokal]
    : ['npx', '--yes', '-p', `vue-tsc@${VERSI_VUE_TSC}`, '-p', `typescript@${VERSI_TYPESCRIPT}`, 'vue-tsc']

/* Jalur mutlak tidak boleh masuk garis dasar (repo ini publik, dan jalurnya
   berbeda di tiap mesin). node_modules bisa berupa symlink, jadi jalur aslinya
   ikut dibuang. */
const awalan = [akar]
for (const p of [akar, join(akar, 'node_modules')]) { try { awalan.push(realpathSync(p)) } catch { /* Tidak ada: lewati. */ } }
awalan.sort((a, b) => b.length - a.length)
const tanpaJalur = (teks) => {
  let t = teks
  for (const a of awalan) t = t.split(a + sep).join('').split(a).join('.')
  return t.replace(/(["'(])\/(?:[^"'()\s/]+\/)+node_modules\//g, '$1node_modules/')
}

/** @returns {{ berkas: Set<string>, galat: Map<string, { berkas: string, kode: string, pesan: string }> }} */
function periksa(proyek) {
  const r = spawnSync(perintah[0], [...perintah.slice(1), '--noEmit', '--pretty', 'false', '--listFiles', '-p', proyek], {
    cwd: akar, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  })
  if (r.error) {
    console.error(`✖ vue-tsc tidak bisa dijalankan (${r.error.message}). Setel VUE_TSC ke bin/vue-tsc.js.`)
    process.exit(2)
  }
  const berkas = new Set()
  const galat = new Map()
  for (const baris of `${r.stdout}\n${r.stderr}`.split('\n')) {
    const g = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/.exec(baris)
    if (g) {
      const b = relative(akar, join(akar, g[1])).split(sep).join('/')
      galat.set(`${b}:${g[2]}:${g[3]}:${g[4]}`, { berkas: b, kode: g[4], pesan: tanpaJalur(g[5]) })
      continue
    }
    if (baris.startsWith(akar + sep)) {
      const b = relative(akar, baris.trim()).split(sep).join('/')
      if (!b.startsWith('node_modules/') && !b.startsWith('.nuxt/')) berkas.add(b)
    } else if (/^error TS\d+/.test(baris)) {
      console.error(`✖ ${proyek}: ${baris}`)
      process.exit(2)
    }
  }
  return { berkas, galat }
}

const berkas = new Set()
const galat = new Map()
for (const p of PROYEK) {
  const h = periksa(p)
  for (const b of h.berkas) berkas.add(b)
  // Berkas yang ikut di kedua proyek (uji mengimpor kode server) dihitung sekali.
  for (const [k, v] of h.galat) galat.set(k, v)
}

const console_ = [...berkas].filter(dalamCakupan)
const hilang = WAJIB_ADA.filter(b => !berkas.has(b))
if (hilang.length || console_.length < 100) {
  console.error(`✖ Pemeriksaan hampa: ${berkas.size} berkas diperiksa, ${console_.length} di antaranya console.`)
  for (const b of hilang) console.error(`  tidak ikut diperiksa: ${b}`)
  process.exit(2)
}

/** Bentuk garis dasar: console per galat, sisanya jumlah per kode. */
const kini = { console: {}, lain: {} }
for (const g of galat.values()) {
  if (dalamCakupan(g.berkas)) (kini.console[g.berkas] ??= []).push(`${g.kode}: ${g.pesan}`)
  else { const k = (kini.lain[g.berkas] ??= {}); k[g.kode] = (k[g.kode] ?? 0) + 1 }
}
const urutKunci = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, Array.isArray(o[k]) ? [...o[k]].sort() : urutKunci(o[k])]))
const rapi = { console: urutKunci(kini.console), lain: Object.fromEntries(Object.keys(kini.lain).sort().map(k => [k, Object.fromEntries(Object.keys(kini.lain[k]).sort().map(c => [c, kini.lain[k][c]]))])) }
const jumlahConsole = Object.values(rapi.console).reduce((s, a) => s + a.length, 0)
const jumlahLain = Object.values(rapi.lain).reduce((s, o) => s + Object.values(o).reduce((a, b) => a + b, 0), 0)

console.log(`Diperiksa ${berkas.size} berkas, ${console_.length} di antaranya console.`)
console.log(`Galat tipe: ${jumlahConsole + jumlahLain} (console ${jumlahConsole} di ${Object.keys(rapi.console).length} berkas, lainnya ${jumlahLain} di ${Object.keys(rapi.lain).length} berkas).`)

if (tulis) {
  const isi = JSON.stringify({
    catatan: 'Galat tipe lama, dicatat supaya galat baru kelihatan. Ditulis scripts/cek-tipe-console.mjs --tulis. Jangan disunting tangan.',
    alat: { 'vue-tsc': VERSI_VUE_TSC, typescript: VERSI_TYPESCRIPT },
    jumlah: { console: jumlahConsole, lain: jumlahLain },
    ...rapi,
  }, null, 2)
  if (/\/(Users|home)\//.test(isi)) {
    console.error('✖ Garis dasar memuat jalur mutlak. Tidak ditulis.')
    process.exit(2)
  }
  writeFileSync(DASAR, `${isi}\n`)
  console.log(`Garis dasar ditulis: ${relative(akar, DASAR)}`)
  process.exit(0)
}

if (!existsSync(DASAR)) {
  console.error(`✖ Garis dasar belum ada (${relative(akar, DASAR)}). Tulis dengan --tulis.`)
  process.exit(2)
}
const dasar = JSON.parse(readFileSync(DASAR, 'utf8'))
const baru = []
let hilangLama = 0
for (const [b, daftar] of Object.entries(rapi.console)) {
  const sisa = [...(dasar.console?.[b] ?? [])]
  for (const g of daftar) {
    const i = sisa.indexOf(g)
    if (i >= 0) sisa.splice(i, 1)
    else baru.push(`${b}  ${g}`)
  }
  hilangLama += sisa.length
}
for (const [b, daftar] of Object.entries(dasar.console ?? {})) if (!rapi.console[b]) hilangLama += daftar.length
for (const [b, perKode] of Object.entries(rapi.lain)) {
  for (const [kode, n] of Object.entries(perKode)) {
    const lama = dasar.lain?.[b]?.[kode] ?? 0
    if (n > lama) baru.push(`${b}  ${kode} bertambah ${n - lama} (dari ${lama} jadi ${n})`)
    else hilangLama += lama - n
  }
}
for (const [b, perKode] of Object.entries(dasar.lain ?? {})) {
  for (const [kode, n] of Object.entries(perKode)) if (!rapi.lain[b]?.[kode]) hilangLama += n
}

if (rinci) for (const [b, daftar] of Object.entries(rapi.console)) for (const g of daftar) console.log(`  lama  ${b}  ${g}`)
if (hilangLama) console.log(`${hilangLama} galat lama sudah tidak ada. Perbarui garis dasar dengan --tulis.`)
if (baru.length) {
  console.error(`✖ ${baru.length} galat tipe baru:`)
  for (const g of baru) console.error(`  ${g}`)
  process.exit(1)
}
console.log('✓ Tidak ada galat tipe baru.')
