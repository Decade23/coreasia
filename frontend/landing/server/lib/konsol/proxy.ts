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
 *   4. Rute pengakhir sesi (logout-all, totp enable/disable, dan mengganti
 *      sandi akun sendiri) yang berhasil → cookie dihapus dan email pemilik
 *      token dilaporkan untuk pencabutan sesi CashFlow. Email diambil dari
 *      token yang BARU SAJA diterima gateway.
 *   5. IP klien (dari header Vercel, lib/konsol/batas.ts) dikirim di
 *      X-Konsol-Klien-IP. Gateway hanya MENCATATNYA di audit sebagai IP yang
 *      dilaporkan BFF; pembatas dan keputusan keamanan gateway tidak
 *      memakainya. Nilai kiriman peramban tidak pernah diteruskan (daftar
 *      putih header masuk).
 *
 * Jawaban gateway diteruskan dengan status aslinya; Set-Cookie gateway tidak
 * pernah diteruskan (cookie sesi hanya milik BFF).
 */
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
  /** Email admin yang sesinya baru saja diakhiri (untuk mencabut sesi CashFlow). */
  emailSesiBerakhir: string | null
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
      return { respons: jsonGalat(401, 'UNAUTHORIZED', 'Sesi sudah tidak berlaku. Silakan login ulang.'), tokenBaru: null, hapusCookie: true, emailSesiBerakhir: null }
    }
    if (hasil.status === 'gagal') {
      // Gateway yang bermasalah bukan alasan menyuruh admin login ulang.
      return { respons: jsonGalat(502, 'GATEWAY_UNREACHABLE', 'Gateway tidak dapat dihubungi.'), tokenBaru: null, hapusCookie: false, emailSesiBerakhir: null }
    }
  }
  if (!akses) {
    return { respons: jsonGalat(401, 'UNAUTHORIZED', 'Autentikasi diperlukan'), tokenBaru: null, hapusCookie, emailSesiBerakhir: null }
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
      emailSesiBerakhir: null,
    }
  }

  let emailSesiBerakhir: string | null = null
  if (respons.ok && (PENGAKHIR_SESI.has(ruteGateway(p.jalur)) || gantiSandiSendiri(p, akses))) {
    const email = klaimJwt(akses)?.email
    emailSesiBerakhir = typeof email === 'string' && email ? email : null
    hapusCookie = true
    tokenBaru = null
  }
  return { respons, tokenBaru, hapusCookie, emailSesiBerakhir }
}

/**
 * PUT admin/users/<id milik token ini> yang membawa `password`: gateway selalu
 * menaikkan token_version saat sandi diganti, jadi SEMUA sesi admin ini (termasuk
 * yang sedang dipakai) berakhir. Sama seperti logout-all: cookie dihapus dan
 * sesi CashFlow-nya dicabut. Mengganti sandi admin LAIN tidak termasuk
 * (sesi CashFlow admin itu dicabut lewat runbook, Langkah 1).
 */
export function gantiSandiSendiri(p: Pick<PermintaanProxy, 'metode' | 'jalur' | 'body'>, akses: string | null): boolean {
  if (p.metode.toUpperCase() !== 'PUT' || !p.body?.byteLength) return false
  const m = /^admin\/users\/([^/]+)$/i.exec(p.jalur)
  const klaim = klaimJwt(akses)
  const milik = klaim?.sub ?? klaim?.user_id
  if (!m || typeof milik !== 'string' || m[1]!.toLowerCase() !== milik.toLowerCase()) return false
  try {
    const isi = JSON.parse(new TextDecoder().decode(p.body)) as { password?: unknown } | null
    return typeof isi?.password === 'string' && isi.password !== ''
  } catch {
    return false
  }
}
