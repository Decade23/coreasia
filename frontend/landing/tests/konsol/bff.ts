/**
 * Perekat uji handler BFF console dengan h3 SUNGGUHAN — bukan berkas uji.
 *
 * Temuan F13: penjaga ikatan dan asal (wajibIkatan/wajibSatuAsal di
 * server/lib/konsol/h3.ts) dulu hanya diuji sebagai fungsi murni, dan satu-
 * satunya uji handler meniru wajibIkatan sebagai no-op. Menghapus penjaga itu
 * dari handler tidak menggagalkan uji apa pun. Di sini handler dijalankan
 * lewat aplikasi h3 asli (createApp + toWebHandler) dengan Request sungguhan:
 * cookie, header Sec-Fetch-*, X-Console, dan X-Konsol-Ikat dibaca oleh kode
 * produksi, bukan oleh tiruan.
 *
 * Auto-import Nitro (defineEventHandler, getHeader, createError, …) dipasang
 * sebagai global yang menunjuk ke ekspor h3 ASLI; hanya useRuntimeConfig yang
 * tiruan (h3.ts membacanya lewat `#imports`, lihat tests/nuxt-imports.ts).
 * fetch ke gateway dan klien Supabase tetap ditiru di masing-masing uji.
 */
import * as h3 from 'h3'
import { vi } from 'vitest'
import { buatIkat, kunciIkatan, tokenIkatan } from '../../server/lib/konsol/ikatan'

/** ≥ 32 aksara: dipakai langsung sebagai sumber kunci HMAC ikatan. */
export const KUNCI_IKAT_UJI = 'kunci-ikatan-khusus-uji-0123456789abcdef'

export const KONFIG_UJI = {
  public: {
    gatewayUrl: 'http://gateway.uji/api',
    gatewayPublicUrl: 'https://api.uji/api',
    cashflowSupabaseUrl: 'https://supabase.uji',
    cashflowSupabaseAnonKey: 'anon',
  },
  cashflowSupabaseServiceKey: 'kunci-layanan-tiruan',
  cashflowKonsolEmail: 'konsol@coreasia.id',
  konsolIkatKunci: KUNCI_IKAT_UJI,
}

const AUTO_IMPORT = [
  'defineEventHandler', 'getHeader', 'createError', 'readRawBody', 'readBody',
  'setResponseStatus', 'setResponseHeader', 'sendNoContent', 'sendStream',
] as const

/** Pasang auto-import Nitro sebelum handler di-import (dipanggil di beforeAll). */
export function pasangGlobalNitro(konfig: typeof KONFIG_UJI = KONFIG_UJI) {
  for (const nama of AUTO_IMPORT) vi.stubGlobal(nama, h3[nama])
  vi.stubGlobal('useRuntimeConfig', () => konfig)
  vi.stubGlobal('defineNitroPlugin', (f: unknown) => f)
}

/** Nilai cookie `ikat` peramban uji, dan token ikatan yang cocok dengannya. */
export const IKAT = buatIkat()
export const tokenIkat = (ikat: string = IKAT): string => tokenIkatan(kunciIkatan({ khusus: KUNCI_IKAT_UJI })!, ikat)

export const jwt = (klaim: Record<string, unknown>): string =>
  `h.${Buffer.from(JSON.stringify(klaim)).toString('base64url')}.t`

export const ADMIN_ID = '0b6e7c1e-2a55-4d59-9c5f-0a8d2f9d1b11'
export const ADMIN_EMAIL = 'admin@coreasia.id'
export const AKSES = jwt({ typ: 'access', sub: ADMIN_ID, user_id: ADMIN_ID, email: ADMIN_EMAIL, role: 'super_admin', tv: 1, exp: 4102444800 })
export const SEGAR = jwt({ typ: 'refresh', sub: ADMIN_ID, user_id: ADMIN_ID, tv: 1, exp: 4102444800 })

/** Header permintaan dari dokumen console yang sah (http: nama cookie polos). */
export const headerKonsol = (lain: Record<string, string> = {}): Record<string, string> => ({
  'sec-fetch-site': 'same-origin', 'x-console': '1', 'x-konsol-ikat': tokenIkat(), ...lain,
})
export const cookieKonsol = (lain: Record<string, string> = {}): Record<string, string> => ({
  ca_konsol_akses: AKSES, ca_konsol_segar: SEGAR, ca_konsol_ikat: IKAT, ...lain,
})

export interface Permintaan {
  metode?: string
  path: string
  header?: Record<string, string>
  cookie?: Record<string, string>
  badan?: string
}
export interface Jawaban {
  status: number
  statusMessage: string
  json: Record<string, unknown> | null
  setCookie: string[]
  header: Headers
}

type Handler = Parameters<ReturnType<typeof h3.createApp>['use']>[0]

/** Jalankan satu handler lewat aplikasi h3 asli. Galat createError jadi status + statusMessage. */
export async function panggil(handler: unknown, p: Permintaan): Promise<Jawaban> {
  const app = h3.createApp()
  app.use(handler as Handler)
  const header = new Headers(p.header)
  if (p.cookie) header.set('cookie', Object.entries(p.cookie).map(([k, v]) => `${k}=${v}`).join('; '))
  const res = await h3.toWebHandler(app)(new Request(`http://localhost${p.path}`, {
    method: p.metode ?? 'GET', headers: header, body: p.badan,
  }))
  const teks = await res.text()
  let json: Record<string, unknown> | null = null
  try { json = JSON.parse(teks) } catch { json = null }
  return {
    status: res.status,
    statusMessage: res.statusText || String(json?.statusMessage ?? ''),
    json,
    setCookie: res.headers.getSetCookie(),
    header: res.headers,
  }
}

/** Nilai Set-Cookie untuk satu nama ('' = dihapus), atau undefined bila tidak dipasang. */
export function nilaiSetCookie(j: Jawaban, nama: string): string | undefined {
  const baris = j.setCookie.find(c => c.startsWith(`${nama}=`))
  return baris === undefined ? undefined : decodeURIComponent(baris.slice(nama.length + 1).split(';')[0]!)
}
