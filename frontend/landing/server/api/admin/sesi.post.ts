/**
 * POST /api/admin/sesi — serah terima token hasil login langsung ke gateway.
 *
 * Halaman /console/login mengirim sandi ke gateway /admin/auth/login (dan kode
 * ke /admin/auth/totp/verify) LANGSUNG dari peramban, supaya pembatas per IP
 * dan audit gateway melihat IP admin yang asli, bukan IP keluar Vercel. Sandi
 * dan kode tidak pernah melewati server Nitro. Pasangan token hasilnya
 * diserahkan ke rute ini:
 *
 *   1. asal wajib halaman console sendiri: Sec-Fetch-Site: same-origin,
 *      X-Console: 1, dan token ikatan dokumen console (lib/konsol/ikatan.ts).
 *      Ini hanya menutup RUTE ini bagi skrip halaman publik. Menanam cookie
 *      sesi langsung lewat document.cookie ditahan awalan `__Host-Http-`
 *      (lib/konsol/cookie.ts), kecuali di peramban tanpa dukungannya (Safari):
 *      risiko sisa di docs/runbook-console.md "Batas yang diketahui";
 *   2. dibatasi per IP klien (lib/konsol/h3.ts batasi);
 *   3. bentuk & pasangan token diperiksa (lib/konsol/sesi.ts), lalu token akses
 *      divalidasi gateway (/admin/auth/me: tanda tangan, typ, token_version,
 *      is_active). Pemiliknya harus sama dengan `sub` token;
 *   4. cookie HttpOnly akses & segar dipasang (sama dengan refresh), cookie
 *      `ikat` diganti. Jawabannya hanya {user}; halaman login lalu memuat
 *      dokumen console baru sehingga token di memori halaman login ikut hilang.
 */
import type { H3Event } from 'h3'
import { batasi, catat, ipKlien, pasangIkatanBaru, pasangToken, tanpaCache, wajibIkatan, wajibSatuAsal } from '../../lib/konsol/h3'
import { rakitTujuan } from '../../lib/konsol/jalur'
import { teruskan } from '../../lib/konsol/proxy'
import { periksaBadanSesi } from '../../lib/konsol/sesi'

interface JawabanMe {
  data?: { id?: unknown; email?: unknown; is_active?: unknown; mfa?: unknown } & Record<string, unknown>
}

const galat = (event: H3Event, status: number, code: string, message: string) => {
  setResponseStatus(event, status)
  return { data: null, errors: { code, message } }
}

export default defineEventHandler(async (event) => {
  wajibSatuAsal(event)
  wajibIkatan(event)
  tanpaCache(event)

  const dibatasi = batasi(event, 'sesi')
  if (dibatasi) return dibatasi

  const cek = periksaBadanSesi(await readBody(event).catch(() => null), Date.now())
  if (!cek.ok) {
    catat(event, 'sesi-ditolak', { sebab: cek.sebab })
    return galat(event, 400, 'SESI_TIDAK_SAH', 'Token login tidak dikenal. Silakan login ulang.')
  }

  const config = useRuntimeConfig(event)
  const gatewayUrl = config.public.gatewayUrl as string
  const tujuan = rakitTujuan(gatewayUrl, 'admin/auth/me', '')
  if (!tujuan) return galat(event, 502, 'GATEWAY_UNREACHABLE', 'Gateway tidak dapat dihubungi.')

  // Hanya token akses; tanpa refresh di sini (segar: null).
  const hasil = await teruskan(
    { metode: 'GET', jalur: 'admin/auth/me', tujuan, header: new Headers({ accept: 'application/json' }), akses: cek.token.akses, segar: null },
    { gatewayUrl, fetch, timeoutMs: 8000, klienIp: ipKlien(event) },
  )
  const status = hasil.respons.status
  if (status === 401 || status === 403) {
    catat(event, 'sesi-ditolak', { sebab: 'gateway', status })
    return galat(event, 401, 'UNAUTHORIZED', 'Sesi login ditolak gateway. Silakan login ulang.')
  }
  if (!hasil.respons.ok) {
    await hasil.respons.body?.cancel().catch(() => {})
    catat(event, 'sesi-gagal', { status })
    return galat(event, 502, 'GATEWAY_UNREACHABLE', 'Gateway tidak dapat dihubungi.')
  }
  const me = ((await hasil.respons.json().catch(() => null)) as JawabanMe | null)?.data
  if (!me || me.id !== cek.sub || me.is_active !== true) {
    catat(event, 'sesi-ditolak', { sebab: 'pemilik' })
    return galat(event, 401, 'UNAUTHORIZED', 'Sesi login ditolak. Silakan login ulang.')
  }

  pasangToken(event, cek.token)
  pasangIkatanBaru(event)
  catat(event, 'sesi', { email: typeof me.email === 'string' ? me.email : null, mfa: me.mfa === true })
  return { data: { user: me } }
})
