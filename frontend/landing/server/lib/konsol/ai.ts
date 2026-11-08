/**
 * Perekat server untuk halaman Asisten AI di console CashFlow.
 *
 * Dua route baru (server/api/console/ai/models.get.ts dan uji.post.ts)
 * memakai berkas ini supaya penjaga dan pembacaan setelan tidak ditulis dua
 * kali:
 *
 * 1. PENJAGA ADMIN. Permintaan wajib datang dari dokumen console sendiri
 *    (Sec-Fetch-Site same-origin, X-Console untuk POST, token ikatan) lalu
 *    cookie sesi console divalidasi gateway /admin/auth/me. Peran pemegangnya
 *    harus boleh cashflow:view, sama dengan middleware halaman CashFlow.
 *    Tanpa langkah ini route uji bisa dipakai siapa pun yang menemukan
 *    alamatnya untuk membakar kuota penyedia.
 *
 * 2. SETELAN. Base URL dan model dibaca dari RPC admin_ai_setelan memakai
 *    access token Supabase sesi CashFlow yang dikirim halaman (Authorization:
 *    Bearer). RPC itu sendiri menjaga is_platform_admin() dan
 *    konsol_boleh('cashflow:view'), jadi token yang salah tidak memulangkan
 *    apa pun. Bila token tidak ada atau RPC belum terpasang, nilai bawaan
 *    dipakai dan route tetap jujur menyebut sumbernya.
 *
 * KUNCI. OPENAI_API_KEY hanya dibaca di proses server. Berkas ini, route,
 * jawaban, dan log tidak pernah memuat nilainya.
 */
import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import { peranBoleh } from '~/utils/rbac'
import { keSetelanAi, pesanAmanAi, type SetelanAi } from '~/adapters/cashflowAi'
import { bacaCookie, hapusCookie, ipKlien, pasangToken, wajibIkatan, wajibSatuAsal } from './h3'
import { rakitTujuan } from './jalur'
import { teruskan } from './proxy'

export interface AdminAi {
  email: string
  role: string
}

/** Cookie sesi console yang sah dan peran ber-cashflow:view; 401/403 bila tidak. */
export async function wajibAdminAi(event: H3Event): Promise<AdminAi> {
  wajibSatuAsal(event)
  wajibIkatan(event)

  const config = useRuntimeConfig(event)
  const gatewayUrl = config.public.gatewayUrl as string
  const tujuan = rakitTujuan(gatewayUrl, 'admin/auth/me', '')
  if (!tujuan) throw createError({ statusCode: 502, statusMessage: 'gateway-gagal' })

  const hasil = await teruskan(
    {
      metode: 'GET', jalur: 'admin/auth/me', tujuan,
      header: new Headers({ accept: 'application/json' }),
      akses: bacaCookie(event, 'akses'), segar: bacaCookie(event, 'segar'),
    },
    { gatewayUrl, fetch, timeoutMs: 8000, klienIp: ipKlien(event) },
  )
  if (hasil.hapusCookie) hapusCookie(event, ['akses', 'segar'])
  else if (hasil.tokenBaru) pasangToken(event, hasil.tokenBaru)

  if (hasil.respons.status === 401 || hasil.respons.status === 403) {
    throw createError({ statusCode: 401, statusMessage: 'cookie-ditolak' })
  }
  if (!hasil.respons.ok) throw createError({ statusCode: 502, statusMessage: 'gateway-gagal' })

  const badan = await hasil.respons.json().catch(() => null) as
    { data?: { email?: unknown; role?: unknown; is_active?: unknown } } | null
  const me = badan?.data
  if (!me || me.is_active !== true) throw createError({ statusCode: 401, statusMessage: 'cookie-ditolak' })
  if (!peranBoleh(typeof me.role === 'string' ? me.role : null, 'cashflow:view')) {
    throw createError({ statusCode: 403, statusMessage: 'tanpa-izin' })
  }
  return { email: typeof me.email === 'string' ? me.email : '', role: typeof me.role === 'string' ? me.role : '' }
}

/** Access token Supabase dari Authorization: Bearer. Bentuk JWT dan panjang wajar. */
export function tokenSupabaseAi(event: H3Event): string | null {
  const auth = getHeader(event, 'authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice(7).trim()
  if (!token || token.length > 4096) return null
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ? token : null
}

/** Kunci penyedia dari env server; string kosong bila belum dipasang. */
export const kunciPenyediaAi = (): string => (process.env.OPENAI_API_KEY ?? '').trim()

export interface SetelanServerAi {
  setelan: SetelanAi
  /** 'rpc' = dibaca dari admin_ai_setelan; 'bawaan' = RPC tidak bisa dipakai. */
  dari: 'rpc' | 'bawaan'
  /** Keterangan singkat untuk layar; null bila RPC berhasil. */
  galat: string | null
}

/**
 * Setelan AI dari RPC admin_ai_setelan memakai token sesi CashFlow halaman.
 * Gagal apa pun (token tidak ada, RPC belum terpasang, jaringan) = nilai
 * bawaan, bukan galat keras: katalog dan uji tetap bisa dipakai dengan alamat
 * penyedia bawaan, dan halaman menyebut dari mana nilainya.
 */
export async function bacaSetelanAi(event: H3Event, token: string | null): Promise<SetelanServerAi> {
  const bawaan: SetelanServerAi = { setelan: keSetelanAi(null), dari: 'bawaan', galat: null }
  if (!token) return bawaan
  const config = useRuntimeConfig(event)
  const url = ((config.public.cashflowSupabaseUrl as string) ?? '').replace(/\/+$/, '')
  const anon = (config.public.cashflowSupabaseAnonKey as string) ?? ''
  if (!url || !anon) return { ...bawaan, galat: 'Modul CashFlow belum dikonfigurasi di server.' }

  try {
    const r = await fetch(`${url}/rest/v1/rpc/admin_ai_setelan`, {
      method: 'POST',
      headers: {
        apikey: anon,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return { ...bawaan, galat: keteranganRpc(r.status) }
    const j = await r.json().catch(() => null)
    if (!j || typeof j !== 'object') return { ...bawaan, galat: 'Setelan dari server bentuknya tidak dikenal.' }
    return { setelan: keSetelanAi(j), dari: 'rpc', galat: null }
  } catch {
    return { ...bawaan, galat: 'Setelan tidak terbaca dari server. Nilai bawaan dipakai.' }
  }
}

const keteranganRpc = (status: number): string => {
  if (status === 401 || status === 403) return 'Sesi ini tidak berhak membaca setelan. Nilai bawaan dipakai.'
  if (status === 404) return 'Setelan asisten belum ada di server. Nilai bawaan dipakai.'
  return `Setelan tidak terbaca dari server (HTTP ${status}). Nilai bawaan dipakai.`
}

/**
 * Badan galat penyedia yang aman: tanpa kunci, tanpa token, satu baris.
 * Dipakai route uji dan models saat penyedia menolak.
 */
export const galatPenyediaAi = (status: number, badan: unknown): string => {
  const b = (badan ?? {}) as { error?: { message?: unknown }; message?: unknown }
  const pesan = pesanAmanAi(b.error?.message ?? b.message ?? '')
  return pesan ? `${pesan} (HTTP ${status})` : `Penyedia menolak permintaan (HTTP ${status}).`
}

/** Galat penyedia untuk route (status 502/429) tanpa membocorkan kunci. */
export function lemparGalatPenyedia(status: number, badan: unknown): never {
  if (status === 401 || status === 403) {
    throw createError({ statusCode: 502, statusMessage: 'kunci-ditolak', data: { pesan: 'Penyedia menolak kunci API di server.' } })
  }
  if (status === 429) {
    throw createError({ statusCode: 429, statusMessage: 'batas-penyedia', data: { pesan: 'Kuota penyedia sedang penuh. Coba lagi sebentar.' } })
  }
  if (status === 400 || status === 404) {
    throw createError({ statusCode: 502, statusMessage: 'model-ditolak', data: { pesan: galatPenyediaAi(status, badan) } })
  }
  throw createError({ statusCode: 502, statusMessage: 'penyedia-gagal', data: { pesan: galatPenyediaAi(status, badan) } })
}
