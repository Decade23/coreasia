/**
 * Perekat h3 untuk BFF console: membaca/memasang cookie sesi, menolak asal
 * yang salah, mewajibkan ikatan dokumen console, membatasi serah terima sesi,
 * dan mencatat peristiwa. Logika murninya ada di cookie.ts / asal.ts /
 * ikatan.ts / batas.ts / proxy.ts / sesi.ts (diuji vitest).
 */
import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { createError, getCookie, getHeader, getRequestProtocol, setCookie, setResponseHeader, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'
import { HEADER_IKATAN } from '~/utils/konsol'
import { periksaAsal, HEADER_KONSOL } from './asal'
import { ipKlien as ipKlienMurni, kunciBatas, PembatasJendela } from './batas'
import {
  namaCookie,
  rencanaCookieIkat,
  rencanaCookieToken,
  rencanaHapus,
  SEMUA_JENIS,
  type JenisCookie,
  type PasanganToken,
  type RencanaCookie,
} from './cookie'
import { buatIkat, cocokIkatan, ikatSah, kunciIkatan, tokenIkatan } from './ikatan'

/** https (langsung, atau lewat proxy yang memasang X-Forwarded-Proto). */
export const sambunganAman = (event: H3Event): boolean =>
  getRequestProtocol(event, { xForwardedProto: true }) === 'https'

export const bacaCookie = (event: H3Event, jenis: JenisCookie): string | null =>
  getCookie(event, namaCookie(jenis, sambunganAman(event))) || null

const terapkan = (event: H3Event, rencana: RencanaCookie[]) => {
  for (const r of rencana) setCookie(event, r.nama, r.nilai, r.opsi)
}

export const pasangToken = (event: H3Event, token: PasanganToken) =>
  terapkan(event, rencanaCookieToken(token, sambunganAman(event), Date.now()))

export const hapusCookie = (event: H3Event, jenis: readonly JenisCookie[] = SEMUA_JENIS) =>
  terapkan(event, rencanaHapus(jenis, sambunganAman(event)))

/** 403 bila permintaan bukan dari halaman console sendiri (lihat asal.ts). */
export function wajibSatuAsal(event: H3Event) {
  const hasil = periksaAsal({
    metode: event.method,
    secFetchSite: getHeader(event, 'sec-fetch-site'),
    headerKonsol: getHeader(event, HEADER_KONSOL),
  })
  if (!hasil.ok) throw createError({ statusCode: 403, statusMessage: hasil.sebab })
}

/* ───────────── ikatan dokumen console (lib/konsol/ikatan.ts) ───────────── */

let kunciProses: Buffer | null = null
let sudahDiperingatkan = false

/** Kunci HMAC ikatan. Tanpa rahasia server, kunci acak per proses: benar
 *  untuk satu proses (dev), tetapi di Vercel tiap instans berbeda kunci dan
 *  console akan sering meminta muat ulang. Karena itu dicatat keras. */
function kunci(event: H3Event): Buffer {
  const config = useRuntimeConfig(event)
  const k = kunciIkatan({
    khusus: config.konsolIkatKunci as string,
    cadangan: config.cashflowSupabaseServiceKey as string,
  })
  if (k) return k
  if (!kunciProses) kunciProses = randomBytes(32)
  if (!sudahDiperingatkan) {
    sudahDiperingatkan = true
    const pesan = '[konsol] NUXT_KONSOL_IKAT_KUNCI (atau NUXT_CASHFLOW_SUPABASE_SERVICE_KEY) belum dipasang: kunci ikatan acak per proses'
    if (process.env.VERCEL) console.error(pesan)
    else console.warn(pesan)
  }
  return kunciProses
}

/**
 * Token ikatan untuk HTML navigasi console. Cookie `ikat` yang sah dipakai
 * ulang (tab console lain tetap cocok); yang tidak ada/cacat diganti baru.
 * Cookie SELALU dipasang ulang: Max-Age 30 hari dihitung dari navigasi
 * console terakhir, bukan dari login, supaya tidak habis di tengah sesi yang
 * terus hidup lewat refresh (ikatan basi = simpan ditolak 403).
 */
export function tokenIkatanNavigasi(event: H3Event): string {
  let ikat = bacaCookie(event, 'ikat')
  if (!ikatSah(ikat)) ikat = buatIkat()
  terapkan(event, [rencanaCookieIkat(ikat, sambunganAman(event))])
  return tokenIkatan(kunci(event), ikat)
}

/** Pasang ulang `ikat` yang sah dengan nilai sama (Max-Age dihitung ulang).
 *  Dipanggil saat token sesi di-refresh: umur `ikat` mengikuti sesi. */
export function perpanjangIkat(event: H3Event) {
  const ikat = bacaCookie(event, 'ikat')
  if (ikatSah(ikat)) terapkan(event, [rencanaCookieIkat(ikat, sambunganAman(event))])
}

/** Serah terima login berhasil: `ikat` diganti (nilai tanaman sebelum login
 *  tidak terbawa). Halaman login lalu memuat dokumen console baru, yang
 *  mendapat token dari nilai baru ini. */
export function pasangIkatanBaru(event: H3Event): string {
  const ikat = buatIkat()
  terapkan(event, [rencanaCookieIkat(ikat, sambunganAman(event))])
  return tokenIkatan(kunci(event), ikat)
}

/** 403 'ikatan' bila permintaan tidak membawa token dokumen console yang cocok. */
export function wajibIkatan(event: H3Event) {
  if (!cocokIkatan(kunci(event), bacaCookie(event, 'ikat'), getHeader(event, HEADER_IKATAN))) {
    throw createError({ statusCode: 403, statusMessage: 'ikatan' })
  }
}

/* ───────────── IP klien, pembatas, catatan ───────────── */

export const ipKlien = (event: H3Event): string | null => ipKlienMurni({
  diVercel: !!process.env.VERCEL,
  xRealIp: getHeader(event, 'x-real-ip'),
  xVercelForwardedFor: getHeader(event, 'x-vercel-forwarded-for'),
  cfConnectingIp: getHeader(event, 'cf-connecting-ip'),
  alamatSoket: event.node.req.socket?.remoteAddress ?? null,
})

/**
 * Login dan verifikasi TOTP tidak lewat BFF lagi (dibatasi gateway per IP
 * admin yang asli). Yang dibatasi di sini hanya serah terima token
 * (/api/admin/sesi): satu kali per login, jadi 20 per 15 menit per IP longgar
 * untuk admin dan tetap membatasi banjir panggilan /me ke gateway.
 */
const PEMBATAS = {
  sesi: new PembatasJendela(20, 15 * 60_000),
} as const

/**
 * Pembatas per IP klien sebelum memanggil gateway (lib/konsol/batas.ts).
 * Memulangkan badan 429 bila jatah habis (Retry-After terpasang), null bila lolos.
 */
export function batasi(event: H3Event, jenis: keyof typeof PEMBATAS) {
  const ip = ipKlien(event)
  const hasil = PEMBATAS[jenis].periksa(kunciBatas(ip), Date.now())
  if (hasil.ok) return null
  catat(event, 'dibatasi', { jenis, tunggu: hasil.tungguDetik })
  setResponseStatus(event, 429)
  setResponseHeader(event, 'retry-after', hasil.tungguDetik)
  return {
    data: null,
    errors: { code: 'TOO_MANY_REQUESTS', message: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(hasil.tungguDetik / 60)} menit.` },
  }
}

/**
 * Satu baris log per peristiwa console. Untuk aksi lewat proxy, gateway
 * mencatat IP keluar Vercel di ip_address dan IP yang DILAPORKAN BFF di
 * reported_client_ip; log ini salinan sisi Vercel untuk korelasi (waktu,
 * jalur, email; runbook Langkah 3). Tanpa badan, query, token, atau sandi.
 */
export function catat(event: H3Event, peristiwa: string, data: Record<string, unknown> = {}) {
  console.info(`[konsol] ${JSON.stringify({
    peristiwa,
    ...data,
    ip: ipKlien(event),
    vercel_id: getHeader(event, 'x-vercel-id') ?? null,
  })}`)
}

/** Jawaban BFF tidak boleh disimpan cache mana pun. */
export function tanpaCache(event: H3Event) {
  setResponseHeader(event, 'cache-control', 'no-store')
  setResponseHeader(event, 'x-content-type-options', 'nosniff')
}
