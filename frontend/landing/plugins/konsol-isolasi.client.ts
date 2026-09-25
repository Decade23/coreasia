/**
 * Batas antar-jenis dokumen: publik ↔ console ↔ login console (Fase 0c).
 *
 * Saat dokumen dimuat:
 *   - dokumen console & login: token ikatan dibaca dari <meta> lalu elemennya
 *     dibuang (useKonsolIkatan). Sesudah ini token hanya ada di memori;
 *   - dokumen publik & login: sesi Supabase CashFlow yang tertinggal di
 *     sessionStorage tab ini dihapus (di dokumen publik SEBELUM GTM termuat).
 *     sessionStorage per tab, bukan per path: tanpa ini, console → halaman
 *     publik di tab yang sama membuat token CashFlow (akses + refresh) terbaca
 *     tag GTM, dan login admin lain di tab yang sama mewarisi sesi CashFlow
 *     admin sebelumnya. Console yang dibuka lagi mencetak sesi baru;
 *   - dokumen publik: draf form console (useDrafKonsol) di sessionStorage tab
 *     ini dihapus sebelum GTM termuat. Draf hanya perlu bertahan melewati muat
 *     ulang console dan halaman login;
 *   - cookie token lama (sebelum 0c) yang dulu dipasang dari JS dihapus.
 *
 * Dokumen publik yang dipulihkan dari back/forward cache (Back dari console)
 * tidak memuat ulang plugin ini, padahal console di tab yang sama bisa sudah
 * menulis token CashFlow ke sessionStorage. Karena itu dokumen publik juga
 * memasang pendengar pageshow (persisted → sisa console dibuang, dokumen
 * dimuat ulang), sebelum GTM termuat (utils/konsol.ts pasangPembersihBfcache,
 * temuan F8).
 *
 * Navigasi SPA yang berpindah jenis dokumen (utils/konsol.ts jenisDokumen)
 * selalu jadi muat ulang dokumen penuh, karena kebijakannya melekat pada
 * dokumen:
 *   - publik → console/login: dokumen baru tanpa GTM, dengan CSP console, dan
 *     hanya navigasi dokumen yang diberi token ikatan oleh server;
 *   - console → login (sesi habis, keluar): dokumen login punya connect-src ke
 *     gateway publik, dokumen console tidak. Login di dokumen console akan
 *     ditolak CSP-nya sendiri;
 *   - login → console (berhasil masuk): token dan tantangan MFA yang sempat
 *     ada di memori halaman login ikut dibuang bersama dokumennya;
 *   - console → publik: halaman publik yang dirender di dokumen console akan
 *     kehilangan GTM dan panggilan gateway-nya.
 * Termasuk navigasi awal yang dialihkan middleware (mis. /console/users tanpa
 * sesi → /console/login). Lapis kedua ada di layout console & halaman login
 * (useKonsolBersih).
 */
import { ikatanKonsol } from '~/composables/useKonsolIkatan'
import { hapusCookieLama, hapusSisaKonsol, jenisDokumen, pasangPembersihBfcache } from '~/utils/konsol'

export default defineNuxtPlugin(() => {
  hapusCookieLama(document, window.location.protocol === 'https:')

  // Jenis dokumen ini ditetapkan sekali, dari URL yang benar-benar dimuat.
  const jenis = jenisDokumen(window.location.pathname)

  if (jenis !== 'publik') ikatanKonsol()
  if (jenis !== 'konsol') hapusSisaKonsol(() => window.sessionStorage, jenis === 'publik')
  if (jenis === 'publik') pasangPembersihBfcache(window)

  const router = useRouter()
  router.beforeEach((to) => {
    if (jenisDokumen(to.path) === jenis) return
    window.location.assign(to.fullPath)
    return false
  })
})
