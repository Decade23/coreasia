/** Perubahan sesi hanya di BFF: token baru tidak pernah dikirim ke JS. */
import type { H3Event } from 'h3'
import { getHeader, readBody, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'
import { bacaCookie, hapusCookie, ipKlien, pasangToken, perpanjangIkat, tanpaCache, wajibIkatan, wajibSatuAsal } from './h3'
import { rakitTujuan } from './jalur'
import { teruskan } from './proxy'
import { periksaBadanSesi } from './sesi'

export async function perbaruiSesiPerangkat(event: H3Event, jalur: 'admin/auth/totp/step-up' | 'admin/auth/devices/enroll') {
  wajibSatuAsal(event)
  wajibIkatan(event)
  tanpaCache(event)
  const gatewayUrl = useRuntimeConfig(event).public.gatewayUrl as string
  const tujuan = rakitTujuan(gatewayUrl, jalur, '')
  if (!tujuan) {
    setResponseStatus(event, 502)
    return { data: null, errors: { code: 'GATEWAY_UNREACHABLE', message: 'Gateway tidak dapat dihubungi.' } }
  }
  // Hanya code boleh diteruskan. Pemilik, masa percaya, dan id dipilih gateway.
  const badan = jalur.endsWith('step-up') ? await readBody<{ code?: unknown }>(event) : null
  const header = new Headers({ 'content-type': 'application/json', accept: 'application/json' })
  const ua = getHeader(event, 'user-agent')
  if (ua) header.set('user-agent', ua.slice(0, 512))
  const hasil = await teruskan({ metode: 'POST', jalur, tujuan, header,
    body: new TextEncoder().encode(JSON.stringify(badan ? { code: typeof badan.code === 'string' ? badan.code : '' } : {})),
    akses: bacaCookie(event, 'akses'), segar: bacaCookie(event, 'segar'),
  }, { gatewayUrl, fetch, klienIp: ipKlien(event) })
  if (hasil.hapusCookie) hapusCookie(event)
  else if (hasil.tokenBaru) pasangToken(event, hasil.tokenBaru)
  const isi = await hasil.respons.json().catch(() => null) as { data?: Record<string, unknown>; errors?: unknown } | null
  if (!hasil.respons.ok) {
    setResponseStatus(event, hasil.respons.status)
    return { data: null, errors: isi?.errors ?? { code: 'SESSION_UPDATE_FAILED', message: 'Sesi belum dapat diperbarui.' } }
  }
  const cek = periksaBadanSesi(isi?.data, Date.now())
  if (!cek.ok) {
    setResponseStatus(event, 502)
    return { data: null, errors: { code: 'SESSION_UPDATE_FAILED', message: 'Sesi belum dapat diperbarui.' } }
  }
  pasangToken(event, cek.token)
  perpanjangIkat(event)
  return { data: { ok: true } }
}
