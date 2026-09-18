#!/usr/bin/env node
/**
 * Setiap tag <Cashflow…> di pages/, components/, dan layouts/ harus terdaftar
 * di .nuxt/components.d.ts.
 *
 * Kenapa perlu: komponen didaftarkan TANPA awalan folder (pathPrefix:false),
 * jadi components/cashflow/Palet.vue terdaftar sebagai <Palet>, bukan
 * <CashflowPalet>. Tag yang tidak dikenal dirender kosong tanpa galat, dan
 * vue-tsc tidak menangkapnya — halaman terlihat "jalan" dengan satu bagian
 * yang hilang diam-diam.
 *
 * .nuxt basi diperiksa dari dua arah — keduanya membuat pemeriksaan di atas
 * lolos palsu:
 * - berkas Cashflow*.vue yang belum ada di components.d.ts;
 * - entri Cashflow* di components.d.ts yang berkasnya sudah tidak ada (mis.
 *   CashflowPalet.vue diganti nama jadi Palet.vue tanpa `nuxi prepare`: d.ts
 *   lama masih memuat CashflowPalet, jadi <CashflowPalet> dianggap terdaftar).
 * Jalankan `npx nuxi prepare` lalu ulangi.
 *
 * Keluar 0 bila lulus, 1 bila ada tag/berkas yang tidak terdaftar, 2 bila
 * components.d.ts belum ada.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const akar = join(dirname(fileURLToPath(import.meta.url)), '..')
const dts = join(akar, '.nuxt', 'components.d.ts')

if (!existsSync(dts)) {
  console.error('✗ .nuxt/components.d.ts belum ada. Jalankan `npx nuxi prepare` lalu ulangi.')
  process.exit(2)
}

const isiDts = readFileSync(dts, 'utf8')
const terdaftar = new Set([...isiDts.matchAll(/export const (\w+)\s*:/g)].map(m => m[1]))
/* Jalur berkas tiap entri: `export const X: typeof import("../components/…vue")['default']`
   (juga bentuk LazyComponent<typeof import(…)>). Relatif terhadap .nuxt/. */
const jalurEntri = new Map(
  [...isiDts.matchAll(/export const (\w+)\s*:[^\n]*?typeof import\("([^"]+)"\)/g)]
    .map(m => [m[1], resolve(dirname(dts), m[2])]),
)

function jelajah(dir, hasil = []) {
  if (!existsSync(dir)) return hasil
  for (const nama of readdirSync(dir)) {
    const jalur = join(dir, nama)
    if (statSync(jalur).isDirectory()) jelajah(jalur, hasil)
    else if (nama.endsWith('.vue')) hasil.push(jalur)
  }
  return hasil
}

const keTagPascal = tag => tag.includes('-')
  ? tag.split('-').map(b => b.charAt(0).toUpperCase() + b.slice(1)).join('')
  : tag

const berkas = ['pages', 'components', 'layouts'].flatMap(d => jelajah(join(akar, d)))
const galat = []
let jumlahTag = 0

for (const f of berkas) {
  const isi = readFileSync(f, 'utf8')
  // Hanya bagian <template>: tag di dalam komentar skrip bukan pemakaian.
  const awal = isi.indexOf('<template')
  const akhir = isi.lastIndexOf('</template>')
  if (awal < 0 || akhir < 0) continue
  const templat = isi.slice(awal, akhir)
  const baris = isi.slice(0, awal).split('\n').length
  for (const m of templat.matchAll(/<((?:Lazy)?Cashflow[A-Z][A-Za-z0-9]*|(?:lazy-)?cashflow-[a-z0-9-]+)(?=[\s/>])/g)) {
    jumlahTag++
    const nama = keTagPascal(m[1])
    if (!terdaftar.has(nama)) {
      const noBaris = baris + templat.slice(0, m.index).split('\n').length - 1
      galat.push(`${relative(akar, f)}:${noBaris}  <${m[1]}> tidak terdaftar sebagai komponen`)
    }
  }
}

// .nuxt basi (1): entri Cashflow* yang berkasnya sudah tidak ada di disk.
for (const [nama, jalur] of jalurEntri) {
  // Lazy* menunjuk berkas yang sama; cukup dilaporkan sekali.
  if (nama.startsWith('Cashflow') && !existsSync(jalur)) {
    galat.push(`.nuxt/components.d.ts  ${nama} menunjuk ${relative(akar, jalur)} yang sudah tidak ada — .nuxt basi (jalankan \`npx nuxi prepare\`)`)
  }
}

// .nuxt basi (2): berkas Cashflow*.vue yang tidak dikenal .nuxt.
for (const f of jelajah(join(akar, 'components'))) {
  const nama = basename(f, '.vue').replace(/\.(client|server)$/, '')
  if (nama.startsWith('Cashflow') && !terdaftar.has(nama)) {
    galat.push(`${relative(akar, f)}  belum ada di .nuxt/components.d.ts (jalankan \`npx nuxi prepare\`)`)
  }
}

if (galat.length) {
  console.error(`✗ ${galat.length} masalah komponen CashFlow:`)
  for (const g of galat) console.error(`  ${g}`)
  process.exit(1)
}
console.log(`✓ ${jumlahTag} tag <Cashflow…> di ${berkas.length} berkas .vue — semuanya terdaftar.`)
