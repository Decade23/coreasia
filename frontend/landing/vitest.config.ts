/**
 * Uji unit landing — hanya fungsi MURNI (adapters/, pembantu tanpa Nuxt).
 *
 * Sengaja tanpa @nuxt/test-utils: yang diuji di sini kontrak bentuk data server
 * dan hitungan waktu/urut, bukan komponen. Memuat Nuxt penuh untuk itu hanya
 * memperlambat dan menambah ketergantungan.
 *
 * TZ dipaksa ke zona yang BUKAN WIB. Kalau uji berjalan di mesin ber-zona
 * Asia/Jakarta, fungsi yang lupa memakai timeZone tetap lulus — dan bug-nya
 * baru terlihat di peramban staf yang zonanya lain.
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/* Alias `~` = akar landing, sama dengan Nuxt (srcDir di akar), supaya berkas
   yang memakai `~/adapters/...` bisa diuji tanpa memuat Nuxt. */
const akar = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '')

export default defineConfig({
  resolve: { alias: { '~': akar } },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { TZ: 'America/Los_Angeles' },
  },
})
