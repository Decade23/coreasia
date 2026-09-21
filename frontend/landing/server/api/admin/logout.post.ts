/**
 * POST /api/admin/logout — keluar dari console di peramban ini.
 *
 * 1. Siapa yang keluar ditanyakan ke gateway (/admin/auth/me dengan cookie
 *    akses; bila akses sudah habis, lewat refresh). Klaim token tidak dipercaya
 *    mentah-mentah untuk memilih sesi siapa yang dicabut.
 * 2. Semua sesi modul CashFlow milik admin itu dicabut di server
 *    (admin_konsol_sesi_cabut_pelaku), termasuk tab/perangkat lain.
 * 3. Cookie akses, refresh, dan tantangan MFA dihapus.
 *
 * Gateway /admin/auth/logout tidak dipanggil: ia hanya menghapus cookie milik
 * domain gateway dan tidak mencabut token apa pun. Untuk mematikan token di
 * semua perangkat, console memanggil /admin/auth/logout-all lewat proxy.
 * Selalu 200 walau langkah 1–2 gagal: keluar tidak boleh tertahan gateway.
 * Tidak mewajibkan token ikatan: keluar hanya mengurangi hak, dan harus tetap
 * jalan walau dokumen console kehilangan tokennya.
 */
import { cabutSesiCashflowPelaku } from '../../lib/konsol/cashflow-cabut'
import { HEADER_KLIEN_IP, segarkanToken } from '../../lib/konsol/proxy'
import { bacaCookie, catat, hapusCookie, ipKlien, tanpaCache, wajibSatuAsal } from '../../lib/konsol/h3'

async function emailPemilik(gatewayUrl: string, akses: string | null, segar: string | null, klienIp: string | null): Promise<string | null> {
  const dasar = gatewayUrl.replace(/\/+$/, '')
  if (akses) {
    try {
      const res = await fetch(`${dasar}/admin/auth/me`, {
        headers: { authorization: `Bearer ${akses}`, accept: 'application/json', ...(klienIp ? { [HEADER_KLIEN_IP]: klienIp } : {}) },
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const isi = await res.json().catch(() => null) as { data?: { email?: unknown } } | null
        if (typeof isi?.data?.email === 'string') return isi.data.email
      }
    } catch { /* lanjut ke refresh */ }
  }
  if (segar) {
    const hasil = await segarkanToken(segar, { gatewayUrl, fetch, timeoutMs: 8000, klienIp })
    const user = hasil.status === 'ok' ? hasil.data.user as { email?: unknown } | undefined : undefined
    if (typeof user?.email === 'string') return user.email
  }
  return null
}

export default defineEventHandler(async (event) => {
  wajibSatuAsal(event)
  tanpaCache(event)

  const config = useRuntimeConfig(event)
  const akses = bacaCookie(event, 'akses')
  const segar = bacaCookie(event, 'segar')
  let cashflow: string = 'tanpa-sesi'
  let email: string | null = null
  if (akses || segar) {
    email = await emailPemilik(config.public.gatewayUrl as string, akses, segar, ipKlien(event))
    if (email) {
      cashflow = await cabutSesiCashflowPelaku(
        { url: config.public.cashflowSupabaseUrl as string, service: config.cashflowSupabaseServiceKey as string },
        email,
      )
    }
  }
  catat(event, 'logout', { email, cashflow })
  hapusCookie(event)
  return { data: { ok: true, cashflow } }
})
