/**
 * /api/gw/** — proxy console → gateway (Fase 0c).
 *
 * Peramban console tidak lagi memegang token gateway dan tidak lagi memanggil
 * gateway langsung. Setiap panggilan useAdminApi masuk ke sini:
 *   1. asal wajib halaman console sendiri (Sec-Fetch-Site: same-origin, dan
 *      X-Console: 1 untuk metode selain GET/HEAD) — lihat lib/konsol/asal.ts —
 *      DAN token ikatan dokumen console (X-Konsol-Ikat) untuk SEMUA metode:
 *      halaman publik satu-asal (GTM) lolos Sec-Fetch-Site, tetapi tidak
 *      punya token itu — lihat lib/konsol/ikatan.ts;
 *   2. jalur divalidasi daftar putih (hanya /admin/…, tanpa traversal, tanpa
 *      host lain, rute BFF ditolak) — lihat lib/konsol/jalur.ts;
 *   3. cookie akses HttpOnly → Authorization: Bearer; cookie, Host, dan header
 *      hop-by-hop peramban tidak diteruskan; badan mentah diteruskan apa adanya
 *      (termasuk multipart unggah gambar);
 *   4. gateway 401 + ada cookie refresh → refresh sekali di server, cookie
 *      diperbarui, permintaan diulang — lihat lib/konsol/proxy.ts;
 *   5. jawaban (JSON, biner, stream) diteruskan dengan status & content-type asli;
 *   6. IP klien dikirim di X-Konsol-Klien-IP (lib/konsol/proxy.ts): gateway
 *      mencatatnya di audit sebagai IP yang DILAPORKAN BFF, di samping IP
 *      keluar Vercel yang dilihatnya sendiri;
 *   7. satu baris log per permintaan (metode, jalur tanpa query, status, IP
 *      klien, email dari klaim token);
 *   8. gateway baru saja mengakhiri semua sesi seorang admin (akun sendiri:
 *      logout-all dsb.; admin LAIN: cabut sesi, reset TOTP, hapus, ubah
 *      sandi/email/peran/status) → sesi CashFlow admin itu dicabut, dan
 *      hasilnya dilaporkan di header X-Konsol-Cashflow-Cabut supaya console
 *      bisa meminta runbook Langkah 1 bila gagal.
 */
import { metodeAman } from '../../lib/konsol/asal'
import { cabutSesiCashflowAdmin } from '../../lib/konsol/cashflow-cabut'
import { klaimJwt } from '../../lib/konsol/cookie'
import { HEADER_CABUT_CASHFLOW } from '~/utils/konsol'
import { bacaCookie, catat, hapusCookie, ipKlien, pasangToken, perpanjangIkat, wajibIkatan, wajibSatuAsal } from '../../lib/konsol/h3'
import { pecahPathProxy, rakitTujuan, validasiJalur } from '../../lib/konsol/jalur'
import { saringHeaderKeluar, saringHeaderMasuk, teruskan } from '../../lib/konsol/proxy'

const METODE = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'])

export default defineEventHandler(async (event) => {
  wajibSatuAsal(event)
  wajibIkatan(event)
  if (!METODE.has(event.method)) throw createError({ statusCode: 405, statusMessage: 'metode' })

  const bagian = pecahPathProxy(event.path)
  const cek = bagian ? validasiJalur(bagian.jalur) : { ok: false as const, sebab: 'kosong' as const }
  if (!bagian || !cek.ok) {
    const sebab = cek.ok ? 'kosong' : cek.sebab
    const tidakAda = sebab === 'di-luar-daftar' || sebab === 'pakai-bff'
    throw createError({ statusCode: tidakAda ? 404 : 400, statusMessage: `jalur-${sebab}` })
  }

  const config = useRuntimeConfig(event)
  const gatewayUrl = config.public.gatewayUrl as string
  const tujuan = rakitTujuan(gatewayUrl, cek.jalur, bagian.query)
  if (!tujuan) throw createError({ statusCode: 400, statusMessage: 'jalur-tujuan' })

  const body = metodeAman(event.method) ? null : ((await readRawBody(event, false)) ?? null)
  const akses = bacaCookie(event, 'akses')
  const hasil = await teruskan({
    metode: event.method,
    jalur: cek.jalur,
    tujuan,
    header: saringHeaderMasuk(event.headers),
    body: body ? new Uint8Array(body) : null,
    akses,
    segar: bacaCookie(event, 'segar'),
  }, { gatewayUrl, fetch, klienIp: ipKlien(event) })

  // Email dari klaim token yang dipakai (tanpa verifikasi): hanya untuk log.
  const email = klaimJwt(hasil.tokenBaru?.akses ?? akses)?.email
  catat(event, 'proxy', {
    metode: event.method,
    jalur: cek.jalur,
    status: hasil.respons.status,
    email: typeof email === 'string' ? email : null,
  })

  if (hasil.hapusCookie) hapusCookie(event)
  else if (hasil.tokenBaru) {
    pasangToken(event, hasil.tokenBaru)
    perpanjangIkat(event)
  }
  const bahanCashflow = { url: config.public.cashflowSupabaseUrl as string, service: config.cashflowSupabaseServiceKey as string }
  if (hasil.pemilikSesiBerakhir) {
    // Per id admin gateway DAN per email (sesi terbitan sebelum 0092) — cashflow-cabut.ts.
    setResponseHeader(event, HEADER_CABUT_CASHFLOW, await cabutSesiCashflowAdmin(bahanCashflow, hasil.pemilikSesiBerakhir))
  } else if (hasil.adminLainBerakhir) {
    // Admin LAIN: hanya per id. Emailnya tidak diketahui dari jalur, dan
    // mencabut per label bisa mengenai admin lain yang pernah memakainya.
    const cf = await cabutSesiCashflowAdmin(bahanCashflow, { id: hasil.adminLainBerakhir })
    catat(event, 'cabut-admin-lain', { admin_gw_id: hasil.adminLainBerakhir, jalur: cek.jalur, cashflow: cf })
    setResponseHeader(event, HEADER_CABUT_CASHFLOW, cf)
  }

  const { respons } = hasil
  setResponseStatus(event, respons.status)
  saringHeaderKeluar(respons.headers).forEach((nilai, nama) => setResponseHeader(event, nama, nilai))
  if (event.method === 'HEAD' || !respons.body || respons.status === 204 || respons.status === 304) {
    await respons.body?.cancel().catch(() => {})
    return sendNoContent(event, respons.status)
  }
  return sendStream(event, respons.body)
})
