/**
 * Header keamanan statis (routeRules di nuxt.config.ts). Dipisah ke sini
 * supaya bisa diuji vitest; nuxt.config mengimpornya.
 *
 * Header keamanan dasar WAJIB ada di setiap aturan routeRules yang memasang
 * header. Di Vercel rute header pertama yang cocok menang dan header '/**'
 * TIDAK ikut digabung (lihat catatan '/preview/**' di nuxt.config), jadi
 * aturan yang lebih spesifik harus menyalinnya sendiri.
 */
export const HEADER_KEAMANAN_DASAR = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const

/**
 * Console (/console/**): header dasar + noindex, dengan dua pengetatan:
 *   - X-Frame-Options: DENY (CSP: frame-ancestors 'none'). SAMEORIGIN
 *     membolehkan halaman publik satu-asal yang memuat GTM membingkai console
 *     di iframe tersembunyi lalu membaca DOM-nya.
 *   - Cross-Origin-Opener-Policy: same-origin. Halaman publik tidak memasang
 *     COOP, jadi popup console yang dibuka dari sana (atau halaman publik yang
 *     dibuka dari console) masuk grup konteks lain: window.opener / rujukan
 *     window.open terputus dan DOM console tidak bisa dijangkau.
 *
 * CSP-nya SENGAJA tidak di sini: kebijakan console tanpa 'unsafe-inline' dan
 * tanpa domain GTM memuat hash skrip sebaris Nuxt (window.__NUXT__.config)
 * yang isinya bergantung env saat berjalan, jadi dihitung per jawaban oleh
 * server/plugins/konsol-csp.ts. Header statis di sini tidak boleh memuat CSP:
 * di Vercel ia bisa menimpa CSP ber-hash dari fungsi dan mematikan skrip
 * bawaan Nuxt.
 */
export const HEADER_KONSOL = {
  ...HEADER_KEAMANAN_DASAR,
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
} as const
