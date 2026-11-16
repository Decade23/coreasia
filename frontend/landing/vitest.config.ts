/**
 * Uji unit landing — fungsi MURNI (adapters/, pembantu tanpa Nuxt), dan
 * komponen tampilan yang tidak memakai apa pun dari Nuxt.
 *
 * Sengaja tanpa @nuxt/test-utils: yang diuji di sini kontrak bentuk data server
 * dan hitungan waktu/urut. Memuat Nuxt penuh untuk itu hanya memperlambat dan
 * menambah ketergantungan. Komponen yang hanya menerima props (pil segmen,
 * bingkai tabel, keadaan daftar) dirender ke teks lewat vue/server-renderer:
 * plugin Vue di bawah hanya supaya berkas .vue bisa diimpor uji.
 *
 * TZ dipaksa ke zona yang BUKAN WIB. Kalau uji berjalan di mesin ber-zona
 * Asia/Jakarta, fungsi yang lupa memakai timeZone tetap lulus — dan bug-nya
 * baru terlihat di peramban staf yang zonanya lain.
 */
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/* Alias `~` = akar landing, sama dengan Nuxt (srcDir di akar), supaya berkas
   yang memakai `~/adapters/...` bisa diuji tanpa memuat Nuxt. `#imports`
   (modul virtual Nuxt, dipakai server/lib/konsol/h3.ts) diarahkan ke
   pengganti yang meneruskan ke global tiruan uji — lihat tests/nuxt-imports.ts. */
const akar = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '')

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '~': akar, '#imports': `${akar}/tests/nuxt-imports.ts` } },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { TZ: 'America/Los_Angeles' },
  },
})
