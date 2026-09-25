/**
 * Pembantu MURNI console yang dipakai klien (plugin, layout, halaman login)
 * dan server (plugin CSP). Tanpa Vue/Nuxt supaya bisa diuji vitest.
 */

/** Segmen pertama path, di-decode (%63 → c) dan huruf kecil. */
function segmenPertama(path: string): { mentah: string; kanon: string; sisa: string } {
  const p = path.split(/[?#]/)[0] ?? ''
  const m = /^\/([^/]*)(.*)$/.exec(p)
  if (!m) return { mentah: '', kanon: '', sisa: '' }
  const mentah = m[1] ?? ''
  let kanon = mentah
  try {
    kanon = decodeURIComponent(mentah)
  } catch { /* encoding rusak: pakai apa adanya */ }
  return { mentah, kanon: kanon.toLowerCase(), sisa: m[2] ?? '' }
}

/**
 * /console, /console/, dan semua turunannya (query/hash diabaikan).
 *
 * TIDAK peka huruf dan encoding: vue-router mencocokkan rute tanpa peduli
 * huruf, jadi /Console/login tetap merender halaman login console. Penjaga
 * yang peka huruf (GTM, iklan, CSP) akan meloloskannya.
 */
export const jalurKonsol = (path: string): boolean => segmenPertama(path).kanon === 'console'

/**
 * Bentuk kanonik untuk path console yang ditulis beda huruf/encoding
 * (/Console/login, /%63onsole) → '/console/login'. null bila path sudah
 * kanonik atau bukan console. Hanya segmen pertama yang diubah: sisa path
 * (id, slug) dan query dipertahankan apa adanya. Dipakai
 * server/middleware/konsol-kanon.ts untuk mengalihkan 301 sebelum renderer
 * berjalan, sehingga routeRules '/console/**' (header, ssr:false) dan CSP
 * console selalu berlaku.
 */
export function kanonKonsol(pathDenganQuery: string): string | null {
  const s = segmenPertama(pathDenganQuery)
  if (s.kanon !== 'console' || s.mentah === 'console') return null
  const potong = pathDenganQuery.search(/[?#]/)
  const ekor = potong < 0 ? '' : pathDenganQuery.slice(potong)
  return `/console${s.sisa}${ekor}`
}

/* ───────────── jenis dokumen: publik · console · login console ───────────── */

/**
 * /console/login (garis miring akhir, query, huruf, dan encoding diabaikan;
 * vue-router juga tidak peka huruf).
 */
export function halamanLoginKonsol(path: string): boolean {
  const s = segmenPertama(path)
  if (s.kanon !== 'console') return false
  let sisa = s.sisa
  try {
    sisa = decodeURIComponent(sisa)
  } catch { /* encoding rusak: pakai apa adanya */ }
  return /^\/login\/?$/i.test(sisa)
}

/**
 * Tiga jenis dokumen dengan kebijakan berbeda:
 *   - publik : GTM dan tag iklan, CSP longgar;
 *   - konsol : tanpa GTM, CSP ber-hash, connect-src hanya BFF + Supabase;
 *   - login  : seperti konsol, tetapi connect-src juga mengizinkan gateway
 *              publik, karena sandi dan kode TOTP dikirim peramban LANGSUNG ke
 *              gateway (pembatas & audit gateway melihat IP admin yang asli).
 * Kebijakan melekat pada dokumen, jadi berpindah jenis selalu memuat ulang
 * dokumen penuh (plugins/konsol-isolasi.client.ts). Efek sampingnya disengaja:
 * token dan tantangan MFA di memori halaman login ikut dibuang saat masuk.
 */
export type JenisDokumen = 'publik' | 'konsol' | 'login'

export const jenisDokumen = (path: string): JenisDokumen =>
  halamanLoginKonsol(path) ? 'login' : jalurKonsol(path) ? 'konsol' : 'publik'

/** Origin http(s) dari sebuah URL (runtimeConfig). Nilai rusak → null. */
export function originHttp(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.origin : null
  } catch {
    return null
  }
}

/** Detik tunggu dari pesan 429 gateway ("… Coba lagi dalam N menit."), untuk
 *  jawaban yang tidak membawa Retry-After (atau header itu tidak terbaca JS
 *  lintas asal). null bila tidak terbaca. */
export function detikDariPesan(pesan: string | null | undefined): number | null {
  const m = /(\d+)\s*menit/i.exec(pesan ?? '')
  if (!m) return null
  const menit = Number(m[1])
  return Number.isFinite(menit) && menit > 0 && menit <= 24 * 60 ? menit * 60 : null
}

/* ───────────── ikatan dokumen console (Fase 0c, putaran 1) ───────────── */

/** Nama <meta> tempat server menitipkan token ikatan di HTML console. */
export const META_IKATAN = 'ca-konsol-ikat'
/** Header yang wajib dibawa setiap panggilan BFF dari dokumen console. */
export const HEADER_IKATAN = 'X-Konsol-Ikat'

const POLA_TOKEN_IKATAN = /^[A-Za-z0-9_-]{43}$/

interface DokumenMeta {
  querySelector: (selektor: string) => { getAttribute: (n: string) => string | null; remove: () => void } | null
}

/**
 * Baca token ikatan dari <meta> lalu buang elemennya. Token hanya hidup di
 * memori dokumen console; tidak disimpan di sessionStorage/localStorage
 * karena halaman publik di tab yang sama bisa membaca keduanya.
 */
export function bacaIkatanMeta(doc: DokumenMeta | null | undefined): string | null {
  try {
    const el = doc?.querySelector(`meta[name="${META_IKATAN}"]`)
    if (!el) return null
    const nilai = el.getAttribute('content') ?? ''
    el.remove()
    return POLA_TOKEN_IKATAN.test(nilai) ? nilai : null
  } catch {
    return null
  }
}

/** true bila galat $fetch adalah penolakan ikatan BFF (403 'ikatan'). */
export function galatIkatan(galat: unknown): boolean {
  const e = (galat ?? {}) as { status?: number; statusCode?: number; response?: { status?: number }; data?: { statusMessage?: unknown } }
  const status = Number(e.status ?? e.statusCode ?? e.response?.status ?? 0)
  return status === 403 && e.data?.statusMessage === 'ikatan'
}

/* ───────────── sesi habis / ikatan basi di tengah kerja (putaran 2) ───────────── */

/** POST/PUT/PATCH/DELETE: permintaan yang membawa isian admin. */
export const metodeTulis = (metode: string | null | undefined): boolean =>
  !['GET', 'HEAD'].includes((metode || 'GET').toUpperCase())

/**
 * Tindakan klien console atas galat BFF (useAdminApi):
 *   - baca (GET) 403 'ikatan' → 'muat-ulang' otomatis; 401 → 'ke-login' otomatis;
 *   - tulis → TIDAK PERNAH otomatis ('minta-muat-ulang' / 'minta-masuk'): toast
 *     dengan tombol yang ditekan admin sendiri. Sebelum 0c simpan yang gagal
 *     hanya menampilkan toast dan isi form tetap utuh; memuat ulang atau
 *     berpindah dokumen di sini membuang isian itu tanpa pesan.
 * null = bukan urusan sesi (pemanggil menampilkan galatnya sendiri).
 */
export type TindakanGalatSesi = 'muat-ulang' | 'ke-login' | 'minta-muat-ulang' | 'minta-masuk' | null

export function tindakanGalatSesi(metode: string | null | undefined, galat: unknown): TindakanGalatSesi {
  const tulis = metodeTulis(metode)
  if (galatIkatan(galat)) return tulis ? 'minta-muat-ulang' : 'muat-ulang'
  if (galatDari(galat).status === 401) return tulis ? 'minta-masuk' : 'ke-login'
  return null
}

/* ───────────── draf form console di sessionStorage (useDrafKonsol) ───────────── */

/** Awalan kunci draf; dokumen publik menghapus semuanya (plugins/konsol-isolasi). */
export const AWALAN_DRAF = 'ca_konsol_draf:'
export const UMUR_DRAF_MS = 24 * 60 * 60 * 1000

interface SimpananDraf {
  getItem: (k: string) => string | null
  setItem: (k: string, v: string) => void
  removeItem: (k: string) => void
}

/** Titipkan isian form. false bila penyimpanan menolak (penuh, diblokir). */
export function simpanDraf(simpan: SimpananDraf, kunci: string, pemilik: string, isi: unknown, sekarang: number): boolean {
  if (!pemilik) return false
  try {
    simpan.setItem(AWALAN_DRAF + kunci, JSON.stringify({ v: 1, pemilik, waktu: sekarang, isi }))
    return true
  } catch {
    return false
  }
}

/**
 * Draf milik `pemilik` (id admin) yang belum kedaluwarsa, atau null. Draf
 * admin lain (login bergantian di tab yang sama), kedaluwarsa, atau rusak
 * dibuang.
 */
export function bacaDraf<T>(simpan: SimpananDraf, kunci: string, pemilik: string, sekarang: number): T | null {
  try {
    const mentah = simpan.getItem(AWALAN_DRAF + kunci)
    if (mentah === null) return null
    const d = JSON.parse(mentah) as { v?: unknown; pemilik?: unknown; waktu?: unknown; isi?: unknown } | null
    const sah = !!d && d.v === 1 && !!pemilik && d.pemilik === pemilik
      && typeof d.waktu === 'number' && sekarang - d.waktu >= 0 && sekarang - d.waktu < UMUR_DRAF_MS
      && d.isi !== null && typeof d.isi === 'object'
    if (!sah) {
      simpan.removeItem(AWALAN_DRAF + kunci)
      return null
    }
    return d!.isi as T
  } catch {
    try { simpan.removeItem(AWALAN_DRAF + kunci) } catch { /* diblokir */ }
    return null
  }
}

export function hapusDraf(simpan: SimpananDraf, kunci: string): void {
  try {
    simpan.removeItem(AWALAN_DRAF + kunci)
  } catch { /* diblokir: tidak ada yang tertinggal */ }
}

/** Hapus semua draf console di tab ini. Memulangkan jumlah yang dihapus. */
export function hapusSemuaDraf(simpan: { length: number; key: (i: number) => string | null; removeItem: (k: string) => void }): number {
  try {
    const kunci: string[] = []
    for (let i = 0; i < simpan.length; i++) {
      const k = simpan.key(i)
      if (k?.startsWith(AWALAN_DRAF)) kunci.push(k)
    }
    for (const k of kunci) simpan.removeItem(k)
    return kunci.length
  } catch {
    return 0
  }
}

/* ───────────── galat auth console (login, BFF, gateway) ───────────── */

export interface GalatKonsol {
  /** 0 = tidak ada jawaban HTTP (jaringan putus, CORS, habis waktu). */
  status: number
  kode: string
  pesan: string
  /** Detik menunggu (Retry-After, atau dari pesan 429 gateway) untuk 429. */
  tunggu: number | null
  /** Siapa yang menjawab: gateway (login/verifikasi) atau BFF console. */
  sumber?: 'gateway' | 'console'
}

interface GalatFetch {
  status?: number
  statusCode?: number
  response?: { status?: number; headers?: { get?: (nama: string) => string | null } }
  data?: { errors?: { code?: unknown; message?: unknown }; statusMessage?: string }
}

/**
 * Bentuk galat seragam dari $fetch (badan {errors:{code,message}} gateway/BFF).
 * Retry-After jawaban gateway lintas asal hanya terbaca bila gateway
 * mengeksposnya (CORS Expose-Headers); tanpa itu menit dibaca dari pesannya.
 */
export function galatDari(galat: unknown): GalatKonsol {
  const err = (galat ?? {}) as GalatFetch
  const status = Number(err.status ?? err.statusCode ?? err.response?.status ?? 0) || 0
  const errors = err.data?.errors
  const pesan = typeof errors?.message === 'string' ? errors.message : (err.data?.statusMessage || '')
  const retry = Number(err.response?.headers?.get?.('retry-after'))
  return {
    status,
    kode: typeof errors?.code === 'string' ? errors.code : (status ? `HTTP_${status}` : 'JARINGAN'),
    pesan,
    tunggu: Number.isFinite(retry) && retry > 0 ? retry : (status === 429 ? detikDariPesan(pesan) : null),
  }
}

/** Server tidak menjawab dengan jawaban miliknya: jaringan/CORS/habis waktu
 *  (status 0) atau 5xx dari gateway, Cloudflare (52x), maupun BFF. 503 punya
 *  pesan sendiri ("sedang tidak tersedia"). */
export const galatJaringan = (g: Pick<GalatKonsol, 'status'>): boolean =>
  g.status === 0 || (g.status >= 500 && g.status !== 503)

/** Menit tunggu untuk pesan 429, dibulatkan ke atas; null bila server tidak
 *  menyebutkannya (jangan menebak "1 menit" untuk jendela 15 menit). */
export const menitTunggu = (g: Pick<GalatKonsol, 'tunggu'>): number | null =>
  g.tunggu ? Math.max(1, Math.ceil(g.tunggu / 60)) : null

export type PesanLogin =
  | { kunci: string; param?: Record<string, string | number> }
  | { teks: string }

/**
 * Pesan untuk halaman /console/login (kunci i18n `login.*`, atau teks gateway).
 * "Periksa email dan password" HANYA untuk 401 dari gateway: jaringan putus,
 * 5xx, atau Cloudflare 52x bukan salah admin.
 */
export function pesanLogin(g: GalatKonsol | null, cadangan: 'login.failed' | 'login.totpFailed'): PesanLogin {
  if (!g) return { kunci: cadangan }
  if (galatJaringan(g)) return { kunci: 'login.unreachable' }
  if (g.status === 503) return { kunci: 'login.unavailable' }
  if (g.status === 429) {
    const menit = menitTunggu(g)
    return menit ? { kunci: 'login.tooMany', param: { menit } } : { kunci: 'login.tooManyLater' }
  }
  if (g.status === 403 && g.pesan === 'ikatan') return { kunci: 'login.muatUlang' }
  if (g.kode === 'TOTP_LOCKED' || g.status === 423) return { kunci: 'login.totpLocked' }
  if (g.kode === 'TOTP_INVALID') return { kunci: 'login.totpInvalid' }
  if (g.kode === 'MFA_CHALLENGE_INVALID') return { kunci: 'login.totpExpired' }
  // Gateway menerima sandi/kode, tetapi serah terima ke console gagal.
  if (g.sumber === 'console') return { kunci: 'login.sesiGagal' }
  if (g.status === 401 || !g.pesan) return { kunci: cadangan }
  return { teks: g.pesan }
}

/**
 * Pesan galat kelola admin (halaman Users), dari kode gateway "sesi kuat":
 *   - CURRENT_PASSWORD_REQUIRED / PASSWORD_INVALID: ganti password akun sendiri
 *     butuh password saat ini (begitu ada satu saja admin ber-TOTP);
 *   - MFA_REQUIRED / MFA_ENROLLMENT_TOO_RECENT (403): sesi belum lolos TOTP,
 *     atau TOTP/akun pelaku belum 24 jam;
 *   - 409 EMAIL_TAKEN: email sudah dipakai admin lain (create maupun ubah);
 *     mengulang tidak akan berhasil, jadi form tetap terbuka;
 *   - 409 lain: create = email sudah terdaftar (gateway lama); selain itu baris
 *     admin berubah sejak dimuat dan tidak ada yang ditulis (muat ulang, lalu
 *     ulangi);
 *   - 423 TOTP_LOCKED; 429 (+ menit bila diketahui).
 */
export function pesanKelolaAdmin(g: GalatKonsol, aksi: 'create' | 'update' | 'delete'): PesanLogin | null {
  switch (g.kode) {
    case 'EMAIL_TAKEN': return { kunci: aksi === 'create' ? 'users.errors.emailTerdaftar' : 'users.errors.emailDipakai' }
    case 'CURRENT_PASSWORD_REQUIRED': return { kunci: 'users.errors.currentPasswordRequired' }
    case 'PASSWORD_INVALID': return { kunci: 'users.errors.currentPasswordWrong' }
    case 'MFA_REQUIRED': return { kunci: 'users.errors.mfaRequired' }
    case 'MFA_ENROLLMENT_TOO_RECENT': return { kunci: 'users.errors.mfaTooRecent' }
    case 'TOTP_LOCKED': return { kunci: 'users.errors.totpLocked' }
  }
  if (g.status === 423) return { kunci: 'users.errors.totpLocked' }
  if (g.status === 429) {
    const menit = menitTunggu(g)
    return menit ? { kunci: 'users.errors.tooMany', param: { menit } } : { kunci: 'users.errors.tooManyLater' }
  }
  if (g.status === 409) return { kunci: aksi === 'create' ? 'users.errors.emailTerdaftar' : 'users.errors.berubah' }
  return g.pesan ? { teks: g.pesan } : null
}

/**
 * Galat simpan admin yang berarti "baris berubah sejak dimuat": daftar dimuat
 * ulang supaya admin mengulang atas data terbaru. 409 EMAIL_TAKEN bukan itu:
 * memuat ulang tidak menolong, isian form dibiarkan untuk diperbaiki.
 */
export const perluMuatUlangAdmin = (g: Pick<GalatKonsol, 'status' | 'kode'> | null | undefined): boolean =>
  !!g && g.status === 409 && g.kode !== 'EMAIL_TAKEN'

/* ───────────── unggah gambar lewat proxy ───────────── */

/** 4 MiB: di bawah batas badan fungsi Vercel (4,5 MB) plus overhead multipart.
 *  Di atas itu Vercel menjawab 413 sebelum gateway (batas 5 MB) melihatnya. */
export const UKURAN_MAKS_GAMBAR = 4 * 1024 * 1024

export const gambarTerlaluBesar = (ukuran: number): boolean => ukuran > UKURAN_MAKS_GAMBAR

/** Kunci sessionStorage sesi Supabase modul CashFlow (useCashflowSupabase). */
export const KUNCI_SESI_CASHFLOW = 'cf-console-sesi'

interface SimpananSesi {
  length: number
  key: (i: number) => string | null
  getItem: (k: string) => string | null
  removeItem: (k: string) => void
}

/**
 * Buang sisa console dari sessionStorage tab ini: sesi Supabase CashFlow
 * (akses + refresh) dan, untuk dokumen publik, draf form console. `ambil`
 * dipanggil di dalam try: membaca window.sessionStorage pun bisa melempar.
 * Memulangkan jumlah kunci yang benar-benar dibuang (0 = tidak ada sisa).
 */
export function hapusSisaKonsol(ambil: () => SimpananSesi | null | undefined, draf: boolean): number {
  try {
    const simpan = ambil()
    if (!simpan) return 0
    let n = 0
    if (simpan.getItem(KUNCI_SESI_CASHFLOW) !== null) {
      simpan.removeItem(KUNCI_SESI_CASHFLOW)
      n++
    }
    if (draf) n += hapusSemuaDraf(simpan)
    return n
  } catch {
    // penyimpanan diblokir: tidak ada yang tertinggal (GTM pun tak bisa membacanya)
    return 0
  }
}

interface JendelaBfcache {
  addEventListener: (jenis: 'pageshow', f: (e: { persisted?: boolean }) => void) => void
  sessionStorage: SimpananSesi
  location: { reload: () => void }
}

/**
 * Dokumen publik yang DIPULIHKAN dari back/forward cache (tombol Back dari
 * console) tidak menjalankan plugin lagi, padahal sessionStorage tab ini bisa
 * sudah berisi token CashFlow yang ditulis console sesudahnya — dan GTM di
 * dokumen itu masih hidup (temuan F8). Saat pageshow persisted: sisa console
 * dibuang lalu dokumen dimuat ulang (plugin berjalan dari awal, GTM baru).
 * Muat ulang HANYA bila ada sisa yang dibuang: Back biasa di situs publik
 * tetap dipulihkan dari bfcache (instan, isian form utuh, tanpa page_view
 * ganda). Pendengar ini didaftarkan saat plugin berjalan, sebelum skrip GTM
 * disisipkan, jadi ia berjalan lebih dulu dari pendengar pageshow milik GTM.
 */
export function pasangPembersihBfcache(w: JendelaBfcache): void {
  w.addEventListener('pageshow', (e) => {
    if (!e.persisted) return
    if (hapusSisaKonsol(() => w.sessionStorage, true) > 0) w.location.reload()
  })
}

/** Kunci sessionStorage tempat reloadNuxtApp({ persistState: true }) menyalin
 *  SELURUH payload.state (useState console: id kasus, nominal saringan, teks
 *  cari, kepala Pengguna 360, admin_user). Aplikasi ini tidak pernah
 *  menulisnya (plugins/muat-ulang-bersih.client.ts) dan menghapusnya di
 *  setiap dokumen serta saat keluar — salinan dari build lama yang masih
 *  terbuka saat rilis pun tidak tertinggal. */
export const KUNCI_STATE_MUAT_ULANG = 'nuxt:reload:state'

/** Hapus salinan state muat-ulang Nuxt dari storage. `ambil` dipanggil di
 *  dalam try: membaca window.sessionStorage pun bisa melempar bila diblokir. */
export function hapusStateMuatUlang(ambil: () => { removeItem: (k: string) => void } | null | undefined): void {
  try {
    ambil()?.removeItem(KUNCI_STATE_MUAT_ULANG)
  } catch {
    // penyimpanan diblokir: tidak ada yang tertinggal
  }
}

/** Jalur muat ulang = joinURL(app.baseURL, fullPath) bawaan Nuxt; fullPath diawali '/'. */
export const jalurMuatUlang = (baseURL: string, fullPath: string): string =>
  `${baseURL.replace(/\/+$/, '')}/${fullPath.replace(/^\/+/, '')}`

/* ───────────── isolasi dari GTM / Google Ads ───────────── */

interface JendelaMinimal {
  dataLayer?: unknown
  gtag?: unknown
  google_tag_manager?: unknown
  document?: { querySelector: (selektor: string) => unknown }
}

const SELEKTOR_SKRIP_PIHAK_KETIGA = [
  'script[src*="googletagmanager.com"]',
  'script[src*="google-analytics.com"]',
  'script[src*="googleadservices.com"]',
  'script[src*="doubleclick.net"]',
].join(',')

/**
 * true bila GTM atau tag iklan sudah termuat di dokumen ini. Skrip pihak
 * ketiga yang sudah berjalan tidak bisa "dibongkar": satu-satunya cara console
 * bersih darinya adalah memuat ulang dokumen penuh (plugin gtag/google-ads
 * tidak memuat apa pun bila halaman pertamanya /console).
 */
export function pihakKetigaTermuat(w: JendelaMinimal): boolean {
  if (w.dataLayer !== undefined || typeof w.gtag === 'function' || w.google_tag_manager !== undefined) return true
  try {
    return !!w.document?.querySelector(SELEKTOR_SKRIP_PIHAK_KETIGA)
  } catch {
    return false
  }
}

/**
 * Referrer yang boleh dikirim ke analitik (page_referrer) — temuan F7. URL
 * console (UUID subjek/transaksi CashFlow, saringan, ?ke=) tidak boleh sampai
 * ke GTM/GA. Console sudah ber-Referrer-Policy no-referrer
 * (server/lib/konsol/header.ts); ini lapis kedua untuk dokumen yang dimuat
 * dari jawaban lama/cache atau peramban yang mengabaikan kebijakan itu.
 * Jalur console di origin mana pun dikosongkan (www/apex, pratinjau); URL
 * rusak ikut dikosongkan.
 */
export function referrerAnalitik(referrer: string | null | undefined): string {
  if (!referrer) return ''
  try {
    return jalurKonsol(new URL(referrer).pathname) ? '' : referrer
  } catch {
    return ''
  }
}

/** Kunci sessionStorage penanda muat ulang terakhir (penahan loop). */
export const KUNCI_MUAT_ULANG = 'ca_konsol_muat_ulang'
export const JEDA_MUAT_ULANG_MS = 15_000

interface SimpananMinimal {
  getItem: (k: string) => string | null
  setItem: (k: string, v: string) => void
}

/**
 * Penahan loop: memuat ulang hanya bila belum dilakukan dalam JEDA terakhir.
 * Tanpa ini, ekstensi peramban yang memasang window.dataLayer sendiri akan
 * membuat console memuat ulang tanpa henti. sessionStorage yang tidak bisa
 * dipakai (mode privat ketat) = jangan memuat ulang.
 */
export function bolehMuatUlang(simpan: SimpananMinimal | null | undefined, sekarang: number): boolean {
  if (!simpan) return false
  try {
    const tersimpan = simpan.getItem(KUNCI_MUAT_ULANG)
    const terakhir = tersimpan === null ? Number.NaN : Number(tersimpan)
    if (Number.isFinite(terakhir) && sekarang - terakhir < JEDA_MUAT_ULANG_MS) return false
    simpan.setItem(KUNCI_MUAT_ULANG, String(sekarang))
    return true
  } catch {
    return false
  }
}

/* ───────────── cookie token lama (sebelum Fase 0c) ───────────── */

/** Dulu dipasang dari JS (bukan HttpOnly) oleh useAdminAuth. */
export const COOKIE_LAMA_KONSOL = ['auth_admin_token', 'refresh_admin_token'] as const

interface DokumenCookie {
  cookie: string
}

/**
 * Hapus cookie token lama yang tertinggal di peramban. Token lama tanpa klaim
 * `typ` memang ditolak gateway baru, tapi refresh token 30 hari tidak boleh
 * terus tinggal di tempat yang bisa dibaca skrip apa pun. Dipanggil sekali
 * saat aplikasi dimuat (plugins/konsol-isolasi.client.ts). Memulangkan nama
 * cookie yang dihapus.
 */
export function hapusCookieLama(doc: DokumenCookie, aman: boolean): string[] {
  const ada = new Set(doc.cookie.split(';').map((c) => c.split('=')[0]?.trim()).filter(Boolean))
  const dihapus: string[] = []
  for (const nama of COOKIE_LAMA_KONSOL) {
    if (!ada.has(nama)) continue
    doc.cookie = `${nama}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax${aman ? '; Secure' : ''}`
    dihapus.push(nama)
  }
  return dihapus
}
