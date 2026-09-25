/**
 * Inti proxy console → gateway (dipakai server/api/gw/[...path].ts dan
 * server/api/cashflow/sesi.post.ts). MURNI: fetch disuntikkan, tanpa h3,
 * supaya alur refresh-sekali bisa diuji tanpa server.
 *
 * Alur:
 *   1. Tidak ada cookie akses tapi ada cookie segar (akses sudah kedaluwarsa
 *      dan dibuang peramban) → refresh dulu.
 *   2. Kirim ke gateway dengan Authorization: Bearer <akses>. Cookie, Host,
 *      dan header hop-by-hop peramban TIDAK diteruskan (daftar putih).
 *   3. Gateway menjawab 401 dan refresh belum dicoba → refresh SEKALI, lalu
 *      ulangi permintaan. Refresh ditolak (4xx) → cookie dihapus, 401 asli
 *      diteruskan. Refresh gagal karena gateway (5xx/jaringan) → cookie
 *      dibiarkan, 401 asli diteruskan.
 *   4. Rute pengakhir sesi (logout-all, totp enable/disable, dan perubahan
 *      akun sendiri yang mencabut sesi di gateway — lihat ubahAkunSendiri)
 *      yang berhasil → cookie dihapus dan pemilik token (id admin gateway;
 *      email hanya label log) dilaporkan untuk pencabutan sesi CashFlow
 *      per id (cashflow-cabut.ts).
 *      Keduanya diambil dari token yang BARU SAJA diterima gateway.
 *   4b. Tindakan yang mengakhiri semua sesi admin LAIN (cabut sesi, reset
 *      TOTP, hapus, ubah sandi/email/peran/status — lihat adminDiakhiri) yang
 *      berhasil → id admin itu (dari jalur) dilaporkan untuk pencabutan sesi
 *      CashFlow-nya per id. Cookie pemanggil tidak disentuh.
 *   5. IP klien (dari header Vercel, lib/konsol/batas.ts) dikirim di
 *      X-Konsol-Klien-IP. Gateway hanya MENCATATNYA di audit sebagai IP yang
 *      dilaporkan BFF; pembatas dan keputusan keamanan gateway tidak
 *      memakainya. Nilai kiriman peramban tidak pernah diteruskan (daftar
 *      putih header masuk).
 *
 * Jawaban gateway diteruskan dengan status aslinya; Set-Cookie gateway tidak
 * pernah diteruskan (cookie sesi hanya milik BFF).
 */
import { idAdminGateway, type PemilikSesi } from './cashflow-cabut'
import { klaimJwt, type PasanganToken } from './cookie'
import { PENGAKHIR_SESI, ruteGateway } from './jalur'

/** Header IP klien yang DILAPORKAN BFF ke gateway (audit saja, tidak tepercaya). */
export const HEADER_KLIEN_IP = 'x-konsol-klien-ip'

export type FetchGateway = (url: string, init: RequestInit) => Promise<Response>

export interface KonteksGateway {
  /** Base gateway server-side, mis. https://api.coreasia.id/api */
  gatewayUrl: string
  fetch: FetchGateway
  /** Batas waktu satu panggilan gateway (ms). */
  timeoutMs?: number
  /** IP klien menurut BFF (ipKlien); dikirim di X-Konsol-Klien-IP untuk audit. */
  klienIp?: string | null
}

/** Header dasar panggilan server → gateway (+ IP klien yang dilaporkan). */
function headerDasar(ctx: KonteksGateway, awal?: HeadersInit): Headers {
  const h = new Headers(awal)
  if (ctx.klienIp) h.set(HEADER_KLIEN_IP, ctx.klienIp)
  else h.delete(HEADER_KLIEN_IP)
  return h
}

/** Header permintaan yang boleh sampai ke gateway. Sisanya dibuang. */
const HEADER_MASUK = ['accept', 'accept-language', 'content-type', 'if-none-match', 'if-modified-since']

/** Header jawaban gateway yang diteruskan ke peramban. content-encoding dan
 *  content-length TIDAK: fetch sudah mendekompresi badan. */
const HEADER_KELUAR = ['content-type', 'content-disposition', 'retry-after', 'etag', 'last-modified']

export function saringHeaderMasuk(sumber: Headers): Headers {
  const h = new Headers()
  for (const nama of HEADER_MASUK) {
    const nilai = sumber.get(nama)
    if (nilai) h.set(nama, nilai)
  }
  return h
}

export function saringHeaderKeluar(sumber: Headers): Headers {
  const h = new Headers()
  for (const nama of HEADER_KELUAR) {
    const nilai = sumber.get(nama)
    if (nilai) h.set(nama, nilai)
  }
  // Jawaban admin berisi data pribadi & rahasia (salin kunci): jangan disimpan cache mana pun.
  h.set('cache-control', 'no-store')
  h.set('x-content-type-options', 'nosniff')
  return h
}

export const jsonGalat = (status: number, code: string, message: string): Response =>
  new Response(JSON.stringify({ data: null, errors: { code, message } }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })

const dasarGateway = (url: string) => url.replace(/\/+$/, '')

export type HasilSegar =
  | { status: 'ok'; token: PasanganToken; data: Record<string, unknown> }
  | { status: 'ditolak'; respons: Response }
  | { status: 'gagal' }

/** Tukar refresh token dengan pasangan baru. Token dikirim di badan JSON,
 *  bukan cookie (gateway menerima keduanya). */
export async function segarkanToken(segar: string, ctx: KonteksGateway): Promise<HasilSegar> {
  let res: Response
  try {
    res = await ctx.fetch(`${dasarGateway(ctx.gatewayUrl)}/admin/auth/refresh`, {
      method: 'POST',
      headers: headerDasar(ctx, { 'content-type': 'application/json', accept: 'application/json' }),
      body: JSON.stringify({ refresh_token: segar }),
      redirect: 'manual',
      signal: AbortSignal.timeout(ctx.timeoutMs ?? 15_000),
    })
  } catch {
    return { status: 'gagal' }
  }
  if (res.status >= 400 && res.status < 500) return { status: 'ditolak', respons: res }
  if (!res.ok) return { status: 'gagal' }
  const isi = await res.json().catch(() => null) as { data?: Record<string, unknown> } | null
  const data = isi?.data
  const akses = data?.access_token
  const baru = data?.refresh_token
  if (typeof akses !== 'string' || !akses || typeof baru !== 'string' || !baru) return { status: 'gagal' }
  return { status: 'ok', token: { akses, segar: baru }, data }
}

export interface PermintaanProxy {
  metode: string
  /** Jalur tervalidasi (validasiJalur), tanpa garis miring awal. */
  jalur: string
  /** URL tujuan yang sudah dirakit (rakitTujuan). */
  tujuan: URL
  header: Headers
  body?: Uint8Array | null
  akses?: string | null
  segar?: string | null
}

export interface HasilProxy {
  respons: Response
  /** Pasangan token baru bila refresh terjadi; handler memasang cookie-nya. */
  tokenBaru: PasanganToken | null
  /** true = hapus cookie akses & segar (refresh ditolak, atau sesi diakhiri). */
  hapusCookie: boolean
  /** Admin yang sesinya baru saja diakhiri (untuk mencabut sesi CashFlow). */
  pemilikSesiBerakhir: PemilikSesi | null
  /** Id admin gateway LAIN yang semua sesinya baru saja diakhiri gateway
   *  (adminDiakhiri); sesi CashFlow-nya dicabut per id. */
  adminLainBerakhir: string | null
}

export async function teruskan(p: PermintaanProxy, ctx: KonteksGateway): Promise<HasilProxy> {
  let akses = p.akses || null
  let tokenBaru: PasanganToken | null = null
  let sudahSegar = false
  let hapusCookie = false

  const segarkan = async (): Promise<HasilSegar> => {
    sudahSegar = true
    const hasil = await segarkanToken(p.segar!, ctx)
    if (hasil.status === 'ok') {
      tokenBaru = hasil.token
      akses = hasil.token.akses
    } else if (hasil.status === 'ditolak') {
      hapusCookie = true
      tokenBaru = null
    }
    return hasil
  }

  if (!akses && p.segar) {
    const hasil = await segarkan()
    if (hasil.status === 'ditolak') {
      return { respons: jsonGalat(401, 'UNAUTHORIZED', 'Sesi sudah tidak berlaku. Silakan login ulang.'), tokenBaru: null, hapusCookie: true, pemilikSesiBerakhir: null, adminLainBerakhir: null }
    }
    if (hasil.status === 'gagal') {
      // Gateway yang bermasalah bukan alasan menyuruh admin login ulang.
      return { respons: jsonGalat(502, 'GATEWAY_UNREACHABLE', 'Gateway tidak dapat dihubungi.'), tokenBaru: null, hapusCookie: false, pemilikSesiBerakhir: null, adminLainBerakhir: null }
    }
  }
  if (!akses) {
    return { respons: jsonGalat(401, 'UNAUTHORIZED', 'Autentikasi diperlukan'), tokenBaru: null, hapusCookie, pemilikSesiBerakhir: null, adminLainBerakhir: null }
  }

  const kirim = async (token: string): Promise<Response> => {
    const header = headerDasar(ctx, p.header)
    header.set('authorization', `Bearer ${token}`)
    return ctx.fetch(p.tujuan.toString(), {
      method: p.metode,
      headers: header,
      body: p.body && p.body.byteLength > 0 ? p.body : undefined,
      // Pengalihan dari gateway tidak diikuti: proxy tidak boleh dibawa ke host lain.
      redirect: 'manual',
      signal: AbortSignal.timeout(ctx.timeoutMs ?? 120_000),
    })
  }

  let respons: Response
  try {
    respons = await kirim(akses)
    if (respons.status === 401 && p.segar && !sudahSegar) {
      const hasil = await segarkan()
      if (hasil.status === 'ok') {
        await respons.body?.cancel().catch(() => {})
        respons = await kirim(akses!)
      }
    }
  } catch (e) {
    const habisWaktu = (e as { name?: string })?.name === 'TimeoutError'
    return {
      respons: habisWaktu
        ? jsonGalat(504, 'GATEWAY_TIMEOUT', 'Gateway tidak menjawab tepat waktu.')
        : jsonGalat(502, 'GATEWAY_UNREACHABLE', 'Gateway tidak dapat dihubungi.'),
      tokenBaru,
      hapusCookie,
      pemilikSesiBerakhir: null,
      adminLainBerakhir: null,
    }
  }

  let pemilikSesiBerakhir: PemilikSesi | null = null
  let adminLainBerakhir: string | null = null
  if (respons.ok) {
    const sasaran = adminDiakhiri(p)
    const milik = pemilikToken(akses)
    const diriSendiri = sasaran !== null && sasaran === milik?.id
    // Akun sendiri: PUT diputuskan ubahAkunSendiri (email/peran yang dikirim
    // sama dengan token tidak mengakhiri apa pun). Selain PUT, hanya
    // revoke-sessions yang diterima gateway untuk id sendiri, dan itu sama
    // dengan logout-all: token yang sedang dipakai ikut mati.
    const cabutSendiri = diriSendiri && p.metode.toUpperCase() !== 'PUT'
    if (PENGAKHIR_SESI.has(ruteGateway(p.jalur)) || ubahAkunSendiri(p, akses) || cabutSendiri) {
      pemilikSesiBerakhir = milik
      hapusCookie = true
      tokenBaru = null
    } else if (sasaran && !diriSendiri) {
      adminLainBerakhir = sasaran
    }
  }
  return { respons, tokenBaru, hapusCookie, pemilikSesiBerakhir, adminLainBerakhir }
}

/** Jalur admin/users/<id>[/<aksi>]: id (apa adanya) dan aksi (huruf kecil, '' bila tanpa). */
const RUTE_ADMIN_USER = /^admin\/users\/([^/]+)(?:\/(revoke-sessions|totp\/reset))?$/i

/**
 * Id admin gateway (uuid, huruf kecil) yang SEMUA sesinya diakhiri gateway
 * bila permintaan ini berhasil, atau null. Dicocokkan tanpa peka huruf,
 * seperti router gateway:
 *   - POST admin/users/<id>/revoke-sessions (token_version+1);
 *   - POST admin/users/<id>/totp/reset (TOTP dimatikan + semua sesi dicabut);
 *   - DELETE admin/users/<id> (akun hilang; /me menolak token lamanya);
 *   - PUT admin/users/<id> yang membawa `password` terisi, `is_active: false`,
 *     atau `email`/`role` terisi. Gateway hanya mencabut bila email/peran
 *     BENAR-BENAR berubah; form ubah console mengirim keduanya hanya bila
 *     berubah (bidangUbahAdmin), jadi kiriman = perubahan. Console lama yang
 *     selalu mengirim keduanya membuat sesi CashFlow admin itu ikut dicabut
 *     walau hanya nama yang diubah: arah gagal aman (sesi dicetak ulang, kasus
 *     dibuka lagi).
 * Id milik pemanggil sendiri tetap dikembalikan; teruskan() yang memutuskan
 * (akun sendiri ditangani seperti logout-all/ubahAkunSendiri).
 */
export function adminDiakhiri(p: Pick<PermintaanProxy, 'metode' | 'jalur' | 'body'>): string | null {
  const m = RUTE_ADMIN_USER.exec(p.jalur)
  const id = m ? idAdminGateway(m[1]) : null
  if (!m || !id) return null
  const metode = p.metode.toUpperCase()
  if (m[2]) return metode === 'POST' ? id : null
  if (metode === 'DELETE') return id
  if (metode !== 'PUT' || !p.body?.byteLength) return null
  try {
    const isi = JSON.parse(new TextDecoder().decode(p.body)) as Record<string, unknown> | null
    if (!isi || typeof isi !== 'object') return null
    const terisi = (v: unknown) => typeof v === 'string' && v.trim() !== ''
    return terisi(isi.password) || isi.is_active === false || terisi(isi.email) || terisi(isi.role) ? id : null
  } catch {
    return null
  }
}

/** Id admin gateway (klaim user_id, cadangan sub) dan email dari token akses. */
export function pemilikToken(akses: string | null | undefined): PemilikSesi | null {
  const klaim = klaimJwt(akses)
  const id = idAdminGateway(klaim?.user_id) ?? idAdminGateway(klaim?.sub)
  const email = typeof klaim?.email === 'string' && klaim.email.trim() ? klaim.email.trim() : null
  return id || email ? { id, email } : null
}

const samaTeks = (a: unknown, b: unknown): boolean =>
  typeof a === 'string' && typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * PUT admin/users/<id milik token ini> yang membuat gateway menaikkan
 * token_version, sehingga SEMUA sesi admin ini (termasuk yang sedang dipakai)
 * berakhir. Sama seperti logout-all: cookie dihapus dan sesi CashFlow-nya
 * dicabut. Yang dihitung:
 *   - `password` terisi (gateway selalu mencabut saat sandi diganti);
 *   - `email` berbeda dari email di token (tanpa peka huruf) — email lama
 *     tidak boleh terus menjadi label sesi CashFlow yang masih hidup (F3);
 *   - `role` berbeda dari peran di token, atau `is_active: false`.
 * Kolom yang dikirim tapi nilainya sama (form ubah selalu mengirim email)
 * tidak mengakhiri apa pun. Mengubah admin LAIN tidak termasuk: sesi
 * CashFlow admin itu dicabut per id (adminDiakhiri), cookie pemanggil tetap.
 */
export function ubahAkunSendiri(p: Pick<PermintaanProxy, 'metode' | 'jalur' | 'body'>, akses: string | null): boolean {
  if (p.metode.toUpperCase() !== 'PUT' || !p.body?.byteLength) return false
  const m = /^admin\/users\/([^/]+)$/i.exec(p.jalur)
  const klaim = klaimJwt(akses)
  const milik = klaim?.sub ?? klaim?.user_id
  if (!m || typeof milik !== 'string' || m[1]!.toLowerCase() !== milik.toLowerCase()) return false
  try {
    const isi = JSON.parse(new TextDecoder().decode(p.body)) as Record<string, unknown> | null
    if (!isi || typeof isi !== 'object') return false
    if (typeof isi.password === 'string' && isi.password !== '') return true
    if (typeof isi.email === 'string' && isi.email.trim() !== '' && !samaTeks(isi.email, klaim?.email)) return true
    if (typeof isi.role === 'string' && isi.role !== '' && !samaTeks(isi.role, klaim?.role)) return true
    return isi.is_active === false
  } catch {
    return false
  }
}
