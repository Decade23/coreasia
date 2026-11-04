/**
 * POST /api/admin/logout — keluar dari console di peramban ini.
 *
 * 1. Siapa yang keluar ditanyakan ke gateway (/admin/auth/me dengan cookie
 *    akses; bila akses sudah habis, lewat refresh). Klaim token tidak dipercaya
 *    mentah-mentah untuk memilih sesi siapa yang dicabut.
 * 2. Semua sesi modul CashFlow milik admin itu dicabut di server, termasuk
 *    tab/perangkat lain, per id admin gateway (admin_konsol_sesi_cabut_admin,
 *    0092) — lib/konsol/cashflow-cabut.ts.
 * 3. Cookie akses, refresh, dan tantangan MFA dihapus.
 *
 * Sesi perangkat tepercaya juga dicabut di gateway /admin/auth/logout.
 * Bila gateway gagal, cookie dipertahankan dan pengguna bisa mencoba lagi.
 * Sesi biasa tetap dapat keluar walau pencabutan CashFlow gagal.
 * Tidak mewajibkan token ikatan: keluar hanya mengurangi hak, dan harus tetap
 * jalan walau dokumen console kehilangan tokennya.
 */
import { cabutSesiCashflowAdmin, idAdminGateway, type PemilikSesi } from '../../lib/konsol/cashflow-cabut'
import { HEADER_KLIEN_IP, segarkanToken, teruskan } from '../../lib/konsol/proxy'
import { klaimJwt } from '../../lib/konsol/cookie'
import { rakitTujuan } from '../../lib/konsol/jalur'
import { bacaCookie, catat, hapusCookie, ipKlien, tanpaCache, wajibSatuAsal } from '../../lib/konsol/h3'

/** Id (+ email sebagai label log) dari data admin gateway (/me atau user hasil
 *  refresh); null bila id tidak sah — pencabutan hanya per id. */
function kePemilik(data: { id?: unknown; email?: unknown } | null | undefined): PemilikSesi | null {
  const id = idAdminGateway(data?.id)
  const email = typeof data?.email === 'string' && data.email.trim() ? data.email.trim() : null
  return id ? { id, email } : null
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
    // Perangkat tepercaya punya pencabutan server, bukan sekadar hapus cookie.
    // Gangguan gateway mempertahankan cookie agar pengguna bisa mencoba lagi.
    if (klaimJwt(akses ?? '')?.device_id || klaimJwt(segar ?? '')?.device_id) {
      const gatewayUrl = config.public.gatewayUrl as string
      const hasil = await teruskan({ metode: 'POST', jalur: 'admin/auth/logout', tujuan: rakitTujuan(gatewayUrl, 'admin/auth/logout', '')!,
        header: new Headers({ accept: 'application/json' }), akses, segar,
      }, { gatewayUrl, fetch, klienIp: ipKlien(event) })
      if (!hasil.respons.ok && hasil.respons.status !== 401) {
        setResponseStatus(event, 502)
        return { data: null, errors: { code: 'LOGOUT_FAILED', message: 'Perangkat belum dapat dicabut. Coba keluar lagi sebentar lagi.' } }
      }
    }
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
