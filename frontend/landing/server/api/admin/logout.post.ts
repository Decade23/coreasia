/**
 * POST /api/admin/logout — keluar dari console di peramban ini.
 *
 * 1. Siapa yang keluar ditanyakan ke gateway (/admin/auth/me dengan cookie
 *    akses; bila akses sudah habis, lewat refresh). Klaim token tidak dipercaya
 *    mentah-mentah untuk memilih sesi siapa yang dicabut.
 * 2. Semua sesi modul CashFlow milik admin itu dicabut di server, termasuk
 *    tab/perangkat lain: per id admin gateway (admin_konsol_sesi_cabut_admin,
 *    0092) DAN per email untuk sesi yang dicetak sebelum 0092
 *    (admin_konsol_sesi_cabut_pelaku) — lib/konsol/cashflow-cabut.ts.
 * 3. Cookie akses, refresh, dan tantangan MFA dihapus.
 *
 * Gateway /admin/auth/logout tidak dipanggil: ia hanya menghapus cookie milik
 * domain gateway dan tidak mencabut token apa pun. Untuk mematikan token di
 * semua perangkat, console memanggil /admin/auth/logout-all lewat proxy.
 * Selalu 200 walau langkah 1–2 gagal: keluar tidak boleh tertahan gateway.
 * Tidak mewajibkan token ikatan: keluar hanya mengurangi hak, dan harus tetap
 * jalan walau dokumen console kehilangan tokennya.
 */
import { cabutSesiCashflowAdmin, idAdminGateway, type PemilikSesi } from '../../lib/konsol/cashflow-cabut'
import { HEADER_KLIEN_IP, segarkanToken } from '../../lib/konsol/proxy'
import { bacaCookie, catat, hapusCookie, ipKlien, tanpaCache, wajibSatuAsal } from '../../lib/konsol/h3'

/** Id + email dari data admin gateway (/me atau user hasil refresh); null bila keduanya tidak ada. */
function kePemilik(data: { id?: unknown; email?: unknown } | null | undefined): PemilikSesi | null {
  const id = idAdminGateway(data?.id)
  const email = typeof data?.email === 'string' && data.email.trim() ? data.email.trim() : null
  return id || email ? { id, email } : null
}

async function pemilikSesi(gatewayUrl: string, akses: string | null, segar: string | null, klienIp: string | null): Promise<PemilikSesi | null> {
  const dasar = gatewayUrl.replace(/\/+$/, '')
  if (akses) {
    try {
      const res = await fetch(`${dasar}/admin/auth/me`, {
        headers: { authorization: `Bearer ${akses}`, accept: 'application/json', ...(klienIp ? { [HEADER_KLIEN_IP]: klienIp } : {}) },
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const isi = await res.json().catch(() => null) as { data?: { id?: unknown; email?: unknown } } | null
        const pemilik = kePemilik(isi?.data)
        if (pemilik) return pemilik
      }
    } catch { /* lanjut ke refresh */ }
  }
  if (segar) {
    const hasil = await segarkanToken(segar, { gatewayUrl, fetch, timeoutMs: 8000, klienIp })
    if (hasil.status === 'ok') return kePemilik(hasil.data.user as { id?: unknown; email?: unknown } | undefined)
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
  let pemilik: PemilikSesi | null = null
  if (akses || segar) {
    pemilik = await pemilikSesi(config.public.gatewayUrl as string, akses, segar, ipKlien(event))
    if (pemilik) {
      cashflow = await cabutSesiCashflowAdmin(
        { url: config.public.cashflowSupabaseUrl as string, service: config.cashflowSupabaseServiceKey as string },
        pemilik,
      )
    }
  }
  catat(event, 'logout', { email: pemilik?.email ?? null, admin_gw_id: pemilik?.id ?? null, cashflow })
  hapusCookie(event)
  return { data: { ok: true, cashflow } }
})
