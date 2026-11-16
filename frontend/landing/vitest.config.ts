/**
 * Uji unit landing — fungsi MURNI (adapters/, pembantu tanpa Nuxt), dan
 * komponen tampilan yang tidak memakai apa pun dari Nuxt.
 *
 * Sengaja tanpa @nuxt/test-utils: yang diuji di sini kontrak bentuk data server
 * dan hitungan waktu/urut. Memuat Nuxt penuh untuk itu hanya memperlambat dan
 * menambah ketergantungan. Komponen yang hanya menerima props (pil segmen,
 * bingkai tabel, keadaan daftar, maskot) dirender ke teks lewat
 * vue/server-renderer. Supaya berkas .vue bisa diimpor uji, `sfcUntukUji` di
 * bawah mengompilasinya dengan vue/compiler-sfc dan vite, dua-duanya
 * dependensi langsung di package.json. Sengaja tidak memakai
 * @vitejs/plugin-vue: paket itu hanya ikut terpasang lewat Nuxt dan tidak
 * tercantum di package.json, jadi bisa hilang saat Nuxt berganti versi.
 *
 * TZ dipaksa ke zona yang BUKAN WIB. Kalau uji berjalan di mesin ber-zona
 * Asia/Jakarta, fungsi yang lupa memakai timeZone tetap lulus — dan bug-nya
 * baru terlihat di peramban staf yang zonanya lain.
 */
import { fileURLToPath } from 'node:url'
import { transformWithEsbuild, type Plugin } from 'vite'
import { compileScript, parse } from 'vue/compiler-sfc'
import { defineConfig } from 'vitest/config'

/**
 * Kompilasi SFC secukupnya untuk uji: <script setup> beserta templatnya jadi
 * satu modul. Gaya (<style>) dilewati, uji tidak membutuhkannya. Komponen
 * tanpa <script setup> ditolak dengan pesan yang jelas.
 */
const sfcUntukUji = (): Plugin => ({
  name: 'sfc-untuk-uji',
  async transform(kode, id) {
    if (!id.endsWith('.vue')) return null
    const { descriptor, errors } = parse(kode, { filename: id })
    if (errors.length) throw errors[0]
    if (!descriptor.scriptSetup) throw new Error(`sfc-untuk-uji: ${id} tidak memakai <script setup>`)
    const hasil = compileScript(descriptor, { id: 'uji', inlineTemplate: true })
    const ts = descriptor.scriptSetup.lang === 'ts'
    const js = await transformWithEsbuild(hasil.content, `${id}.${ts ? 'ts' : 'js'}`, { loader: ts ? 'ts' : 'js', target: 'esnext' })
    return { code: js.code, map: null }
  },
})

/* Alias `~` = akar landing, sama dengan Nuxt (srcDir di akar), supaya berkas
   yang memakai `~/adapters/...` bisa diuji tanpa memuat Nuxt. `#imports`
   (modul virtual Nuxt, dipakai server/lib/konsol/h3.ts) diarahkan ke
   pengganti yang meneruskan ke global tiruan uji — lihat tests/nuxt-imports.ts. */
const akar = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '')

export default defineConfig({
  plugins: [sfcUntukUji()],
  resolve: { alias: { '~': akar, '#imports': `${akar}/tests/nuxt-imports.ts` } },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { TZ: 'America/Los_Angeles' },
  },
})
