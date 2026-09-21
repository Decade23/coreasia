/**
 * POST /api/admin/refresh — perbarui cookie sesi console dari cookie refresh.
 *
 * Proxy /api/gw/** sudah me-refresh sendiri saat gateway menjawab 401, jadi
 * klien jarang perlu memanggil ini. Disediakan untuk kebutuhan eksplisit
 * (mis. memperpanjang sesi sebelum aksi panjang).
 *
 * Refresh ditolak gateway (sesi dicabut, token_version berubah, akun nonaktif)
 * → semua cookie sesi dihapus dan 401 diteruskan.
 *
 * Wajib token ikatan dokumen console: jawabannya memuat data admin.
 */
import { segarkanToken } from '../../lib/konsol/proxy'
import { bacaCookie, hapusCookie, ipKlien, pasangToken, perpanjangIkat, tanpaCache, wajibIkatan, wajibSatuAsal } from '../../lib/konsol/h3'

export default defineEventHandler(async (event) => {
  wajibSatuAsal(event)
  wajibIkatan(event)
  tanpaCache(event)

  const segar = bacaCookie(event, 'segar')
  if (!segar) {
    setResponseStatus(event, 401)
    return { data: null, errors: { code: 'UNAUTHORIZED', message: 'Refresh token diperlukan' } }
  }

  const config = useRuntimeConfig(event)
  const hasil = await segarkanToken(segar, { gatewayUrl: config.public.gatewayUrl as string, fetch, klienIp: ipKlien(event) })
  if (hasil.status === 'ok') {
    pasangToken(event, hasil.token)
    perpanjangIkat(event)
    return { data: { user: hasil.data.user ?? null, expires_at: hasil.data.expires_at ?? null } }
  }
  if (hasil.status === 'ditolak') {
    hapusCookie(event, ['akses', 'segar'])
    setResponseStatus(event, 401)
    const isi = await hasil.respons.json().catch(() => null) as { errors?: unknown } | null
    return { data: null, errors: isi?.errors ?? { code: 'UNAUTHORIZED', message: 'Sesi sudah tidak berlaku. Silakan login ulang.' } }
  }
  setResponseStatus(event, 502)
  return { data: null, errors: { code: 'GATEWAY_UNREACHABLE', message: 'Gateway tidak dapat dihubungi.' } }
})
