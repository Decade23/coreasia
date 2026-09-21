/**
 * Ikatan dokumen console: BFF hanya melayani permintaan dari dokumen /console.
 *
 * Masalahnya: console dan halaman publik (GTM, tag iklan) satu origin. Cookie
 * sesi HttpOnly memang tidak terbaca JS, tetapi ikut terkirim pada fetch
 * satu-asal dari halaman mana pun, dan Sec-Fetch-Site: same-origin juga
 * dipasang peramban untuk halaman publik. Tanpa lapis ini, skrip di /about bisa
 * memakai sesi admin lewat /api/gw/** dan mencetak sesi CashFlow.
 *
 * Caranya:
 *   - cookie HttpOnly `ikat` berisi nilai acak (dibuat saat navigasi console
 *     pertama, diganti saat login berhasil);
 *   - token ikatan = HMAC(kunci server, ikat). Token ini HANYA dikirim di HTML
 *     jawaban navigasi dokumen console (Sec-Fetch-Dest: document +
 *     Sec-Fetch-Mode: navigate, keduanya forbidden header) dan di jawaban
 *     login/verifikasi TOTP (butuh sandi atau kode);
 *   - setiap panggilan BFF wajib membawa token itu di header X-Konsol-Ikat.
 *
 * Kenapa halaman publik tidak bisa mendapatkannya:
 *   - fetch('/console') dari JS berdestinasi `empty`, bukan `document`, jadi
 *     tidak diberi token; jawaban console juga `no-store`, tidak masuk cache;
 *   - iframe console ditolak (X-Frame-Options: DENY, frame-ancestors 'none');
 *   - popup/opener console terputus oleh Cross-Origin-Opener-Policy: same-origin;
 *   - token hanya di memori dokumen console, tidak di storage mana pun.
 * Cookie `ikat` yang ditanam atau ditimpa skrip (cookie tossing, luapan jar)
 * tidak berguna tanpa kunci server, karena tokennya HMAC, bukan nilai cookie.
 *
 * Batasnya: klien non-peramban (curl) bisa mengarang Sec-Fetch-* dan
 * mendapatkan pasangan cookie+token untuk dirinya sendiri. Lapis ini menahan
 * JS di peramban korban, bukan penyerang yang punya sandi. XSS di dokumen
 * console sendiri juga tidak tertahan (itu tugas CSP console). Ikatan juga
 * tidak menahan PENANAMAN sesi milik penyerang lewat document.cookie: navigasi
 * console korban sendiri yang menerbitkan tokennya. Itu ditahan awalan
 * `__Host-Http-` (cookie.ts).
 *
 * MURNI (hanya node:crypto) supaya bisa diuji vitest.
 */
import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto'

const POLA_NILAI = /^[A-Za-z0-9_-]{43}$/
const INFO_HKDF = 'coreasia-konsol-ikat-v1'

/** Nilai cookie `ikat` yang sah: 32 byte acak dalam base64url (43 aksara). */
export const ikatSah = (v: string | null | undefined): v is string => typeof v === 'string' && POLA_NILAI.test(v)

export const buatIkat = (): string => randomBytes(32).toString('base64url')

/**
 * Kunci HMAC dari rahasia server. Urutan: NUXT_KONSOL_IKAT_KUNCI (disarankan,
 * minimal 32 aksara), lalu turunan kunci service-role CashFlow. HKDF dengan
 * info khusus, jadi token ikatan tidak pernah bisa dipakai sebagai kunci itu.
 * null bila keduanya tidak ada; pemanggil memakai kunci acak per proses.
 */
export function kunciIkatan(bahan: { khusus?: string | null; cadangan?: string | null }): Buffer | null {
  const khusus = (bahan.khusus ?? '').trim()
  const cadangan = (bahan.cadangan ?? '').trim()
  const sumber = khusus.length >= 32 ? khusus : cadangan
  if (!sumber) return null
  return Buffer.from(hkdfSync('sha256', sumber, '', INFO_HKDF, 32))
}

export const tokenIkatan = (kunci: Buffer, ikat: string): string =>
  createHmac('sha256', kunci).update(`ikat:${ikat}`).digest('base64url')

/** Waktu konstan; cookie atau header yang cacat = tidak cocok. */
export function cocokIkatan(kunci: Buffer, ikat: string | null | undefined, header: string | null | undefined): boolean {
  if (!ikatSah(ikat) || typeof header !== 'string' || !POLA_NILAI.test(header)) return false
  const harap = Buffer.from(tokenIkatan(kunci, ikat))
  const dapat = Buffer.from(header)
  return harap.length === dapat.length && timingSafeEqual(harap, dapat)
}

/**
 * true hanya untuk navigasi dokumen puncak (ketik URL, klik tautan, muat
 * ulang, popup). fetch/XHR (`empty`), iframe, object/embed, dan worker tidak.
 * Peramban tanpa Sec-Fetch-* tidak diberi token; BFF memang sudah menolak
 * peramban seperti itu lewat Sec-Fetch-Site.
 */
export function navigasiDokumen(h: { dest?: string | null; mode?: string | null }): boolean {
  return (h.dest ?? '').toLowerCase() === 'document' && (h.mode ?? '').toLowerCase() === 'navigate'
}

/** <meta> yang disisipkan ke head HTML console. Token base64url aman di atribut. */
export const metaIkatan = (nama: string, token: string): string => `<meta name="${nama}" content="${token}">`
